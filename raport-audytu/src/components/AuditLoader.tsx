import React, { useState, useRef, useEffect } from "react";
import "./AuditLoader.css"

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
  <div className="audit-loader-wrapper">
  <div className="audit-loader-card">
    <h2>Rozpocznij nowy obchód</h2>

    <div style={{ marginBottom: 20 }}>
      <label>Audytor:</label>
      <input type="text" value={auditorName} readOnly />
    </div>

    <div className="leader-input-wrapper">
      <label>Lider:</label>
      <input
        type="text"
        value={leaderName}
        onChange={e => setLeaderName(e.target.value)}
        onFocus={() => setShowLeaderList(true)}
        placeholder="- wybierz lidera -"
      />

      {showLeaderList && (
        <div className="leader-list">
          {(leaderName
            ? leadersList.filter(n => n.toLowerCase().includes(leaderName.toLowerCase()))
            : leadersList
          ).map(name => (
            <div
              key={name}
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
      className="start-audit-btn"
      onClick={handleAuditSubmit}
      disabled={!leaderName || loading}
    >
      {loading ? "Ładowanie..." : "Rozpocznij obchód"}
    </button>

    {onCancel && (
      <button className="cancel-btn" onClick={onCancel}>
        Wstecz
      </button>
    )}
  </div>
</div>

  );
};
