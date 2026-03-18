import React from 'react';
import { supabase } from '../supabaseClient';
import { generatePDF } from "../utils/generatePDF";
import { exportToExcel } from "../utils/exportToExcel";
import { generateNonCriticalPDF } from "../utils/GenerateNonCriticalPDF";
import { exportAllAuditsToExcel } from "../utils/exportAllAuditsToExcel"; // <-- NOWE
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
  auditDate,
  onStartNewAudit,
  onFinishAudit,
}) => {


  const startNewAudit = () => {
    const confirmNew = window.confirm(
      "Czy na pewno chcesz zakończyć bieżący obchód i rozpocząć nowy?"
    );
    if (!confirmNew) return;

    localStorage.removeItem("lastUnfinishedAudit");
    if (onStartNewAudit) onStartNewAudit();
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
        console.error('Błąd zakończenia audytu:', error);
        alert('Błąd zakończenia audytu.');
        return;
      }

      alert(`Obchód ${auditId} został zakończony.`);
      if (onFinishAudit) onFinishAudit();
    } catch (err) {
      console.error('Błąd zakończenia audytu:', err);
      alert('Błąd zakończenia audytu.');
    }
  };

  const exportNonCriticalPDF = async () => {
    await generateNonCriticalPDF(auditId);
  };

  // 📊 EXPORT WSZYSTKICH AUDYTÓW
  const handleExportAll = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_answers")
        .select("*")
        .eq("is_finished", true);

      if (error) {
        console.error(error);
        alert("Błąd pobierania danych.");
        return;
      }

      if (!data || data.length === 0) {
        alert("Brak zakończonych audytów.");
        return;
      }

      await exportAllAuditsToExcel(data);
    } catch (err) {
      console.error(err);
      alert("Błąd eksportu.");
    }
  };

  return (
    <div className="audit-actions-wrapper">
      {/* Nagłówek */}
      <div className="audit-header">
        <h2>Raport obchodu</h2>
        <div>Numer obchodu: <strong>{auditId}</strong></div>
        <div>Lider: <strong>{leaderName || '-'}</strong></div>
        <div>Audytor: <strong>{auditorName || '-'}</strong></div>
      </div>

      {/* Przyciski */}
      <div className="audit-buttons">
        {/* NOWY OBCHÓD */}
        <button className="audit-button btn-new" onClick={startNewAudit}>
          Nowy obchód
        </button>

        {/* ZAKOŃCZ OBCHÓD */}
        <button
          className={`audit-button ${isFinished ? 'btn-disabled' : 'btn-finish'}`}
          onClick={finishAudit}
          disabled={isFinished}
        >
          Zakończ obchód
        </button>

        {isFinished && (
          <>
            {/* PDF krytyczne */}
            <button
              className="audit-button btn-critical"
              onClick={() => generatePDF(questions, imagesState, auditId, auditorName, leaderName)}
            >
              Generuj krytyczne
            </button>

            {/* PDF niekrytyczne */}
            <button
              className="audit-button btn-noncritical"
              onClick={exportNonCriticalPDF}
            >
              Generuj niekrytyczne
            </button>

            {/* Excel */}
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
  );
};