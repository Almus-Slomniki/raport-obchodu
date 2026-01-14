import React, { useEffect, useState } from "react";
import { categories, initialQuestions, Question } from "../data/questions";
import { QuestionsState, ImagesState, NonCriticalEntry } from "./types";
import { loadAuditData, saveAnswer, uploadImage } from "../supabaseAudit";
import { AuditActions } from "./AuditActions";
import { supabase } from "../supabaseClient";
import { AdminPanel } from "./AdminPanel";
import { NonCriticalEntries } from "./Noncriticalentries";
import { AuditLoader } from "./AuditLoader";
import { AuditTabs } from "./AuditTabs";
import { CategorySelector } from "./CategorySelector";
import { CriticalQuestions } from "./CriticalQuestions";

export const AuditForm: React.FC = () => {
  const fixedLeadersList = [
    "Ilona Hardyn",
    "Anna Dobrzanowska",
    "Agata Kutela",
    "Piotr Nowak",
    "Barbara Zelek",
    "Maria Górowska",
  ];

  const [auditId, setAuditId] = useState<number | null>(null);
  const [inputAuditId, setInputAuditId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"Krytyczne" | "Niekrytyczne">("Krytyczne");
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [questions, setQuestions] = useState<QuestionsState>({});
  const [imagesState, setImagesState] = useState<ImagesState>({});
  const [isFinished, setIsFinished] = useState(false);
  const [auditorName, setAuditorName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [nonCriticalEntries, setNonCriticalEntries] = useState<NonCriticalEntry[]>([]);
  const [startingAudit, setStartingAudit] = useState(false);

  /* ------------------ Pobranie zalogowanego audytora ------------------ */
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAuditorName(user.user_metadata.full_name || user.email || "");
    };
    fetchUser();
  }, []);

  /* ------------------ Przywracanie kategorii i zakładki ------------------ */
  useEffect(() => {
    const lastCategory = localStorage.getItem("lastActiveCategory");
    const lastTab = localStorage.getItem("lastActiveTab");
    if (lastCategory && categories.includes(lastCategory)) setActiveCategory(lastCategory);
    if (lastTab === "Krytyczne" || lastTab === "Niekrytyczne") setActiveTab(lastTab);
  }, []);
  useEffect(() => localStorage.setItem("lastActiveCategory", activeCategory), [activeCategory]);
  useEffect(() => localStorage.setItem("lastActiveTab", activeTab), [activeTab]);

  /* ------------------ Ładowanie audytu ------------------ */
  useEffect(() => {
    if (!auditId) return;
    if (auditId === 999 && auditorName.toLowerCase() === "admin") return;

    const load = async () => {
      setLoading(true);
      const { questions: loadedQuestions, images: loadedImages } = await loadAuditData(auditId);
      const qState: QuestionsState = {};
      const iState: ImagesState = {};

      categories.forEach(cat => {
        qState[cat] = initialQuestions.map((q, i) => {
          const qid = String(i + 1);
          const loaded = loadedQuestions[cat]?.find((lq: Question) => lq.id === qid);
          return {
            ...q,
            id: qid,
            answer: loaded?.answer === true || loaded?.answer === false ? loaded.answer : undefined,
            note: loaded?.note ?? "",
            images: loaded?.images ?? [],
          };
        });
        iState[cat] = loadedImages[cat] || {};
      });

      setQuestions(qState);
      setImagesState(iState);

      const { data: meta } = await supabase
        .from("audit_answers")
        .select("auditor_name, leader_name, is_finished")
        .eq("audit_id", auditId)
        .limit(1)
        .single();

      if (meta?.auditor_name) setAuditorName(meta.auditor_name);
      if (meta?.leader_name) setLeaderName(meta.leader_name);
      setIsFinished(meta?.is_finished ?? false);

      const { data: entries } = await supabase
        .from("non_critical_entries")
        .select("*")
        .eq("audit_id", auditId)
        .order("id");

      setNonCriticalEntries((entries as NonCriticalEntry[]) || []);
      setLoading(false);
    };
    load();
  }, [auditId, auditorName]);

  /* ------------------ Handlery pytań ------------------ */
  const setAnswerFn = (cat: string, id: string, value: boolean | undefined) => {
    if (isFinished || !auditId) return;
    setQuestions(prev => {
      const updated = prev[cat].map(q => (q.id === id ? { ...q, answer: value } : q));
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  const updateNoteFn = (cat: string, id: string, note: string) => {
    if (isFinished || !auditId) return;
    setQuestions(prev => {
      const updated = prev[cat].map(q => (q.id === id ? { ...q, note } : q));
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  const addImageFn = async (cat: string, id: string, files: FileList) => {
    if (!auditId || isFinished) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) urls.push(await uploadImage(auditId, cat, id, files[i]));
    setImagesState(prev => ({ ...prev, [cat]: { ...(prev[cat] || {}), [id]: [...(prev[cat]?.[id] || []), ...urls] } }));
    setQuestions(prev => {
      const updated = prev[cat].map(q => (q.id === id ? { ...q, images: [...q.images, ...urls] } : q));
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  /* ------------------ Rozpoczęcie nowego audytu ------------------ */
  const handleStartNewAudit = () => setStartingAudit(true);

  const handleAuditSubmit = async () => {
    if (!leaderName.trim()) return;

    setLoading(true);
    const { data, error } = await supabase.rpc("get_next_audit_id");
    if (error) { console.error(error); setLoading(false); return; }
    const id = Number(data);
    setAuditId(id);

    const now = new Date().toISOString();
    for (const cat of categories) {
      for (let i = 0; i < initialQuestions.length; i++) {
        await supabase.from("audit_answers").insert({
          audit_id: id,
          category: cat,
          question_id: String(i + 1),
          question_text: initialQuestions[i].text,
          answer: null,
          note: "",
          images: [],
          is_finished: false,
          auditor_name: auditorName,
          leader_name: leaderName,
          updated_at: now,
        });
      }
    }
    setStartingAudit(false);
    setLoading(false);
  };

  /* ------------------ Reset audytu ------------------ */
  const handleAuditReset = () => {
    setAuditId(null);
    setQuestions({});
    setImagesState({});
    setActiveTab("Krytyczne");
    setActiveCategory(categories[0]);
    setLeaderName("");
    setIsFinished(false);
    setStartingAudit(false);
    setInputAuditId("");
  };

  /* ------------------ Render ------------------ */
  if (auditId === 999 && auditorName.toLowerCase() === "admin") {
    return <AdminPanel auditId={auditId} auditorName={auditorName} setAuditId={setAuditId} setAuditorName={setAuditorName} />;
  }

  if (auditId === null && startingAudit) {
    return (
      <AuditLoader
        auditorName={auditorName}
        leaderName={leaderName}
        setLeaderName={setLeaderName}
        leadersList={fixedLeadersList}
        handleAuditSubmit={handleAuditSubmit}
        loading={loading}
        onCancel={handleAuditReset}
      />
    );
  }

  if (!auditId) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
        <button
          onClick={handleStartNewAudit}
          style={{ padding: "12px 20px", fontSize: 16, backgroundColor: "#1464f4", color: "white", border: "none", borderRadius: 8, width: "100%", cursor: "pointer", marginBottom: 20 }}
        >
          Rozpocznij nowy obchód
        </button>

        <div style={{ marginBottom: 20 }}>
          <h3>Wczytaj audyt po numerze</h3>
          <input
            type="number"
            value={inputAuditId}
            onChange={e => setInputAuditId(e.target.value)}
            placeholder="Wpisz numer audytu"
            style={{ padding: 10, fontSize: 16, width: "100%", borderRadius: 8, border: "1px solid #ccc", marginBottom: 10 }}
          />
          <button
            onClick={() => { if (inputAuditId) setAuditId(Number(inputAuditId)); }}
            style={{ padding: "10px 20px", fontSize: 16, backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 8, cursor: "pointer", width: "100%" }}
          >
            Wczytaj audyt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
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

      <CategorySelector
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        isCategoryComplete={cat =>
          questions[cat]?.length === 8 && questions[cat].every(q => q.answer === true || q.answer === false)
        }
      />

      <AuditTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "Krytyczne" && (
        <CriticalQuestions
          activeCategory={activeCategory}
          questions={questions}
          setQuestions={setQuestions}
          imagesState={imagesState}
          setImagesState={setImagesState}
          auditId={auditId}
          isFinished={isFinished}
          setAnswerFn={setAnswerFn}
          updateNoteFn={updateNoteFn}
          addImageFn={addImageFn}
        />
      )}

      {activeTab === "Niekrytyczne" && auditId && (
        <NonCriticalEntries auditId={auditId} activeCategory={activeCategory} />
      )}
    </div>
  );
};
