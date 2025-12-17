// AuditForm.tsx
import React, { useEffect, useState } from "react";
import { categories, initialQuestions, Question } from "../data/questions";
import { QuestionItem } from "./QuestionItem";
import { QuestionsState, ImagesState, NonCriticalEntry } from "./types";
import { loadAuditData, saveAnswer, uploadImage } from "../supabaseAudit";
import { AuditActions } from "./AuditActions";
import { supabase } from "../supabaseClient";
import { AdminPanel } from "./AdminPanel";
import { NonCriticalEntries } from "./Noncriticalentries";

export const AuditForm: React.FC = () => {
  const [auditId, setAuditId] = useState<number | null>(null);
  const [auditInput, setAuditInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"Krytyczne" | "Niekrytyczne">("Krytyczne");
  const [activeTabCategory, setActiveTabCategory] = useState<string>(categories[0]);
  const [questions, setQuestions] = useState<QuestionsState>({});
  const [imagesState, setImagesState] = useState<ImagesState>({});
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [finishedAudits, setFinishedAudits] = useState<number[]>([]);
  const [auditorName, setAuditorName] = useState<string>("");
  const [leaderName, setLeaderName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [nonCriticalEntries, setNonCriticalEntries] = useState<NonCriticalEntry[]>([]);

  // ---- Wczytaj zakończone audyty
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

  // ---- Wczytaj ostatni niezakończony audyt, audytora i lidera
  useEffect(() => {
    const lastAudit = localStorage.getItem("lastUnfinishedAudit");
    const lastAuditor = localStorage.getItem("lastAuditorName");
    const lastLeader = localStorage.getItem("lastLeaderName");
    const lastCategory = localStorage.getItem("lastActiveCategory");

    const restoreAudit = async () => {
      if (!lastAudit) return;

      const id = parseInt(lastAudit);
      if (isNaN(id)) return;

      // Sprawdź czy audyt istnieje w bazie
      const { data: existing } = await supabase
        .from("audit_answers")
        .select("*")
        .eq("audit_id", id)
        .limit(1)
        .single();

      if (existing && !existing.is_finished) {
        setAuditId(id);
        if (lastAuditor) setAuditorName(lastAuditor);
        if (lastLeader) setLeaderName(lastLeader);
        if (lastCategory && categories.includes(lastCategory)) setActiveTabCategory(lastCategory);
      } else {
        // usuń nieaktualny audyt z localStorage
        localStorage.removeItem("lastUnfinishedAudit");
        localStorage.removeItem("lastAuditorName");
        localStorage.removeItem("lastLeaderName");
      }
    };

    restoreAudit();
  }, []);

  // ---- Zapis audytora do localStorage przy zmianie
  useEffect(() => {
    if (auditorName.trim()) localStorage.setItem("lastAuditorName", auditorName.trim());
  }, [auditorName]);

  // ---- Zapis lidera do localStorage przy zmianie
  useEffect(() => {
    if (leaderName.trim()) localStorage.setItem("lastLeaderName", leaderName.trim());
  }, [leaderName]);

  // ---- Ładowanie audytu
  useEffect(() => {
    if (auditId === null) return;
    if (auditId === 999 && auditorName.trim().toLowerCase() === "admin") return;

    const load = async () => {
      setLoading(true);

      // 1️⃣ Pobranie pytań i obrazków
      const { questions: loadedQuestions, images: loadedImages } = await loadAuditData(auditId);
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

      // 2️⃣ Pobranie audytora
      const { data: auditorData } = await supabase
        .from("audit_answers")
        .select("auditor_name, leader_name")
        .eq("audit_id", auditId)
        .limit(1)
        .single();

      if (auditorData?.auditor_name) setAuditorName(auditorData.auditor_name);
      if (auditorData?.leader_name) setLeaderName(auditorData.leader_name);

      // 3️⃣ Sprawdzenie czy audyt zakończony
      const { data: finishData } = await supabase
        .from("audit_answers")
        .select("is_finished")
        .eq("audit_id", auditId)
        .limit(1)
        .single();

      setIsFinished(finishData?.is_finished ?? false);

      // 4️⃣ Wczytaj wpisy niekrytyczne
      try {
        const { data: entries, error } = await supabase
          .from("non_critical_entries")
          .select("*")
          .eq("audit_id", auditId)
          .order("id", { ascending: true });

        if (!error && entries) setNonCriticalEntries(entries as NonCriticalEntry[]);
        else setNonCriticalEntries([]);
      } catch (err) {
        console.error("❌ Błąd wczytywania non-critical entries:", err);
        setNonCriticalEntries([]);
      }

      setLoading(false);
    };

    load();
  }, [auditId, auditorName]);

  // ---- Obsługa wpisania numeru audytu
  const handleAuditSubmit = async () => {
    if (!auditInput || !auditorName.trim()) return;
    const num = parseInt(auditInput);
    if (isNaN(num)) return;

    setAuditId(num);
    localStorage.setItem("lastUnfinishedAudit", num.toString());
    localStorage.setItem("lastAuditorName", auditorName.trim());
    localStorage.setItem("lastLeaderName", leaderName.trim());

    if (num === 999 && auditorName.trim().toLowerCase() === "admin") return;

    setLoading(true);

    const { data: existing } = await supabase
      .from("audit_answers")
      .select("*")
      .eq("audit_id", num)
      .limit(1)
      .single();

    // ---- Nowy audyt
    if (!existing) {
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
            leader_name: leaderName.trim() || null, // <-- zapis lidera
            updated_at: nowIso,
          });
        }
      }

      setIsFinished(false);
      setLoading(false);
      return;
    }

    // ---- Istniejący audyt
    if (existing.is_finished) {
      alert("Ten obchód jest zakończony i nie można go edytować.");
      setIsFinished(true);
    } else {
      setIsFinished(false);
      if (auditorName.trim() || leaderName.trim()) {
        await supabase
          .from("audit_answers")
          .update({ 
            auditor_name: auditorName.trim(), 
            leader_name: leaderName.trim() // <-- aktualizacja lidera
          })
          .eq("audit_id", num);
      }
    }

    setLoading(false);
  };

  // ---- Reset audytu
  const handleAuditReset = () => {
    setAuditId(null);
    setQuestions({});
    setImagesState({});
    setAuditInput("");
    setActiveTab("Krytyczne");
    setActiveTabCategory(categories[0]);
    setAuditDate(null);
    setIsFinished(false);
    setAuditorName("");
    setLeaderName("");
    setNonCriticalEntries([]);
    localStorage.removeItem("lastActiveCategory");
    localStorage.removeItem("lastUnfinishedAudit");
    localStorage.removeItem("lastAuditorName");
    localStorage.removeItem("lastLeaderName");
  };

  // ---- Aktualizacja odpowiedzi
  const setAnswerFn = (cat: string, id: string, value: boolean | undefined) => {
    if (isFinished) return;
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q => (q.id === id ? { ...q, answer: value } : q));
      const updated = updatedCategory.find(q => q.id === id);
      if (updated && auditId !== null) saveAnswer(auditId, cat, updated);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  const updateNoteFn = (cat: string, id: string, note: string) => {
    if (isFinished) return;
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q => (q.id === id ? { ...q, note } : q));
      const updated = updatedCategory.find(q => q.id === id);
      if (updated && auditId !== null) saveAnswer(auditId, cat, updated);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  const addImageFn = async (cat: string, id: string, files: FileList) => {
    if (auditId === null || isFinished) return;
    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) uploaded.push(await uploadImage(auditId, cat, id, files[i]));

    setImagesState(prev => ({
      ...prev,
      [cat]: { ...(prev[cat] || {}), [id]: [...(prev[cat]?.[id] || []), ...uploaded] },
    }));

    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q => (q.id === id ? { ...q, images: [...(q.images || []), ...uploaded] } : q));
      const updated = updatedCategory.find(q => q.id === id);
      if (updated) saveAnswer(auditId, cat, updated);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  // ---- Admin panel
  if (auditId === 999 && auditorName.trim().toLowerCase() === "admin") {
    return <AdminPanel auditId={auditId} auditorName={auditorName} />;
  }

  // ---- Ekran wczytania audytu
  if (auditId === null) {
    return (
      <div style={{
        padding: 20,
        maxWidth: 400,
        margin: "50px auto",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ marginBottom: 20 }}>Wpisz numer obchodu</h2>

        <input
          type="text"
          value={auditorName}
          onChange={e => setAuditorName(e.target.value)}
          placeholder="Imię i nazwisko audytora"
          style={{
            padding: 12,
            fontSize: 16,
            width: "100%",
            marginBottom: 15,
            borderRadius: 8,
            border: "1px solid #ccc",
            boxSizing: "border-box"
          }}
        />

        <input
          type="text"
          value={leaderName}
          onChange={e => setLeaderName(e.target.value)}
          placeholder="Imię i nazwisko Lidera"
          style={{
            padding: 12,
            fontSize: 16,
            width: "100%",
            marginBottom: 15,
            borderRadius: 8,
            border: "1px solid #ccc",
            boxSizing: "border-box"
          }}
        />

        <input
          type="number"
          value={auditInput}
          onChange={e => setAuditInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAuditSubmit(); }}
          placeholder="Numer obchodu"
          style={{
            padding: 12,
            fontSize: 16,
            width: "100%",
            marginBottom: 20,
            borderRadius: 8,
            border: "1px solid #ccc",
            boxSizing: "border-box"
          }}
        />

        <button
          onClick={handleAuditSubmit}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            backgroundColor: "#1464f4",
            color: "white",
            border: "none",
            borderRadius: 8,
            width: "100%",
            marginBottom: 25,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}
        >
          {loading ? "Ładowanie..." : "Wczytaj obchód"}
        </button>

        <h3 style={{ marginBottom: 10 }}>Zakończone obchody</h3>
        <select
          style={{
            padding: 12,
            fontSize: 16,
            width: "100%",
            borderRadius: 8,
            border: "1px solid #ccc",
            boxSizing: "border-box"
          }}
          onChange={e => {
            const id = Number(e.target.value);
            if (id) {
              setAuditId(id);
              setIsFinished(true);
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

  // ---- Ekran główny audytu
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <p>📌 Numer obchodu: <strong>{auditId}</strong></p>
      {auditDate && <p>📅 Data: <strong>{new Date(auditDate).toLocaleString()}</strong></p>}
      {auditorName && <p>🧑 Audytor: <strong>{auditorName}</strong></p>}
      {leaderName && <p>👤 Lider: <strong>{leaderName}</strong></p>}

      <AuditActions
        auditId={auditId}
        isFinished={isFinished}
        onStartNewAudit={handleAuditReset}
        onFinishAudit={() => setIsFinished(true)}
        questions={questions}
        imagesState={imagesState}
        auditorName={auditorName}
          leaderName={leaderName}
      />

      <div style={{ display: "flex", marginBottom: 10 }}>
        {["Krytyczne", "Niekrytyczne"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "Krytyczne" | "Niekrytyczne")}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: activeTab === tab ? "#e3f2fd" : "white",
              border: "1px solid #ccc",
              fontWeight: activeTab === tab ? "bold" : "normal",
              cursor: "pointer"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Krytyczne */}
      {activeTab === "Krytyczne" && (
        <div>
          <div style={{ display: 'flex', marginBottom: 10 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveTabCategory(cat); localStorage.setItem("lastActiveCategory", cat); }}
                style={{
                  flex: 1,
                  padding: 8,
                  backgroundColor: activeTabCategory === cat ? '#e3f2fd' : 'white',
                  border: '1px solid #ccc',
                  fontWeight: activeTabCategory === cat ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {questions[activeTabCategory]?.map(q => (
            <QuestionItem
              key={q.id}
              q={q}
              activeTab={activeTabCategory}
              setAnswer={setAnswerFn}
              updateNote={updateNoteFn}
              addImageToQuestion={addImageFn}
              images={imagesState[activeTabCategory]?.[q.id] || []}
              auditId={auditId}
              imagesState={imagesState}
              setImagesState={setImagesState}
              questions={questions}
              setQuestions={setQuestions}
              saveAnswer={saveAnswer}
              isFinished={isFinished}
            />
          ))}
        </div>
      )}

      {/* Niekrytyczne */}
      {activeTab === "Niekrytyczne" && auditId && (
        <NonCriticalEntries auditId={auditId} />
      )}
    </div>
  );
};
