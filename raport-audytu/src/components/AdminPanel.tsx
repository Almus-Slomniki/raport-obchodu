import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { exportAllAuditsToExcel } from "../utils/exportAllAuditsToExcel";

interface AdminPanelProps {
  auditId: number | null;
  auditorName: string;
}

interface FinishedAudit {
  audit_id: number;
  finished_at: string | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ auditId, auditorName }) => {
  const [loading, setLoading] = useState(false);
  const [finishedAudits, setFinishedAudits] = useState<FinishedAudit[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Sprawdzenie uprawnień admina
    if (auditId === 999 && auditorName.trim().toLowerCase() === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [auditId, auditorName]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadFinishedAudits = async () => {
      const { data, error } = await supabase
        .from("audit_answers")
        .select("audit_id, finished_at")
        .eq("is_finished", true)
        .order("created_at", { ascending: true });

      if (!error && data) {
        // Unikalne audyty
        const uniqueAudits: Record<number, FinishedAudit> = {};
        data.forEach(a => {
          if (!uniqueAudits[a.audit_id]) uniqueAudits[a.audit_id] = a;
        });
        setFinishedAudits(Object.values(uniqueAudits));
      }
    };

    loadFinishedAudits();
  }, [isAdmin]);

  const handleExportAll = async () => {
    setLoading(true);
    try {
      const { data: allAnswers, error } = await supabase
        .from("audit_answers")
        .select("*")
        .eq("is_finished", true);

      if (error) {
        console.error(error);
        alert("Błąd pobierania danych.");
        return;
      }

      if (!allAnswers || allAnswers.length === 0) {
        alert("Brak zakończonych audytów.");
        return;
      }

      await exportAllAuditsToExcel(allAnswers);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfinishAudit = async (audit_id: number) => {
    const confirmUnfinish = window.confirm(
      `Czy na pewno chcesz oznaczyć audyt ${audit_id} jako niezakończony?`
    );
    if (!confirmUnfinish) return;

    const { error } = await supabase
      .from("audit_answers")
      .update({ is_finished: false, finished_at: null })
      .eq("audit_id", audit_id);

    if (error) {
      alert("Błąd aktualizacji audytu.");
      console.error(error);
      return;
    }

    alert(`Audyt ${audit_id} został oznaczony jako niezakończony.`);
    setFinishedAudits(prev => prev.filter(a => a.audit_id !== audit_id));
  };

  if (!isAdmin) return null;

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "50px auto", textAlign: "center" }}>
      <h2>Panel administratora</h2>
      <p>📊 Pobierz wszystkie zakończone audyty</p>
      <button
        onClick={handleExportAll}
        disabled={loading}
        style={{
          padding: "12px 25px",
          fontSize: 16,
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginBottom: 20
        }}
      >
        {loading ? "Ładowanie..." : "📊 Pobierz Excel"}
      </button>

      <h3>Zakończone audyty</h3>
      {finishedAudits.length === 0 && <p>Brak zakończonych audytów</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {finishedAudits.map(audit => (
          <li key={audit.audit_id} style={{ marginBottom: 8 }}>
            <span>Obchód {audit.audit_id} (Data: {audit.finished_at?.split("T")[0]})</span>
            <button
              onClick={() => handleUnfinishAudit(audit.audit_id)}
              style={{
                marginLeft: 10,
                padding: "4px 10px",
                fontSize: 14,
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              Cofnij zakończenie
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
