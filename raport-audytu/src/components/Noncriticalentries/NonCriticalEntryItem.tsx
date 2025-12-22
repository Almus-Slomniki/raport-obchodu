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
    console.log("entr",entry)
    const note = prompt("Wpisz uwagi:", entry.note || "");
    if (note !== null) {
      onUpdate({ ...entry, note });
    }
  };

  const handleRemoveImage = (index: number) => {
    if (window.confirm("Czy na pewno chcesz usunąć to zdjęcie?")) {
      onUpdate({ ...entry, images: entry.images?.filter((_, i) => i !== index) });
    }
  };
console.log("entryyy", entry)
  return (
    <li
      style={{
        marginBottom: 16,
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 10,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        backgroundColor: "#fafafa",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Usuń wpis */}
      <button
        onClick={() => {
          if (window.confirm("Czy na pewno chcesz usunąć ten wpis?")) {
            onRemove(entry.id);
          }
        }}
        style={{
          position: "absolute",
          top: -13,
          right: -13,
          backgroundColor: "grey",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: 24,
          height: 24,
          fontSize: 16,
          lineHeight: "24px",
          textAlign: "center",
          cursor: "pointer",
        }}
        aria-label="Usuń wpis"
      >
        ×
      </button>

      {/* Nazwa i linia */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <strong style={{ fontSize: 16 }}>{entry.name || "Brak nazwy"}</strong>
        <div style={{ fontSize: 14, color: "#333" }}>
          Linia: {entry.line || "Brak linii"}
        </div>
        {entry.note && (
          <div style={{ fontStyle: "italic", color: "#555", fontSize: 13 }}>
            Uwagi: {entry.note}
          </div>
        )}
      </div>

      {/* Zdjęcia */}
      {entry.images?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {entry.images.map((img, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: 100,
                height: 100,
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            >
              <img
                src={img}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={() => handleRemoveImage(i)}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  backgroundColor: "rgba(255,0,0,0.8)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Usuń zdjęcie"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dodaj uwagi */}
      <button
        onClick={handleAddNote}
        style={{
          marginTop: 8,
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #ccc",
          backgroundColor: "#f0f0f0",
          cursor: "pointer",
        }}
      >
        Dodaj uwagi
      </button>
    </li>
  );
};
