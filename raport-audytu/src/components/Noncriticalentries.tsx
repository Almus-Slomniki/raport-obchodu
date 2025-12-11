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

  // Wczytaj wpisy
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await loadNonCriticalEntries(auditId);
      setEntries(data || []);
      setLoading(false);
    };
    load();
  }, [auditId]);

  // Upload zdjęć
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

  // Dodanie wpisu
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
      setEntries(prev => [...prev, saved]);
      setNewEntryName("");
      setNewEntryImages([]);
    } else {
      console.error("❌ Nie udało się zapisać wpisu niekrytycznego");
    }
  };

  // Usuń wpis
  const handleRemoveEntry = (id?: number) => {
    if (window.confirm("Czy na pewno chcesz usunąć ten wpis?")) {
      setEntries(prev => prev.filter(e => e.id !== id));
      // Tutaj możesz też dodać funkcję do usuwania w Supabase
    }
  };

  // Usuń pojedyncze zdjęcie
  const handleRemoveImage = (entryId?: number, index?: number) => {
    if (!entryId && entryId !== 0) return;
    if (window.confirm("Czy na pewno chcesz usunąć to zdjęcie?")) {
      setEntries(prev =>
        prev.map(e =>
          e.id === entryId
            ? { ...e, images: e.images?.filter((_, i) => i !== index) }
            : e
        )
      );
    }
  };

  // Dodaj / edytuj uwagi
  const handleAddNote = (entryId?: number) => {
    const note = prompt("Wpisz uwagi:");
    if (!entryId && entryId !== 0) return;
    setEntries(prev =>
      prev.map(e =>
        e.id === entryId
          ? { ...e, note: note ?? e.note }
          : e
      )
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* Formularz */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10}}>
        {/* Pierwszy rząd – nazwa wpisu */}
        <input
          type="text"
          placeholder="Nazwa wpisu"
          value={newEntryName}
          onChange={e => setNewEntryName(e.target.value)}
          style={{ padding: 8, width: "100%", fontSize: 16 }}
        />

        {/* Drugi rząd – linia, aparat, przycisk */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", margin: "auto"  }}>
          <select
            value={newEntryLine}
            onChange={e => setNewEntryLine(e.target.value)}
            style={{ padding: 8, width: 100 }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 80 }}>
            <label
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 50,
                height: 50,
                backgroundColor: "#eee",
                borderRadius: 8,
                fontSize: 28,
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
            <span
              style={{
                fontSize: 12,
                color: "#555",
                marginTop: 4,
                minHeight: 20,
                textAlign: "center",
              }}
            >
              {newEntryImages.length > 0 ? `Dodano ${newEntryImages.length}` : ""}
            </span>
          </div>

          <button
            onClick={handleAddEntry}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1464f4",
              color: "white",
              cursor: "pointer",
              borderRadius: 6,
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Dodaj
          </button>
        </div>
      </div>

      {/* Lista wpisów */}
      <h3 style={{ marginTop: 20 }}>Lista wpisów niekrytycznych</h3>
      {loading ? (
        <p>Ładowanie...</p>
      ) : entries.length === 0 ? (
        <p>Brak wpisów niekrytycznych.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {entries.map(entry => (
            <li
              key={entry.id || `${entry.name}-${Math.random()}`}
              style={{
                marginBottom: 20,
                border: "1px solid #ddd",
                padding: 10,
                borderRadius: 8,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{entry.name || "Brak nazwy"}</strong>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleAddNote(entry.id)} style={{ fontSize: 12 }}>📝 Uwagi</button>
                  <button onClick={() => handleRemoveEntry(entry.id)} style={{ fontSize: 12 }}>❌ Usuń</button>
                </div>
              </div>
              <div>Linia: {entry.line || "Brak linii"}</div>
              {entry.note && <div style={{ fontStyle: "italic", color: "#555" }}>Uwagi: {entry.note}</div>}

              {entry.images?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {entry.images.map((img, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        width: 100,
                        height: 100,
                        overflow: "hidden",
                        borderRadius: 8,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => handleRemoveImage(entry.id, i)}
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
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
