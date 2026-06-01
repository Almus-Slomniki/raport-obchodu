import React, { useState } from "react";
import { NonCriticalEntry } from "../types";
import { uploadNonCriticalImage, saveNonCriticalEntry, getPrivateImageUrl } from "../../supabaseAudit";

type ChecklistItem = {
  id: number;
  text: string;
};

type Props = {
  auditId: number;
  categoryName: string;
  items: ChecklistItem[];
  onAdded: (entry: NonCriticalEntry) => void;
};

export const CategoryChecklist: React.FC<Props> = ({ auditId, categoryName, items, onAdded }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addImages = async (files: FileList) => {
  const uploaded: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const path = await uploadNonCriticalImage(
        auditId,
        files[i]
      );

      const signedUrl = await getPrivateImageUrl(path);

      uploaded.push(signedUrl || path);
    } catch (err) {
      console.error("❌ Błąd uploadu zdjęcia:", err);
    }
  }

  setImages(prev => [...prev, ...uploaded]);
};

  const handleAddEntries = async () => {
    const entriesToAdd: NonCriticalEntry[] = [];

    // Dodaj wybrane z checklisty
    selectedIds.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item) {
        entriesToAdd.push({ name: item.text, line: categoryName, images, note });
      }
    });

    // Dodaj własny wpis, jeśli wprowadzono
    if (customText.trim()) {
      entriesToAdd.push({ name: customText.trim(), line: categoryName, images, note });
    }

    for (const entry of entriesToAdd) {
      const saved = await saveNonCriticalEntry(auditId, entry);
      if (saved) onAdded(saved);
    }

    // Reset
    setSelectedIds([]);
    setCustomText("");
    setImages([]);
    setNote("");
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 10, borderRadius: 8, marginBottom: 16 }}>
      <h4>{categoryName}</h4>

      {/* Lista zagadnień */}
      <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 8 }}>
        {items.map(item => (
          <label key={item.id} style={{ display: "block", marginBottom: 4, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => toggleSelect(item.id)}
              style={{ marginRight: 6 }}
            />
            {item.text}
          </label>
        ))}
      </div>

      {/* Własny wpis */}
      <input
        type="text"
        placeholder="Własny wpis"
        value={customText}
        onChange={e => setCustomText(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 6 }}
      />

      {/* Komentarz */}
      <textarea
        placeholder="Uwagi"
        value={note}
        onChange={e => setNote(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 6 }}
      />

      {/* Zdjęcia */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <label
          style={{
            cursor: "pointer",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#eee",
            borderRadius: 6,
            fontSize: 24,
          }}
        >
          📸
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={e => e.target.files && addImages(e.target.files)}
            style={{ display: "none" }}
          />
        </label>
        <span>{images.length > 0 ? `${images.length} zdjęć` : "Brak zdjęć"}</span>
      </div>

      <button
        onClick={handleAddEntries}
        style={{
          padding: "8px 16px",
          backgroundColor: "#1464f4",
          color: "white",
          cursor: "pointer",
          borderRadius: 6,
          fontWeight: "bold",
        }}
      >
        Dodaj
      </button>
    </div>
  );
};
