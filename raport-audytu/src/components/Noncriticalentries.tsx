import React, { useEffect, useState } from "react";
import { categories } from "../data/questions";
import { NonCriticalEntry } from "./types";
import { loadNonCriticalEntries, saveNonCriticalEntry, uploadNonCriticalImage } from "../supabaseAudit";

type Props = {
  auditId: number;
};

export const NonCriticalEntries: React.FC<Props> = ({ auditId }) => {
  const [entries, setEntries] = useState<NonCriticalEntry[]>([]);
  const [newEntryName, setNewEntryName] = useState("");
  const [newEntryLine, setNewEntryLine] = useState(categories[0]);
  const [newEntryImages, setNewEntryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Wczytaj wpisy niekrytyczne
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await loadNonCriticalEntries(auditId);
        // Gwarancja, że w stanie nie pojawi się null
        setEntries(data ? data.filter(Boolean) : []);
      } catch (err) {
        console.error("❌ Błąd wczytywania wpisów niekrytycznych:", err);
        setEntries([]);
      }
      setLoading(false);
    };
    load();
  }, [auditId]);

  // 🔹 Upload zdjęć
  const addImages = async (files: FileList) => {
    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadNonCriticalImage(auditId, files[i]);
        if (url) uploaded.push(url);
      } catch (err) {
        console.error("❌ Błąd uploadu zdjęcia:", err);
      }
    }
    setNewEntryImages(prev => [...prev, ...uploaded]);
  };

  // 🔹 Dodanie wpisu
const handleAddEntry = async () => {
  if (!newEntryName.trim()) return;

  const entry: NonCriticalEntry = {
    name: newEntryName.trim(),
    line: newEntryLine,
    images: newEntryImages,
  };

  console.log("💾 Dodaję wpis:", entry);
  const saved = await saveNonCriticalEntry(auditId, entry);
  console.log("💾 Wynik zapisu:", saved);

  if (saved) {
    setEntries(prev => [...prev, saved]);
    setNewEntryName("");
    setNewEntryImages([]);
  } else {
    console.error("❌ Nie udało się zapisać wpisu niekrytycznego");
  }
};


  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Nazwa"
          value={newEntryName}
          onChange={e => setNewEntryName(e.target.value)}
          style={{ padding: 8, flex: 1, minWidth: 150 }}
        />
        <select
          value={newEntryLine}
          onChange={e => setNewEntryLine(e.target.value)}
          style={{ padding: 8 }}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="file"
          multiple
          onChange={e => e.target.files && addImages(e.target.files)}
        />
        <button
          onClick={handleAddEntry}
          style={{ padding: "8px 16px", backgroundColor: "#1464f4", color: "white", cursor: "pointer" }}
        >
          Dodaj
        </button>
      </div>

      <h3>Lista wpisów niekrytycznych</h3>
      {loading ? (
        <p>Ładowanie...</p>
      ) : entries.length === 0 ? (
        <p>Brak wpisów niekrytycznych.</p>
      ) : (
        <ul>
          {entries.map((entry, idx) => (
            <li key={entry.id ?? `${entry.name}-${idx}`}>
              <strong>{entry.name || "Brak nazwy"}</strong> (Linia: {entry.line || "Brak linii"})
              {entry.images?.map((img, i) => (
                <img key={i} src={img} alt="" style={{ width: 80, marginLeft: 5 }} />
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
