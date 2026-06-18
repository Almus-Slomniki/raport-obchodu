import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { generatePDF } from "../utils/generatePDF";
import { exportToExcel } from "../utils/exportToExcel";
import { generateNonCriticalPDF } from '../utils/generateNonCriticalPDF';
import { exportAllAuditsToExcel } from "../utils/exportAllAuditsToExcel";
import "./AuditActions.css"

interface AuditActionsProps {
  auditId: number;
  isFinished: boolean;
  questions: any;
  imagesState: any;
  auditorName?: string;
  leaderName?: string;
  auditDate?: string | null;
  onStartNewAudit?: () => void;
  onFinishAudit?: () => void;
}

export const AuditActions: React.FC<AuditActionsProps> = ({
  auditId,
  isFinished,
  questions,
  imagesState,
  auditorName,
  leaderName,
  onStartNewAudit,
  onFinishAudit,
}) => {

  // 🔥 NOWE STATE
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startNewAudit = () => {
    const confirmNew = window.confirm(
      "Czy na pewno chcesz zakończyć bieżący obchód i rozpocząć nowy?"
    );
    if (!confirmNew) return;

    localStorage.removeItem("lastUnfinishedAudit");
    onStartNewAudit?.();
  };

  const finishAudit = async () => {
    if (isFinished) return;

    const confirmFinish = window.confirm("Czy na pewno chcesz zakończyć bieżący obchód?");
    if (!confirmFinish) return;

    try {
      const { error } = await supabase
        .from('audit_answers')
        .update({
          is_finished: true,
          finished_at: new Date().toISOString(),
          auditor_name: auditorName?.trim() || null,
          leader_name: leaderName?.trim() || null,
        })
        .eq('audit_id', auditId);

      if (error) {
        alert('Błąd zakończenia audytu.');
        return;
      }

      alert(`Obchód ${auditId} został zakończony.`);
      onFinishAudit?.();
    } catch {
      alert('Błąd zakończenia audytu.');
    }
  };

  // 🔥 PDF z loaderem
  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);

      await generatePDF(
        questions,
        imagesState,
        auditId,
        auditorName,
        leaderName,
        setProgress // 🔥 KLUCZ
      );
    } finally {
      setIsGenerating(false);
    }
  };

const exportNonCriticalPDF = async () => {
  console.log("START PDF", auditId);

  try {
    await generateNonCriticalPDF(auditId);
    console.log("PDF OK");
  } catch (e) {
    console.error("PDF ERROR", e);
  }
};
const checkUnfinishedNonCritical = async () => {
  try {
    const { data: nonCritical, error: nonCriticalError } = await supabase
      .from("non_critical_entries")
      .select("audit_id");

    if (nonCriticalError) {
      alert("Błąd pobierania wpisów niekrytycznych.");
      return;
    }

    const { data: finishedAudits, error: finishedError } = await supabase
      .from("audit_answers")
      .select("audit_id")
      .eq("is_finished", true);

    if (finishedError) {
      alert("Błąd pobierania audytów.");
      return;
    }

    const nonCriticalIds = [
      ...new Set(nonCritical.map(x => x.audit_id))
    ];

    const finishedIds = new Set(
      finishedAudits.map(x => x.audit_id)
    );

    const missing = nonCriticalIds.filter(
      id => !finishedIds.has(id)
    );

    if (missing.length === 0) {
      alert("Wszystkie audyty z wpisami niekrytycznymi są zakończone.");
      return;
    }

    alert(
      `Niezakończone audyty z wpisami niekrytycznymi:\n${missing.join(", ")}`
    );
  } catch (e) {
    console.error(e);
    alert("Błąd sprawdzania audytów.");
  }
};
  const handleExportAll = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_answers")
        .select("*")
        .eq("is_finished", true);

      if (error || !data) {
        alert("Błąd danych.");
        return;
      }

      await exportAllAuditsToExcel(data);
    } catch {
      alert("Błąd eksportu.");
    }
  };

  return (
    <>
      {/* 🔥 OVERLAY LOADER */}
     {isGenerating && (
  <div className="pdf-overlay">
    <div className="spinner" />
    <div style={{ fontSize: 20 }}>{progress}%</div>
    <div>Generowanie PDF...</div>
  </div>
)}

      <div className="audit-actions-wrapper">
        <div className="audit-header">
          <h2>Raport obchodu</h2>
          <div>Numer obchodu: <strong>{auditId}</strong></div>
          <div>Lider: <strong>{leaderName || '-'}</strong></div>
          <div>Audytor: <strong>{auditorName || '-'}</strong></div>
        </div>

        <div className="audit-buttons">
          <button className="audit-button btn-new" onClick={startNewAudit}>
            Nowy obchód
          </button>
{/* <button
  className="audit-button btn-excel"
  onClick={checkUnfinishedNonCritical}
>
  🔍 Sprawdź niezamknięte
</button> */}
          <button
            className={`audit-button ${isFinished ? 'btn-disabled' : 'btn-finish'}`}
            onClick={finishAudit}
            disabled={isFinished}
          >
            Zakończ obchód
          </button>

          {isFinished && (
            <>
              <button
                className="audit-button btn-critical"
                onClick={handleGeneratePDF}
                disabled={isGenerating}
              >
                {isGenerating ? "Generowanie..." : "Generuj krytyczne"}
              </button>

              <button
                className="audit-button btn-noncritical"
                onClick={exportNonCriticalPDF}
              >
                Generuj niekrytyczne
              </button>

              <button
                className="audit-button btn-excel"
                onClick={() => exportToExcel(questions, auditId)}
              >
                Eksportuj do Excel
              </button>

              <button
                className="audit-button btn-excel"
                onClick={handleExportAll}
              >
                📊 Wszystkie audyty
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};