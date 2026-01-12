// AuditTabs.tsx
import React from "react";

interface AuditTabsProps {
  activeTab: "Krytyczne" | "Niekrytyczne";
  setActiveTab: (tab: "Krytyczne" | "Niekrytyczne") => void;
}

export const AuditTabs: React.FC<AuditTabsProps> = ({ activeTab, setActiveTab }) => (
  <div style={{ display: "flex", marginBottom: 10 }}>
    {["Krytyczne", "Niekrytyczne"].map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab as "Krytyczne" | "Niekrytyczne")}
        style={{
          flex: 1,
          padding: 12,
          backgroundColor: activeTab === tab ? "#3da2eb" : "white",
          border: "1px solid #ccc",
          fontWeight: activeTab === tab ? "bold" : "normal",
          cursor: "pointer"
        }}
      >
        {tab}
      </button>
    ))}
  </div>
);
