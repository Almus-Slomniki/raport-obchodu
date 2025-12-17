import React from 'react';
import { supabase } from '../supabaseClient';
import { generatePDF } from "../utils/generatePDF";
import { exportToExcel } from "../utils/exportToExcel";

interface AuditActionsProps {
  auditId: number;
  isFinished: boolean;
  questions: any;
  imagesState: any;
  auditorName?: string;
  leaderName?: string;
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
          leader_name: leaderName?.trim() || null, // <-- zapis lidera przy zakończeniu
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

  return (
    <div style={{ 
      margin: '40px 0', 
      display: 'flex', 
      flexWrap: "wrap",
      justifyContent: 'center', 
      gap: 20 
    }}>
      
      {/* NOWY OBCHÓD */}
      <button
        onClick={startNewAudit}
        style={{
          padding: '12px 25px',
          fontSize: 16,
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Nowy obchód
      </button>

      {/* ZAKOŃCZ OBCHÓD */}
      <button
        onClick={finishAudit}
        disabled={isFinished}
        style={{
          padding: '12px 25px',
          fontSize: 16,
          backgroundColor: isFinished ? '#aaa' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: isFinished ? 'not-allowed' : 'pointer',
        }}
      >
        Zakończ obchód
      </button>

      {/* GENERUJ PDF */}
      {isFinished && (
        <button
          onClick={() => generatePDF(questions, imagesState, auditorName, leaderName)}
          style={{
            padding: '12px 22px',
            fontSize: 16,
            backgroundColor: '#1464f4',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Generuj PDF
        </button>
      )}

      {/* EXCEL */}
      {isFinished && (
        <button
          onClick={() => exportToExcel(questions, auditId)}
          style={{
            padding: '12px 22px',
            fontSize: 16,
            backgroundColor: '#0a7c32',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Eksportuj do Excel
        </button>
      )}
    </div>
  );
};
