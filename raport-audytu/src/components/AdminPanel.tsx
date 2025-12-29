import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { exportAllAuditsToExcel } from "../utils/exportAllAuditsToExcel";

interface AdminPanelProps {
  auditId: number | null;
  auditorName: string;
  setAuditId: (id: number | null) => void;
  setAuditorName: (name: string) => void;
}

interface FinishedAudit {
  audit_id: number;
  finished_at: string | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  auditId,
  auditorName,
  setAuditId,
  setAuditorName,
}) => {
  const [loading, setLoading] = useState(false);
  const [finishedAudits, setFinishedAudits] = useState<FinishedAudit[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sprawdzenie uprawnień
  useEffect(() => {
    setIsAdmin(auditId === 999 && auditorName.trim().toLowerCase() === "admin");
  }, [auditId, auditorName]);

  // Ładowanie zakończonych audytów
  useEffect(() => {
    if (!isAdmin) return;

    const loadFinishedAudits = async () => {
      const { data, error } = await supabase
        .from("audit_answers")
        .select("audit_id, finished_at")
        .eq("is_finished", true)
        .order("finished_at", { ascending: true });

      if (error) {
        console.error("Błąd pobierania zakończonych audytów:", error);
        return;
      }

      // Grupowanie po audit_id, aby wyświetlić tylko jeden wpis na audyt
      const uniqueAudits: Record<number, FinishedAudit> = {};
      (data || []).forEach(row => {
        if (!uniqueAudits[row.audit_id]) uniqueAudits[row.audit_id] = row;
      });

      setFinishedAudits(Object.values(uniqueAudits));
    };

    loadFinishedAudits();
  }, [isAdmin]);

  // Eksport wszystkich zakończonych audytów
  const handleExportAll = async () => {
    setLoading(true);
    try {
      const { data: allAnswers, error } = await supabase
        .from("audit_answers")
        .select("*")
        .in("audit_id", finishedAudits.map(a => a.audit_id));

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

  // Cofnięcie zakończenia audytu
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

  // Jeśli użytkownik nie jest adminem, nie pokazuj panelu
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
            <span>Obchód {audit.audit_id} (Data: {audit.finished_at?.split("T")[0] || "brak"})</span>
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

      {/* Przycisk wyjścia z panelu admina */}
      <button
        onClick={() => {
          setAuditId(null);
          setAuditorName("");
        }}
        style={{
          padding: "12px 25px",
          fontSize: 16,
          backgroundColor: "#555",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 20
        }}
      >
        Wyjdź z panelu admina
      </button>
    </div>
  );
};
