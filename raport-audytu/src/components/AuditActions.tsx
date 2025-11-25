// components/AuditActions.tsx
import React from 'react';

interface AuditActionsProps {
  auditId: number;
}

export const AuditActions: React.FC<AuditActionsProps> = ({ auditId }) => {



  const startNewAudit = () => {
    const confirmNew = window.confirm(
      "Czy na pewno chcesz zakończyć bieżący obchód i rozpocząć nowy?"
    );
    if (confirmNew) {
      // Usuń bieżący niezakończony audyt
      localStorage.removeItem("lastUnfinishedAudit");
      // Wygeneruj nowy auditId
      const newId = Math.floor(Math.random() * 100000);
      localStorage.setItem("auditId", newId.toString());
      console.log("🆕 Utworzono nowy auditId:", newId);
      window.location.reload(); // przeładowanie strony z nowym auditId
    }
  };

  return (
    <div
      style={{
        margin: '40px 0',      // odstęp od góry i dołu
        display: 'flex',
        justifyContent: 'center',
        gap: 20,               // odstęp między przyciskami
      }}
    >
   
      <button
        style={{
          padding: '12px 25px',
          fontSize: 16,
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
        onClick={startNewAudit}
      >
        Nowy obchód
      </button>
    </div>
  );
};
