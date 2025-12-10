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

export const AuditForm: React.FC = () => {
  const [auditId, setAuditId] = useState<number | null>(null);
  const [auditInput, setAuditInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(categories[0]);
  const [questions, setQuestions] = useState<QuestionsState>({});
  const [imagesState, setImagesState] = useState<ImagesState>({});
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false); // read-only mode
  const [finishedAudits, setFinishedAudits] = useState<number[]>([]);

  // 🔹 Wczytaj zakończone audyty z Supabase
  useEffect(() => {
    const loadFinished = async () => {
      const { data, error } = await supabase
        .from("audit_answers")
        .select("audit_id")
        .eq("is_finished", true);

      if (!error && data) {
        const uniqueIds = Array.from(new Set(data.map((x: any) => x.audit_id)));
        setFinishedAudits(uniqueIds);
      }
    };

    loadFinished();
  }, []);

  // 🔹 Wczytaj ostatni niezakończony audyt
  useEffect(() => {
    const lastAudit = localStorage.getItem("lastUnfinishedAudit");
    if (lastAudit) {
      const num = parseInt(lastAudit);
      if (!isNaN(num)) setAuditId(num);
    }
  }, []);

  // 🔹 Wczytaj dane audytu
  useEffect(() => {
    if (auditId === null) return;

    const load = async () => {
      const { questions: loadedQuestions, images: loadedImages, auditDate } =
        await loadAuditData(auditId);

      setAuditDate(auditDate ?? new Date().toISOString());

      const fullQuestions: QuestionsState = {};
      const fullImages: ImagesState = {};

      categories.forEach(cat => {
        fullQuestions[cat] = initialQuestions.map((q, index) => {
          const questionId = (index + 1).toString();
          const loadedQ = loadedQuestions[cat]?.find((lq: Question) => lq.id === questionId);

          return {
            ...q,
            id: questionId,
            answer: loadedQ?.answer ?? undefined,
            note: loadedQ?.note ?? "",
            images: loadedQ?.images ?? [],
          };
        });

        fullImages[cat] = loadedImages[cat] || {};
      });

      setQuestions(fullQuestions);
      setImagesState(fullImages);

      // 🔹 Jeśli audyt jest zakończony, blokujemy edycję
      const finishedCheck = await supabase
        .from("audit_answers")
        .select("is_finished")
        .eq("audit_id", auditId)
        .limit(1)
        .single();

      if (finishedCheck.data?.is_finished) setIsFinished(true);
      else setIsFinished(false);
    };

    load();
  }, [auditId]);

  // 🔹 Obsługa wpisania numeru audytu
  const handleAuditSubmit = async () => {
    if (!auditInput) return;
    const num = parseInt(auditInput);
    if (!isNaN(num)) {
      // Sprawdź, czy audyt nie jest zakończony
      const { data, error } = await supabase
        .from("audit_answers")
        .select("is_finished")
        .eq("audit_id", num)
        .limit(1)
        .single();

      if (error) {
        alert("Błąd pobrania audytu.");
        return;
      }

      if (data?.is_finished) {
        alert("Ten obchód jest zakończony i nie można go edytować.");
        setAuditId(num);
        setIsFinished(true);
      } else {
        setAuditId(num);
        localStorage.setItem("lastUnfinishedAudit", num.toString());
        setIsFinished(false);
      }
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
  };

  // 🔹 Aktualizacja odpowiedzi
  const setAnswerFn = (cat: string, id: string, value: boolean | undefined) => {
    if (isFinished) return;
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q => (q.id === id ? { ...q, answer: value } : q));
      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion && auditId !== null) saveAnswer(auditId, cat, updatedQuestion);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  // 🔹 Aktualizacja notatek
  const updateNoteFn = (cat: string, id: string, note: string) => {
    if (isFinished) return;
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q => (q.id === id ? { ...q, note } : q));
      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion && auditId !== null) saveAnswer(auditId, cat, updatedQuestion);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  // 🔹 Upload zdjęć
  const addImageFn = async (cat: string, id: string, files: FileList) => {
    if (auditId === null || isFinished) return;

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(auditId, cat, id, files[i]);
      uploadedUrls.push(url);
    }

    setImagesState(prev => ({
      ...prev,
      [cat]: {
        ...(prev[cat] || {}),
        [id]: [...(prev[cat]?.[id] || []), ...uploadedUrls],
      },
    }));

    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q =>
        q.id === id ? { ...q, images: [...(q.images || []), ...uploadedUrls] } : q
      );
      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion) saveAnswer(auditId, cat, updatedQuestion);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  // 🔹 Pobierz wszystkie zdjęcia
  const downloadAllImages = async (imagesState: any) => {
    for (const line of Object.keys(imagesState)) {
      for (const qId of Object.keys(imagesState[line])) {
        const images = imagesState[line][qId];
        for (let i = 0; i < images.length; i++) {
          const url = images[i];
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${line}_pytanie${qId}_${i + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            await new Promise(r => setTimeout(r, 100));
          } catch (e) {
            console.error("Błąd pobierania:", url, e);
          }
        }
      }
    }
  };

  // 🔹 Ekran wpisania numeru audytu
  if (auditId === null) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
        <h2>Wpisz numer obchodu</h2>

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
          Wczytaj obchód
        </button>

        {/* 🔽 Select z zakończonymi audytami */}
        <h3>Lub wybierz zakończony obchód</h3>
        <select
          style={{ padding: 10, fontSize: 16, width: "100%" }}
          onChange={e => {
            const id = Number(e.target.value);
            if (id) {
              setAuditId(id);
              setIsFinished(true); // read-only
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

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Zagadnienia krytyczne</h1>
      <p>📌 Numer obchodu: <strong>{auditId}</strong></p>
      {auditDate && <p>📅 Data rozpoczęcia: <strong>{new Date(auditDate).toLocaleString()}</strong></p>}

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
            cursor: "pointer",
          }}
          onClick={() => generatePDF(questions, imagesState)}
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
            cursor: "pointer",
          }}
          onClick={() => exportToExcel(questions, auditId)}
        >
          📊 Eksport do Excel
        </button>

        <button onClick={() => downloadAllImages(imagesState)}>Pobierz wszystkie zdjęcia</button>
      </div>
    </div>
  );
};
