// NonCriticalEntryForm.tsx
import React, { useState } from "react";
import { categories } from "../../data/questions";
import { NonCriticalEntry } from "../types";
import { saveNonCriticalEntry, uploadNonCriticalImage } from "../../supabaseAudit";

type Props = {
  auditId: number;
  onAdd: (entry: NonCriticalEntry) => void;
};

export const NonCriticalEntryForm: React.FC<Props> = ({ auditId, onAdd }) => {
  const [newEntryName, setNewEntryName] = useState("");
  const [newEntryLine, setNewEntryLine] = useState(categories[0]);
  const [newEntryImages, setNewEntryImages] = useState<string[]>([]);

  const addImages = async (files: FileList) => {
    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadNonCriticalImage(auditId, files[i]);
        uploaded.push(url);
      } catch (err) {
        console.error("❌ Błąd uploadu zdjęcia:", err);
      }
    }
    setNewEntryImages(prev => [...prev, ...uploaded]);
  };

  const handleAddEntry = async () => {
    if (!newEntryName.trim()) return;

    const entry: NonCriticalEntry = {
      name: newEntryName.trim(),
      line: newEntryLine,
      images: newEntryImages,
      note: "",
    };

    const saved = await saveNonCriticalEntry(auditId, entry);
    if (saved) {
      onAdd(saved);
      setNewEntryName("");
      setNewEntryImages([]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        type="text"
        placeholder="Nazwa wpisu"
        value={newEntryName}
        onChange={e => setNewEntryName(e.target.value)}
        style={{ padding: 8, width: "100%", fontSize: 16 }}
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", margin: "auto" }}>
        <select value={newEntryLine} onChange={e => setNewEntryLine(e.target.value)} style={{ padding: 8, width: 100 }}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
          <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, backgroundColor: "#eee", borderRadius: 8, fontSize: 28 }}>
            📸
            <input type="file" accept="image/*" capture="environment" multiple onChange={e => e.target.files && addImages(e.target.files)} style={{ display: "none" }} />
          </label>
          <span style={{ fontSize: 12, color: "#555", marginTop: 4, minHeight: 20, textAlign: "center" }}>
            {newEntryImages.length > 0 ? `Dodano ${newEntryImages.length}` : ""}
          </span>
        </div>
        <button onClick={handleAddEntry} style={{ padding: "12px 24px", backgroundColor: "#1464f4", color: "white", cursor: "pointer", borderRadius: 6, fontSize: 16, fontWeight: "bold" }}>
          Dodaj
        </button>
      </div>
    </div>
  );
};
