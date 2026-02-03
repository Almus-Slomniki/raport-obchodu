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
  const [inputAuditId, setInputAuditId] = useState("");
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

  /* ------------------ AUDITOR ------------------ */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setAuditorName(data.user.user_metadata.full_name || data.user.email || "");
      }
    });
  }, []);

  /* ------------------ LOCAL STORAGE ------------------ */
  useEffect(() => {
    const c = localStorage.getItem("lastActiveCategory");
    const t = localStorage.getItem("lastActiveTab");
    if (c && categories.includes(c)) setActiveCategory(c);
    if (t === "Krytyczne" || t === "Niekrytyczne") setActiveTab(t);
  }, []);
  useEffect(() => localStorage.setItem("lastActiveCategory", activeCategory), [activeCategory]);
  useEffect(() => localStorage.setItem("lastActiveTab", activeTab), [activeTab]);

  /* ------------------ LOAD AUDIT ------------------ */
  useEffect(() => {
    if (!auditId) return;
    if (auditId === 999 && auditorName.toLowerCase() === "admin") return;

    const load = async () => {
      setLoading(true);
      try {
        const { questions: loadedQuestions, images: loadedImages } = await loadAuditData(auditId);

        const qState: QuestionsState = {};
        const iState: ImagesState = {};

        categories.forEach(cat => {
          const isCategoryDisabled = loadedQuestions[cat]?.some(q => q.disabled) ?? false;

          qState[cat] = initialQuestions.map((q, i) => {
            const qid = String(i + 1);
            const loaded = loadedQuestions[cat]?.find(lq => lq.id === qid);

            return {
              ...q,
              id: qid,
              answer: loaded?.answer === true || loaded?.answer === false ? loaded.answer : undefined,
              note: loaded?.note ?? "",
              images: loaded?.images ?? [],
              disabled: isCategoryDisabled,
              category_comment: loaded?.category_comment ?? "", // 🔴 WAŻNE: komentarz w stanie
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
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auditId, auditorName]);

  /* ------------------ HELPERS ------------------ */
  const isCategoryDisabled = (cat: string) => questions[cat]?.[0]?.disabled === true;

  /* ------------------ ANSWERS ------------------ */
  const setAnswerFn = (cat: string, id: string, value: boolean | undefined) => {
    if (isFinished || !auditId || isCategoryDisabled(cat)) return;

    setQuestions(prev => {
      const updated = prev[cat].map(q => q.id === id ? { ...q, answer: value } : q);
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  const updateNoteFn = (cat: string, id: string, note: string) => {
    if (isFinished || !auditId || isCategoryDisabled(cat)) return;

    setQuestions(prev => {
      const updated = prev[cat].map(q => q.id === id ? { ...q, note } : q);
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  const addImageFn = async (cat: string, id: string, files: FileList) => {
    if (!auditId || isFinished || isCategoryDisabled(cat)) return;

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(await uploadImage(auditId, cat, id, files[i]));
    }

    setQuestions(prev => {
      const updated = prev[cat].map(q => q.id === id ? { ...q, images: [...q.images, ...urls] } : q);
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  /* ------------------ TOGGLE CATEGORY ------------------ */
  const handleToggleCategory = async (cat: string) => {
    if (!auditId || isFinished) return;

    const currentlyDisabled = isCategoryDisabled(cat);
    const nextDisabled = !currentlyDisabled;

    let comment = "";
    if (nextDisabled) {
      comment = prompt("Podaj powód wyłączenia kategorii:")?.trim() || "";
      if (!comment) {
        alert("Komentarz jest wymagany przy wyłączaniu kategorii!");
        return;
      }
    }

    const ok = await setCategoryDisabled(auditId, cat, nextDisabled, comment ?? null);
    if (!ok) return;

    setQuestions(prev => ({
      ...prev,
      [cat]: prev[cat].map(q => ({
        ...q,
        disabled: nextDisabled,
        category_comment: nextDisabled ? comment : "", // 🔴 komentarz trafia do stanu
      })),
    }));
  };

  /* ------------------ START AUDIT ------------------ */
  const handleAuditSubmit = async () => {
    if (!leaderName.trim()) return;

    setLoading(true);
    const { data } = await supabase.rpc("get_next_audit_id");
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
          disabled: false,
          category_comment: null,
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

  /* ------------------ RENDER ------------------ */
  if (!auditId && startingAudit) {
    return (
      <AuditLoader
        auditorName={auditorName}
        leaderName={leaderName}
        setLeaderName={setLeaderName}
        leadersList={fixedLeadersList}
        handleAuditSubmit={handleAuditSubmit}
        loading={loading}
        onCancel={() => setStartingAudit(false)}
      />
    );
  }

  if (!auditId) {
    return (
      <div className="start-wrapper">
        <div className="start-section">
          <h3>Audyt / Obchód</h3>
          <button className="start-button" onClick={() => setStartingAudit(true)}>Rozpocznij nowy obchód</button>
          <div className="load-section">
            <input type="number" placeholder="ID audytu" value={inputAuditId} onChange={e => setInputAuditId(e.target.value)} />
            <button onClick={() => setAuditId(Number(inputAuditId))}>Wczytaj istniejący</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <AuditActions
        auditId={auditId}
        isFinished={isFinished}
        onStartNewAudit={() => setAuditId(null)}
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
        disabledCategories={categories.filter(isCategoryDisabled)}
        onToggleCategory={handleToggleCategory}
        isCategoryComplete={cat => questions[cat]?.every(q => q.answer === true || q.answer === false)}
      />

      <AuditTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "Krytyczne" && (
        <CriticalQuestions
          activeCategory={activeCategory}
          questions={questions}
          imagesState={imagesState}
          auditId={auditId}
          isFinished={isFinished}
          setAnswerFn={setAnswerFn}
          updateNoteFn={updateNoteFn}
          addImageFn={addImageFn}
          setQuestions={setQuestions} 
          setImagesState={setImagesState} 
        />
      )}

      {activeTab === "Niekrytyczne" && (
        <NonCriticalEntries auditId={auditId} activeCategory={activeCategory} />
      )}
    </div>
  );
};
