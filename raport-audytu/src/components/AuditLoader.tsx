import React, { useState, useRef, useEffect } from "react";

interface AuditLoaderProps {
  auditorName: string;
  leaderName: string;
  setLeaderName: (value: string) => void;
  leadersList: string[];
  handleAuditSubmit: () => void;
  loading: boolean;
  onCancel?: () => void; // ✅ dodany props onCancel (opcjonalny)
}

export const AuditLoader: React.FC<AuditLoaderProps> = ({
  auditorName,
  leaderName,
  setLeaderName,
  leadersList,
  handleAuditSubmit,
  loading,
  onCancel, // ✅ destrukturyzacja
}) => {
  const [showLeaderList, setShowLeaderList] = useState(false);
  const leaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leaderRef.current && !leaderRef.current.contains(event.target as Node)) setShowLeaderList(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 400,
        margin: "50px auto",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginBottom: 20 }}>Rozpocznij nowy obchód</h2>

      <div style={{ marginBottom: 20 }}>
        <label>Audytor:</label>
        <input
          type="text"
          value={auditorName}
          readOnly
          style={{
            padding: 12,
            fontSize: 16,
            width: "100%",
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#eee",
          }}
        />
      </div>

      <div ref={leaderRef} style={{ position: "relative", marginBottom: 25 }}>
        <label>Lider:</label>
        <input
          type="text"
          value={leaderName}
          onChange={e => setLeaderName(e.target.value)}
          onFocus={() => setShowLeaderList(true)}
          placeholder="- wybierz lidera -"
          style={{ padding: 12, fontSize: 16, width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
        />
        {showLeaderList && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "0 0 8px 8px",
              maxHeight: 150,
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            {(leaderName
              ? leadersList.filter(n => n.toLowerCase().includes(leaderName.toLowerCase()))
              : leadersList
            ).map(name => (
              <div
                key={name}
                style={{ padding: 10, cursor: "pointer" }}
                onClick={() => {
                  setLeaderName(name);
                  setShowLeaderList(false);
                }}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleAuditSubmit}
        disabled={!leaderName || loading}
        style={{
          padding: "12px 20px",
          fontSize: 16,
          backgroundColor: "#1464f4",
          color: "white",
          border: "none",
          borderRadius: 8,
          width: "100%",
          cursor: !leaderName || loading ? "not-allowed" : "pointer",
          opacity: !leaderName || loading ? 0.6 : 1,
          marginBottom: 10,
        }}
      >
        {loading ? "Ładowanie..." : "Rozpocznij obchód"}
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            backgroundColor: "#ccc",
            color: "black",
            border: "none",
            borderRadius: 8,
            width: "100%",
            cursor: "pointer",
          }}
        >
          Wstecz
        </button>
      )}
    </div>
  );
};
