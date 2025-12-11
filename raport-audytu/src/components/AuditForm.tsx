import React, { useEffect, useState } from "react";
import { categories, initialQuestions, Question } from "../data/questions";
import { Tabs } from "./Tabs";
import { QuestionItem } from "./QuestionItem";
import { QuestionsState, ImagesState } from "./types";
import { loadAuditData, saveAnswer, uploadImage } from "../supabaseAudit";
import { generatePDF } from "../utils/generatePDF";
import { AuditActions } from "./AuditActions";
import { exportToExcel } from "../utils/exportToExcel";
import { supabase } from "../supabaseClient";
import { AdminPanel } from "./AdminPanel";

export const AuditForm: React.FC = () => {
  const [auditId, setAuditId] = useState<number | null>(null);
  const [auditInput, setAuditInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(categories[0]);
  const [questions, setQuestions] = useState<QuestionsState>({});
  const [imagesState, setImagesState] = useState<ImagesState>({});
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [finishedAudits, setFinishedAudits] = useState<number[]>([]);
  const [auditorName, setAuditorName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 🔹 Wczytaj zakończone audyty
  useEffect(() => {
    const loadFinished = async () => {
      const { data } = await supabase
        .from("audit_answers")
        .select("audit_id")
        .eq("is_finished", true);

      if (data) {
        const uniq = Array.from(new Set(data.map((x: any) => x.audit_id)));
        setFinishedAudits(uniq);
      }
    };
    loadFinished();
  }, []);

  // 🔹 Wczytaj ostatni niezakończony audyt
  useEffect(() => {
    const last = localStorage.getItem("lastUnfinishedAudit");
    if (last) {
      const id = parseInt(last);
      if (!isNaN(id)) setAuditId(id);
    }
  }, []);

  // 🔹 Ładowanie audytu
  useEffect(() => {
    if (auditId === null) return;
    if (auditId === 999 && auditorName.trim().toLowerCase() === "admin") return;

    const load = async () => {
      setLoading(true);

      // --- 1: Pobranie najstarszego updated_at (data startu) + finished_at (koniec audytu)
      const { data: dateData } = await supabase
        .from("audit_answers")
        .select("updated_at, finished_at")
        .eq("audit_id", auditId)
        .order("updated_at", { ascending: true });

      let startDate: string | null = null;
      let finishDate: string | null = null;

      if (dateData && dateData.length > 0) {
        startDate = dateData[0].updated_at; // najstarszy wpis = początek audytu
        finishDate = dateData.find((x: any) => x.finished_at)?.finished_at || null;
      }

      // IMPORTANT: nie nadpisujemy lokalnej daty jeśli nie mamy nic z bazy
      setAuditDate(prev => prev || (finishDate || startDate || null));

      // --- 2: Pobieranie reszty danych
      const { questions: loadedQuestions, images: loadedImages } =
        await loadAuditData(auditId);

      const fullQuestions: QuestionsState = {};
      const fullImages: ImagesState = {};

      categories.forEach(cat => {
        fullQuestions[cat] = initialQuestions.map((q, i) => {
          const qid = (i + 1).toString();
          const loaded = loadedQuestions[cat]?.find((lq: Question) => lq.id === qid);

          return {
            ...q,
            id: qid,
            answer: loaded?.answer ?? undefined,
            note: loaded?.note ?? "",
            images: loaded?.images ?? [],
          };
        });

        fullImages[cat] = loadedImages[cat] || {};
      });

      setQuestions(fullQuestions);
      setImagesState(fullImages);

      // --- 3: Pobranie audytora
      const { data: auditorData } = await supabase
        .from("audit_answers")
        .select("auditor_name")
        .eq("audit_id", auditId)
        .limit(1)
        .single();

      if (auditorData?.auditor_name) setAuditorName(auditorData.auditor_name);

      // --- 4: Czy audyt zakończony?
      const { data: finishData } = await supabase
        .from("audit_answers")
        .select("is_finished")
        .eq("audit_id", auditId)
        .limit(1)
        .single();

      setIsFinished(finishData?.is_finished ?? false);

      setLoading(false);
    };

    load();
  }, [auditId, auditorName]);

  // 🔹 Obsługa wpisania numeru
  const handleAuditSubmit = async () => {
    if (!auditInput) return;
    const num = parseInt(auditInput);
    if (isNaN(num)) return;

    setAuditId(num);

    if (num === 999 && auditorName.trim().toLowerCase() === "admin") return;

    setLoading(true);

    const { data: existing } = await supabase
      .from("audit_answers")
      .select("*")
      .eq("audit_id", num)
      .limit(1)
      .single();

    // --- Jeśli nie istnieje → stworzenie nowego
    if (!existing) {
      // ustawiamy lokalnie datę startu od razu, żeby użytkownik zobaczył datę przy pierwszym wejściu
      const nowIso = new Date().toISOString();
      setAuditDate(nowIso);

      for (const cat of categories) {
        for (let i = 0; i < initialQuestions.length; i++) {
          const q = initialQuestions[i];
          const qid = (i + 1).toString();

          await supabase.from("audit_answers").insert({
            audit_id: num,
            category: cat,
            question_id: qid,
            question_text: q.text,
            answer: null,
            note: "",
            images: JSON.stringify([]),
            is_finished: false,
            auditor_name: auditorName.trim() || null,
            updated_at: nowIso, // ZAPIS daty startu
          });
        }
      }

      localStorage.setItem("lastUnfinishedAudit", num.toString());
      setIsFinished(false);
      setLoading(false);
      return;
    }

    // --- Audyt istnieje
    if (existing.is_finished) {
      alert("Ten obchód jest zakończony i nie można go edytować.");
      setIsFinished(true);
      setLoading(false);
    } else {
      setIsFinished(false);
      if (auditorName.trim()) {
        await supabase
          .from("audit_answers")
          .update({ auditor_name: auditorName.trim() })
          .eq("audit_id", num);
      }
      setLoading(false);
    }
  };

  const handleAuditReset = () => {
    setAuditId(null);
    setQuestions({});
    setImagesState({});
    setAuditInput("");
    setActiveTab(categories[0]);
    setAuditDate(null);
    setIsFinished(false);
    setAuditorName("");
  };

  // 🔹 Aktualizacja odpowiedzi
  const setAnswerFn = (cat: string, id: string, value: boolean | undefined) => {
    if (isFinished) return;
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q =>
        q.id === id ? { ...q, answer: value } : q
      );
      const updated = updatedCategory.find(q => q.id === id);

      if (updated && auditId !== null) saveAnswer(auditId, cat, updated);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  const updateNoteFn = (cat: string, id: string, note: string) => {
    if (isFinished) return;
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q =>
        q.id === id ? { ...q, note } : q
      );
      const updated = updatedCategory.find(q => q.id === id);

      if (updated && auditId !== null) saveAnswer(auditId, cat, updated);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  const addImageFn = async (cat: string, id: string, files: FileList) => {
    if (auditId === null || isFinished) return;

    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      uploaded.push(await uploadImage(auditId, cat, id, files[i]));
    }

    setImagesState(prev => ({
      ...prev,
      [cat]: {
        ...(prev[cat] || {}),
        [id]: [...(prev[cat]?.[id] || []), ...uploaded],
      },
    }));

    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q =>
        q.id === id ? { ...q, images: [...(q.images || []), ...uploaded] } : q
      );
      const updated = updatedCategory.find(q => q.id === id);

      if (updated) saveAnswer(auditId, cat, updated);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  const downloadAllImages = async (imagesState: any) => {
    for (const line of Object.keys(imagesState)) {
      for (const qId of Object.keys(imagesState[line])) {
        for (let i = 0; i < imagesState[line][qId].length; i++) {
          try {
            const url = imagesState[line][qId][i];
            const blob = await (await fetch(url)).blob();

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${line}_pytanie${qId}_${i + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch (e) {
            console.error("Błąd pobierania zdjęcia:", e);
          }
        }
      }
    }
  };

  // 🔹 Admin panel
  if (auditId === 999 && auditorName.trim().toLowerCase() === "admin") {
    return <AdminPanel auditId={auditId} auditorName={auditorName} />;
  }

  // 🔹 Ekran wczytania audytu
  if (auditId === null) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
        <h2>Wpisz numer obchodu</h2>

        <input
          type="text"
          value={auditorName}
          onChange={e => setAuditorName(e.target.value)}
          placeholder="Imię i nazwisko audytora"
          style={{ padding: 10, fontSize: 16, width: "100%", marginBottom: 10 }}
        />

        <input
          type="number"
          value={auditInput}
          onChange={e => setAuditInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAuditSubmit(); }}
          placeholder="Numer obchodu"
          style={{ padding: 10, fontSize: 16, width: "100%", marginBottom: 10 }}
        />

        <button
          onClick={handleAuditSubmit}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#1464f4",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            width: "100%",
            marginBottom: 20
          }}
        >
          {loading ? "Ładowanie..." : "Wczytaj obchód"}
        </button>

        <h3>Zakończone obchody</h3>
        <select
          style={{ padding: 10, fontSize: 16, width: "100%" }}
          onChange={e => {
            const id = Number(e.target.value);
            if (id) {
              setAuditId(id);
              setIsFinished(true);
              // gdy wchodzimy do zakończonego audytu, wyczyść lokalną datę (załóżmy że pobierzemy z bazy)
              setAuditDate(null);
            }
          }}
        >
          <option value="">— wybierz —</option>
          {finishedAudits.map(id => (
            <option key={id} value={id}>
              Obchód {id}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // 🔹 Ekran główny audytu
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Zagadnienia krytyczne</h1>

      <p>📌 Numer obchodu: <strong>{auditId}</strong></p>

      {auditDate && (
        <p>📅 Data: <strong>{new Date(auditDate).toLocaleString()}</strong></p>
      )}

      {auditorName && (
        <p>🧑 Audytor: <strong>{auditorName}</strong></p>
      )}

      <AuditActions
        auditId={auditId}
        isFinished={isFinished}
        onStartNewAudit={handleAuditReset}
        onFinishAudit={() => setIsFinished(true)}
      />

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {questions[activeTab]?.map(q => (
        <QuestionItem
          key={q.id}
          q={q}
          activeTab={activeTab}
          setAnswer={setAnswerFn}
          updateNote={updateNoteFn}
          addImageToQuestion={addImageFn}
          images={imagesState[activeTab]?.[q.id] || []}
          auditId={auditId}
          imagesState={imagesState}
          setImagesState={setImagesState}
          questions={questions}
          setQuestions={setQuestions}
          saveAnswer={saveAnswer}
          isFinished={isFinished}
        />
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#1464f4",
            color: "white",
            border: "none",
            borderRadius: 6,
          }}
          onClick={() => generatePDF(questions, imagesState, auditorName)}
        >
          📄 Pobierz PDF
        </button>

        <button
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: 6,
          }}
          onClick={() => exportToExcel(questions, auditId)}
        >
          📊 Eksport do Excel
        </button>

        <button onClick={() => downloadAllImages(imagesState)}>
          Pobierz wszystkie zdjęcia
        </button>
      </div>
    </div>
  );
};
