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
  const [auditId, setAuditId] = useState<number | null>(null);
  const [auditInput, setAuditInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"Krytyczne" | "Niekrytyczne">("Krytyczne");
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [questions, setQuestions] = useState<QuestionsState>({});
  const [imagesState, setImagesState] = useState<ImagesState>({});
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [finishedAudits, setFinishedAudits] = useState<number[]>([]);
  const [auditorName, setAuditorName] = useState<string>("");
  const [leaderName, setLeaderName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [nonCriticalEntries, setNonCriticalEntries] = useState<NonCriticalEntry[]>([]);

  // ---- useEffect: zakończone audyty
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

  // ---- useEffect: ostatni niezakończony audyt
  useEffect(() => {
    const lastAudit = localStorage.getItem("lastUnfinishedAudit");
    const lastAuditor = localStorage.getItem("lastAuditorName");
    const lastLeader = localStorage.getItem("lastLeaderName");
    const lastCategory = localStorage.getItem("lastActiveCategory");

    const restoreAudit = async () => {
      if (!lastAudit) return;
      const id = parseInt(lastAudit);
      if (isNaN(id)) return;

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
        if (lastCategory && categories.includes(lastCategory)) setActiveCategory(lastCategory);
      } else {
        localStorage.removeItem("lastUnfinishedAudit");
        localStorage.removeItem("lastAuditorName");
        localStorage.removeItem("lastLeaderName");
      }
    };

    restoreAudit();
  }, []);

  // ---- Zapis audytora i lidera
  useEffect(() => {
    if (auditorName.trim()) localStorage.setItem("lastAuditorName", auditorName.trim());
  }, [auditorName]);

  useEffect(() => {
    if (leaderName.trim()) localStorage.setItem("lastLeaderName", leaderName.trim());
  }, [leaderName]);

  // ---- Ładowanie audytu
  useEffect(() => {
    if (auditId === null) return;
    if (auditId === 999 && auditorName.trim().toLowerCase() === "admin") return;

    const load = async () => {
      setLoading(true);
      const { questions: loadedQuestions, images: loadedImages } = await loadAuditData(auditId);
      const fullQuestions: QuestionsState = {};
      const fullImages: ImagesState = {};

      categories.forEach(cat => {
        fullQuestions[cat] = initialQuestions.map((q, i) => {
          const qid = (i + 1).toString();
          const loaded = loadedQuestions[cat]?.find((lq: Question) => lq.id === qid);
          return { ...q, id: qid, answer: loaded?.answer, note: loaded?.note ?? "", images: loaded?.images ?? [] };
        });
        fullImages[cat] = loadedImages[cat] || {};
      });

      setQuestions(fullQuestions);
      setImagesState(fullImages);

      const { data: auditorData } = await supabase
        .from("audit_answers")
        .select("auditor_name, leader_name")
        .eq("audit_id", auditId)
        .limit(1)
        .single();

      if (auditorData?.auditor_name) setAuditorName(auditorData.auditor_name);
      if (auditorData?.leader_name) setLeaderName(auditorData.leader_name);

      const { data: finishData } = await supabase
        .from("audit_answers")
        .select("is_finished")
        .eq("audit_id", auditId)
        .limit(1)
        .single();

      setIsFinished(finishData?.is_finished ?? false);

      try {
        const { data: entries, error } = await supabase
          .from("non_critical_entries")
          .select("*")
          .eq("audit_id", auditId)
          .order("id", { ascending: true });

        if (!error && entries) setNonCriticalEntries(entries as NonCriticalEntry[]);
        else setNonCriticalEntries([]);
      } catch {
        setNonCriticalEntries([]);
      }

      setLoading(false);
    };

    load();
  }, [auditId, auditorName]);

  // ---- Funkcje obsługi audytu
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
            leader_name: leaderName.trim() || null,
            updated_at: nowIso,
          });
        }
      }
      setIsFinished(false);
      setLoading(false);
      return;
    }

    if (existing.is_finished) {
      alert("Ten obchód jest zakończony i nie można go edytować.");
      setIsFinished(true);
    } else {
      setIsFinished(false);
      if (auditorName.trim() || leaderName.trim()) {
        await supabase
          .from("audit_answers")
          .update({ auditor_name: auditorName.trim(), leader_name: leaderName.trim() })
          .eq("audit_id", num);
      }
    }

    setLoading(false);
  };

  const handleAuditReset = () => {
    setAuditId(null);
    setQuestions({});
    setImagesState({});
    setAuditInput("");
    setActiveTab("Krytyczne");
    setActiveCategory(categories[0]);
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

  // ---- Loader audytu
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
        handleAuditSubmit={handleAuditSubmit}
        loading={loading}
        setAuditId={setAuditId}
        setIsFinished={setIsFinished}
      />
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

      <AuditTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "Krytyczne" && (
        <>
          <CategorySelector
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />

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
        </>
      )}

      {activeTab === "Niekrytyczne" && auditId && (
        <NonCriticalEntries auditId={auditId} />
      )}
    </div>
  );
};
