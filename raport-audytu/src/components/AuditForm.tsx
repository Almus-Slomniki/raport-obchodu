import React, { useEffect, useState } from "react";
import { categories, initialQuestions, Question } from "../data/questions";
import { QuestionsState, ImagesState, NonCriticalEntry } from "./types";
import { loadAuditData, saveAnswer, uploadImage, setCategoryDisabled } from "../supabaseAudit";
import { AuditActions } from "./AuditActions";
import { supabase } from "../supabaseClient";
import { AdminPanel } from "./AdminPanel";
import { NonCriticalEntries } from "./Noncriticalentries";
import { AuditLoader } from "./AuditLoader";
import { AuditTabs } from "./AuditTabs";
import { CategorySelector } from "./CategorySelector";
import { CriticalQuestions } from "./CriticalQuestions";
import "./AuditForm.css";

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
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
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
      const disabledSet = new Set<string>();

      categories.forEach(cat => {
        qState[cat] = initialQuestions.map((q, i) => {
          const qid = String(i + 1);
          const loaded = loadedQuestions[cat]?.find((lq: Question & { disabled?: boolean }) => lq.id === qid);

          if (loaded?.disabled) disabledSet.add(cat);

          return {
            ...q,
            id: qid,
            answer: loaded?.answer === true || loaded?.answer === false ? loaded.answer : undefined,
            note: loaded?.note ?? "",
            images: loaded?.images ?? [],
            disabled: loaded?.disabled ?? false,
          };
        });
        iState[cat] = loadedImages[cat] || {};
      });

      setQuestions(qState);
      setImagesState(iState);
      setDisabledCategories(Array.from(disabledSet));

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
    if (isFinished || !auditId || disabledCategories.includes(cat)) return;
    setQuestions(prev => {
      const updated = prev[cat].map(q => (q.id === id ? { ...q, answer: value } : q));
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  const updateNoteFn = (cat: string, id: string, note: string) => {
    if (isFinished || !auditId || disabledCategories.includes(cat)) return;
    setQuestions(prev => {
      const updated = prev[cat].map(q => (q.id === id ? { ...q, note } : q));
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  const addImageFn = async (cat: string, id: string, files: FileList) => {
    if (!auditId || isFinished || disabledCategories.includes(cat)) return;
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

  /* ------------------ TOGGLE WYŁĄCZENIA LINII ------------------ */
  const handleToggleCategory = async (cat: string) => {
    if (!auditId || isFinished) return;
    const nextDisabled = !disabledCategories.includes(cat);

    const ok = await setCategoryDisabled(auditId, cat, nextDisabled);
    if (!ok) return;

    setDisabledCategories(prev =>
      nextDisabled ? [...prev, cat] : prev.filter(c => c !== cat)
    );
  };

  /* ------------------ START / RESET ------------------ */
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

  /* ------------------ RENDER ------------------ */
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
      <div className="start-wrapper">
        <div className="start-section">
          <button className="start-button" onClick={handleStartNewAudit}>
            Rozpocznij nowy obchód
          </button>

          <div className="load-section">
            <h3>Wczytaj audyt po numerze</h3>
            <input
              type="number"
              value={inputAuditId}
              onChange={e => setInputAuditId(e.target.value)}
              placeholder="Wpisz numer audytu"
            />
            <button onClick={() => { if (inputAuditId) setAuditId(Number(inputAuditId)); }}>
              Wczytaj audyt
            </button>
          </div>
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
        disabledCategories={disabledCategories}      // 🔹 dodane
        onToggleCategory={handleToggleCategory}      // 🔹 dodane
        isCategoryComplete={cat =>
          questions[cat]?.length === initialQuestions.length &&
          questions[cat].every(q => q.answer === true || q.answer === false)
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
