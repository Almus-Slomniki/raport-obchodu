import React, { useState, useRef, useEffect } from "react";

interface AuditLoaderProps {
  auditInput: string;
  setAuditInput: (value: string) => void;
  auditorName: string;
  setAuditorName: (value: string) => void;
  leaderName: string;
  setLeaderName: (value: string) => void;
  finishedAudits: number[];
  auditorsList: string[];
  leadersList: string[];
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
  auditorsList,
  leadersList,
  handleAuditSubmit,
  loading,
  setAuditId,
  setIsFinished,
}) => {
  const [showAuditorList, setShowAuditorList] = useState(false);
  const [showLeaderList, setShowLeaderList] = useState(false);

  const auditorRef = useRef<HTMLDivElement>(null);
  const leaderRef = useRef<HTMLDivElement>(null);

  // Zamknięcie list po kliknięciu poza element
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (auditorRef.current && !auditorRef.current.contains(event.target as Node)) {
        setShowAuditorList(false);
      }
      if (leaderRef.current && !leaderRef.current.contains(event.target as Node)) {
        setShowLeaderList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "50px auto", textAlign: "center", backgroundColor: "#f9f9f9", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <h2 style={{ marginBottom: 20 }}>Uzupełnij dane obchodu</h2>

      {/* Audytor */}
      <div ref={auditorRef} style={{ position: "relative", marginBottom: 15 }}>
        <input
          type="text"
          value={auditorName}
          onChange={e => { setAuditorName(e.target.value); setShowAuditorList(true); }}
          placeholder="- wybierz audytora -"
          style={{ padding: 12, fontSize: 16, width: "calc(100% - 40px)", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
        />
        <button
          onClick={() => setShowAuditorList(!showAuditorList)}
          style={{ position: "absolute", right: 0, top: 0, height: "100%", width: 40, border: "none", background: "#eee", cursor: "pointer", borderRadius: "0 8px 8px 0" }}
        >
          ▼
        </button>
        {showAuditorList && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ccc", borderRadius: "0 0 8px 8px", maxHeight: 150, overflowY: "auto", zIndex: 10 }}>
            {(auditorName ? auditorsList.filter(name => name.toLowerCase().includes(auditorName.toLowerCase())) : auditorsList).map(name => (
              <div key={name} style={{ padding: 10, cursor: "pointer" }} onClick={() => { setAuditorName(name); setShowAuditorList(false); }}>
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lider */}
      <div ref={leaderRef} style={{ position: "relative", marginBottom: 15 }}>
        <input
          type="text"
          value={leaderName}
          onChange={e => { setLeaderName(e.target.value); setShowLeaderList(true); }}
          placeholder="- wybierz lidera -"
          style={{ padding: 12, fontSize: 16, width: "calc(100% - 40px)", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
        />
        <button
          onClick={() => setShowLeaderList(!showLeaderList)}
          style={{ position: "absolute", right: 0, top: 0, height: "100%", width: 40, border: "none", background: "#eee", cursor: "pointer", borderRadius: "0 8px 8px 0" }}
        >
          ▼
        </button>
        {showLeaderList && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ccc", borderRadius: "0 0 8px 8px", maxHeight: 150, overflowY: "auto", zIndex: 10 }}>
            {(leaderName ? leadersList.filter(name => name.toLowerCase().includes(leaderName.toLowerCase())) : leadersList).map(name => (
              <div key={name} style={{ padding: 10, cursor: "pointer" }} onClick={() => { setLeaderName(name); setShowLeaderList(false); }}>
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Numer obchodu */}
      <input
        type="number"
        value={auditInput}
        onChange={e => setAuditInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAuditSubmit(); }}
        placeholder="Numer obchodu"
        style={{ padding: 12, fontSize: 16, width: "100%", marginBottom: 20, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
      />

      <button
        onClick={handleAuditSubmit}
        style={{ padding: "12px 20px", fontSize: 16, backgroundColor: "#1464f4", color: "white", border: "none", borderRadius: 8, width: "100%", marginBottom: 25, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
      >
        {loading ? "Ładowanie..." : "Rozpocznij obchód"}
      </button>

      <h3 style={{ marginBottom: 10 }}>Zakończone obchody</h3>
      <select
        style={{ padding: 12, fontSize: 16, width: "100%", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
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
};
