// AuditLoader.tsx
import React from "react";

interface AuditLoaderProps {
  auditInput: string;
  setAuditInput: (value: string) => void;
  auditorName: string;
  setAuditorName: (value: string) => void;
  leaderName: string;
  setLeaderName: (value: string) => void;
  finishedAudits: number[];
  handleAuditSubmit: () => void;
  loading: boolean;
  setAuditId: (id: number) => void;
  setIsFinished: (val: boolean) => void;
}

export const AuditLoader: React.FC<AuditLoaderProps> = ({
  auditInput,
  setAuditInput,
  auditorName,
  setAuditorName,
  leaderName,
  setLeaderName,
  finishedAudits,
  handleAuditSubmit,
  loading,
  setAuditId,
  setIsFinished,
}) => (
  <div style={{
    padding: 20,
    maxWidth: 400,
    margin: "50px auto",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  }}>
    <h2 style={{ marginBottom: 20 }}>Uzupełnij dane obchodu</h2>

    <input
      type="text"
      value={auditorName}
      onChange={e => setAuditorName(e.target.value)}
      placeholder="Imię i nazwisko audytora"
      style={{
        padding: 12,
        fontSize: 16,
        width: "100%",
        marginBottom: 15,
        borderRadius: 8,
        border: "1px solid #ccc",
        boxSizing: "border-box"
      }}
    />

    <input
      type="text"
      value={leaderName}
      onChange={e => setLeaderName(e.target.value)}
      placeholder="Imię i nazwisko Lidera"
      style={{
        padding: 12,
        fontSize: 16,
        width: "100%",
        marginBottom: 15,
        borderRadius: 8,
        border: "1px solid #ccc",
        boxSizing: "border-box"
      }}
    />

    <input
      type="number"
      value={auditInput}
      onChange={e => setAuditInput(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter") handleAuditSubmit(); }}
      placeholder="Numer obchodu"
      style={{
        padding: 12,
        fontSize: 16,
        width: "100%",
        marginBottom: 20,
        borderRadius: 8,
        border: "1px solid #ccc",
        boxSizing: "border-box"
      }}
    />

    <button
      onClick={handleAuditSubmit}
      style={{
        padding: "12px 20px",
        fontSize: 16,
        backgroundColor: "#1464f4",
        color: "white",
        border: "none",
        borderRadius: 8,
        width: "100%",
        marginBottom: 25,
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
      }}
    >
      {loading ? "Ładowanie..." : "Wczytaj obchód"}
    </button>

    <h3 style={{ marginBottom: 10 }}>Zakończone obchody</h3>
    <select
      style={{
        padding: 12,
        fontSize: 16,
        width: "100%",
        borderRadius: 8,
        border: "1px solid #ccc",
        boxSizing: "border-box"
      }}
      onChange={e => {
        const id = Number(e.target.value);
        if (id) {
          setAuditId(id);
          setIsFinished(true);
        }
      }}
    >
      <option value="">— wybierz —</option>
      {finishedAudits.map(id => (
        <option key={id} value={id}>
          Obchód {id}
        </option>
      ))}
    </select>
  </div>
);
