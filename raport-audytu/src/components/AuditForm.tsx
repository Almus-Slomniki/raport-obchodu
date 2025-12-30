// AuditForm.tsx
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
  // --- Stałe listy audytorów i liderów
  const fixedAuditorsList = ["Justyna Kubuśka", "Dorota Wołczyk", "Karol Wolka"];
  const fixedLeadersList = ["Ilona Hardyn", "Anna Dobrzanowska", "Agata Kutela", "Piotr Nowak", "Barbara Zelek", "Maria Górowska"];

  const [auditId, setAuditId] = useState<number | null>(null);
  const [auditInput, setAuditInput] = useState("");
  const [activeTab, setActiveTab] = useState<"Krytyczne" | "Niekrytyczne">("Krytyczne");
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);

  const [questions, setQuestions] = useState<QuestionsState>({});
  const [imagesState, setImagesState] = useState<ImagesState>({});
  const [isFinished, setIsFinished] = useState(false);
  const [finishedAudits, setFinishedAudits] = useState<number[]>([]);
  const [auditorName, setAuditorName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [nonCriticalEntries, setNonCriticalEntries] = useState<NonCriticalEntry[]>([]);

  // --- Przywracanie ostatniej kategorii i zakładki
  useEffect(() => {
    const lastCategory = localStorage.getItem("lastActiveCategory");
    const lastTab = localStorage.getItem("lastActiveTab");

    if (lastCategory && categories.includes(lastCategory)) setActiveCategory(lastCategory);
    if (lastTab === "Krytyczne" || lastTab === "Niekrytyczne") setActiveTab(lastTab);
  }, []);

  useEffect(() => localStorage.setItem("lastActiveCategory", activeCategory), [activeCategory]);
  useEffect(() => localStorage.setItem("lastActiveTab", activeTab), [activeTab]);

  // --- Załadowanie zakończonych audytów
  useEffect(() => {
    const loadFinished = async () => {
      const { data } = await supabase.from("audit_answers").select("audit_id").eq("is_finished", true);
      if (data) {
        const uniq = Array.from(new Set(data.map((x: any) => x.audit_id)));
        setFinishedAudits(uniq);
      }
    };
    loadFinished();
  }, []);

  // --- Przywracanie ostatniego audytu
  useEffect(() => {
    const lastAudit = localStorage.getItem("lastUnfinishedAudit");
    const lastAuditor = localStorage.getItem("lastAuditorName");
    const lastLeader = localStorage.getItem("lastLeaderName");

    const restore = async () => {
      if (!lastAudit) return;
      const id = Number(lastAudit);
      if (isNaN(id)) return;
      if (id === 999 && lastAuditor?.toLowerCase() === "admin") return;

      const { data } = await supabase.from("audit_answers").select("*").eq("audit_id", id).limit(1).single();

      if (data && !data.is_finished) {
        setAuditId(id);
        if (lastAuditor) setAuditorName(lastAuditor);
        if (lastLeader) setLeaderName(lastLeader);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    if (auditorName.trim() && !(auditId === 999 && auditorName.toLowerCase() === "admin")) {
      localStorage.setItem("lastAuditorName", auditorName.trim());
    }
  }, [auditorName, auditId]);

  useEffect(() => {
    if (leaderName.trim()) localStorage.setItem("lastLeaderName", leaderName.trim());
  }, [leaderName]);

  // --- Ładowanie audytu
  useEffect(() => {
    if (auditId === null) return;
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
          return { ...q, id: qid, answer: loaded?.answer, note: loaded?.note ?? "", images: loaded?.images ?? [] };
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

  // --- Handlery
  const handleAuditSubmit = async () => {
    if (!auditInput || !auditorName.trim()) return;
    const id = Number(auditInput);
    if (isNaN(id)) return;

    setAuditId(id);
    if (!(id === 999 && auditorName.toLowerCase() === "admin")) localStorage.setItem("lastUnfinishedAudit", String(id));
    if (id === 999 && auditorName.toLowerCase() === "admin") return;

    const { data } = await supabase.from("audit_answers").select("*").eq("audit_id", id).limit(1).single();

    if (!data) {
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
            images: JSON.stringify([]),
            is_finished: false,
            auditor_name: auditorName,
            leader_name: leaderName,
            updated_at: now,
          });
        }
      }
    }
  };

  const handleAuditReset = () => {
    setAuditId(null);
    setQuestions({});
    setImagesState({});
    setAuditInput("");
    setActiveTab("Krytyczne");
    setActiveCategory(categories[0]);
    setAuditorName("");
    setLeaderName("");
    setIsFinished(false);
    localStorage.removeItem("lastUnfinishedAudit");
    localStorage.removeItem("lastAuditorName");
    localStorage.removeItem("lastLeaderName");
    localStorage.removeItem("lastActiveCategory");
    localStorage.removeItem("lastActiveTab");
  };

  const setAnswerFn = (cat: string, id: string, value: boolean | undefined) => {
    if (isFinished || auditId === null) return;
    setQuestions(prev => {
      const updated = prev[cat].map(q => q.id === id ? { ...q, answer: value } : q);
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  const updateNoteFn = (cat: string, id: string, note: string) => {
    if (isFinished || auditId === null) return;
    setQuestions(prev => {
      const updated = prev[cat].map(q => q.id === id ? { ...q, note } : q);
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  const addImageFn = async (cat: string, id: string, files: FileList) => {
    if (auditId === null || isFinished) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) urls.push(await uploadImage(auditId, cat, id, files[i]));

    setImagesState(prev => ({
      ...prev,
      [cat]: { ...(prev[cat] || {}), [id]: [...(prev[cat]?.[id] || []), ...urls] },
    }));

    setQuestions(prev => {
      const updated = prev[cat].map(q => q.id === id ? { ...q, images: [...q.images, ...urls] } : q);
      const q = updated.find(x => x.id === id);
      if (q) saveAnswer(auditId, cat, q);
      return { ...prev, [cat]: updated };
    });
  };

  // --- Sprawdzenie kompletności kategorii
  const isCategoryComplete = (cat: string): boolean => {
    const list = questions[cat];
    if (!list || list.length === 0) return false;
    return list.every(q => q.answer === true || q.answer === false);
  };

  // --- ADMIN
  if (auditId === 999 && auditorName.toLowerCase() === "admin") {
    return <AdminPanel auditId={auditId} auditorName={auditorName} setAuditId={setAuditId} setAuditorName={setAuditorName} />;
  }

  // --- LOADER
  if (auditId === null) {
    return (
      <AuditLoader
        auditInput={auditInput}
        setAuditInput={setAuditInput}
        auditorName={auditorName}
        setAuditorName={setAuditorName}
        leaderName={leaderName}
        setLeaderName={setLeaderName}
        finishedAudits={finishedAudits}
        auditorsList={fixedAuditorsList} // stała lista
        leadersList={fixedLeadersList}   // stała lista
        handleAuditSubmit={handleAuditSubmit}
        loading={loading}
        setAuditId={setAuditId}
        setIsFinished={setIsFinished}
      />
    );
  }

  // --- MAIN VIEW
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
        isCategoryComplete={isCategoryComplete}
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
