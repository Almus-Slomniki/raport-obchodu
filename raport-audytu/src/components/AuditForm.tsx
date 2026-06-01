// AuditForm.tsx
import React, { useEffect, useState } from "react";
import { categories, initialQuestions } from "../data/questions";
import { QuestionsState, ImagesState, NonCriticalEntry } from "./types";
import { loadAuditData, saveAnswer, uploadImage, setCategoryDisabled } from "../supabaseAudit";
import { AuditActions } from "./AuditActions";
import { supabase } from "../supabaseClient";
import { NonCriticalEntries } from "./Noncriticalentries";
import { AuditLoader } from "./AuditLoader";
import { AuditTabs } from "./AuditTabs";
import { CategorySelector } from "./CategorySelector";
import { CriticalQuestions } from "./CriticalQuestions";
import "./AuditForm.css";

export const AuditForm: React.FC = () => {
  const fixedLeadersList = [
    "Ilona Hardyn", "Anna Dobrzanowska", "Agata Kutela", "Piotr Nowak",
    "Barbara Zelek", "Maria Górowska", "Karolina Balec", "Mateusz Kosak",
    "Hubert Golonka", "Patrycja Kuśpiel"
  ];

  /* ------------------ STANY ------------------ */
 const [auditId, setAuditId] = useState<number | null>(null);
 
  const [inputAuditId, setInputAuditId] = useState("");
  const [activeTab, setActiveTab] = useState<"Krytyczne" | "Niekrytyczne">(() => {
    const t = localStorage.getItem("lastActiveTab");
    return t === "Krytyczne" || t === "Niekrytyczne" ? t : "Krytyczne";
  });
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

  /* ------------------ ZAPIS TAB ------------------ */
  useEffect(() => localStorage.setItem("lastActiveTab", activeTab), [activeTab]);

  /* ------------------ LOAD AUDIT ------------------ */
/* ------------------ LOAD AUDIT ------------------ */
useEffect(() => {
  if (!auditId) return;
  if (auditId === 999 && auditorName.toLowerCase() === "admin") return;

  localStorage.setItem("currentAuditId", String(auditId)); // zapis audytu

  const load = async () => {
    setLoading(true);
    try {
      // 1️⃣ Pobierz pytania i obrazy z funkcji pomocniczej
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
            category_comment: loaded?.category_comment ?? "",
          };
        });

        iState[cat] = {};
        const catImages = loadedImages[cat] || {};
        Object.entries(catImages).forEach(([qId, imgs]) => {
          iState[cat][qId.toString()] = imgs as string[];
        });
      });

      setQuestions(qState);
      setImagesState(iState);

      // 2️⃣ Pobierz pełne odpowiedzi z audit_answers
     const { data: answers, error } = await supabase
  .from("audit_answers")
  .select("*")
  .eq("audit_id", auditId);

console.log("AUDIT ANSWERS ERROR:", error);
console.log("AUDIT ANSWERS:", answers);

      if (answers && answers.length > 0) {
        const updatedQuestions: QuestionsState = { ...qState };

        categories.forEach(cat => {
          updatedQuestions[cat] = initialQuestions.map((q, i) => {
            const qid = String(i + 1);
            const loaded = answers.find(a => a.category === cat && a.question_id === qid);
            return {
              ...q,
              id: qid,
              answer: loaded?.answer === true || loaded?.answer === false ? loaded.answer : undefined,
              note: loaded?.note ?? "",
              images: loaded?.images ?? [],
              disabled: loaded?.disabled ?? false,
              category_comment: loaded?.category_comment ?? "",
            };
          });
        });

        setQuestions(updatedQuestions);

        // Meta dane audytu
const meta = answers.find(a => a.leader_name) ?? answers[0];

console.log("META:", meta);
console.log("LEADER:", meta?.leader_name);

if (meta?.auditor_name) {
  setAuditorName(meta.auditor_name);
}

if (meta?.leader_name) {
  setLeaderName(meta.leader_name);
  console.log("USTAWIONO LEADER:", meta.leader_name);
}

setIsFinished(meta?.is_finished ?? false);
      }

      // 3️⃣ Pobierz dane niekrytyczne
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
  /* ------------------ USTAW AKTYWNĄ KATEGORIĘ PO ZAŁADOWANIU PYTAŃ ------------------ */
  useEffect(() => {
    if (!auditId || Object.keys(questions).length === 0) return;

    const savedCategory = localStorage.getItem(`lastActiveCategory_${auditId}`);
    if (savedCategory && categories.includes(savedCategory)) {
      setActiveCategory(savedCategory);
    } else {
      setActiveCategory(categories[0]);
    }
  }, [auditId, questions]);

  /* ------------------ ZAPIS KATEGORII ------------------ */
  useEffect(() => {
    if (!auditId) return;
    localStorage.setItem(`lastActiveCategory_${auditId}`, activeCategory);
  }, [activeCategory, auditId]);

  /* ------------------ HELPERS ------------------ */
  const isCategoryDisabled = (cat: string) => questions[cat]?.[0]?.disabled === true;

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

  // ✅ POPRAWIONE: File[] zamiast FileList
  const addImageFn = async (cat: string, id: string, files: File[]) => {
    if (!auditId || isFinished || isCategoryDisabled(cat)) return;

    const urls: string[] = [];
    for (const file of files) {
      urls.push(await uploadImage(auditId, cat, id, file));
    }

    setQuestions(prev => {
      const updated = prev[cat].map(q => q.id === id ? { ...q, images: [...q.images, ...urls] } : q);
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });

    setImagesState(prev => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [id]: [...(prev[cat]?.[id] || []), ...urls]
      }
    }));
  };

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
        category_comment: nextDisabled ? comment : "",
      })),
    }));
  };

  const handleAuditSubmit = async () => {
    if (!leaderName.trim()) return;

    setLoading(true);
    const { data } = await supabase.rpc("get_next_audit_id");
    const id = Number(data);
    setAuditId(id);
    localStorage.setItem("currentAuditId", String(id));

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

          <button className="start-button" onClick={() => setStartingAudit(true)}>Rozpocznij nowy obchód</button>
          <div className="load-section">
            <div className="load-block">
              <input
                type="number"
                placeholder="Numer audytu"
                value={inputAuditId}
                onChange={e => setInputAuditId(e.target.value)}
              />
              <button
                onClick={() => {
                  const id = Number(inputAuditId);
                  setAuditId(id);
                  localStorage.setItem("currentAuditId", String(id));
                }}
              >
                Wczytaj istniejący
              </button>
            </div>
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
        onStartNewAudit={() => {
          setAuditId(null);
          localStorage.removeItem("currentAuditId");
        }}
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
          addImageFn={addImageFn} // ✅ teraz File[]
          setQuestions={setQuestions}
          setImagesState={setImagesState}
        />
      )}

      {activeTab === "Niekrytyczne" && (
        <NonCriticalEntries auditId={auditId} activeCategory={activeCategory} isFinished={isFinished}/>
      )}
    </div>
  );
};