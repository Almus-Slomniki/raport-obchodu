// NonCriticalEntryItem.tsx
import React from "react";
import { NonCriticalEntry } from "../types";

type Props = {
  entry: NonCriticalEntry;
  onUpdate: (entry: NonCriticalEntry) => void;
  onRemove: (id?: number) => void;
};

export const NonCriticalEntryItem: React.FC<Props> = ({ entry, onUpdate, onRemove }) => {
  const handleAddNote = () => {
    const note = prompt("Wpisz uwagi:");
    onUpdate({ ...entry, note: note ?? entry.note });
  };

  const handleRemoveImage = (index: number) => {
    if (window.confirm("Czy na pewno chcesz usunąć to zdjęcie?")) {
      onUpdate({ ...entry, images: entry.images?.filter((_, i) => i !== index) });
    }
  };

  return (
    <li style={{ marginBottom: 20, border: "1px solid #ddd", padding: 10, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{entry.name || "Brak nazwy"}</strong>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleAddNote} style={{ fontSize: 12 }}>📝 Uwagi</button>
<button
  onClick={() => {
    if (window.confirm("Czy na pewno chcesz usunąć ten wpis?")) {
      onRemove(entry.id);
    }
  }}
  style={{ fontSize: 12 }}
>
  ❌ Usuń
</button>
        </div>
      </div>
      <div>Linia: {entry.line || "Brak linii"}</div>
      {entry.note && <div style={{ fontStyle: "italic", color: "#555" }}>Uwagi: {entry.note}</div>}

      {entry.images?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {entry.images.map((img, i) => (
            <div key={i} style={{ position: "relative", width: 100, height: 100, overflow: "hidden", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => handleRemoveImage(i)} style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(255,0,0,0.8)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12, cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </li>
  );
};
