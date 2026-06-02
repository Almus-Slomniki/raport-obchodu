import React, { useEffect, useState } from "react";
import { NonCriticalEntry } from "../types";
import {
  loadNonCriticalEntries,
  saveNonCriticalEntry,
  deleteNonCriticalEntry,
  updateNonCriticalEntry
} from "../../supabaseAudit";
import { NonCriticalEntryForm } from "./NonCriticalEntryForm";
import { getPrivateImageUrl } from "../../supabaseAudit";

type Props = {
  auditId: number;
  activeCategory: string;
  isFinished?: boolean;
};

export const NonCriticalEntries: React.FC<Props> = ({
  auditId,
  activeCategory,
  isFinished = false
}) => {
  const [entries, setEntries] = useState<NonCriticalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- Ładowanie wpisów z Supabase ----
  const loadEntries = async () => {
    setLoading(true);
    const data = await loadNonCriticalEntries(auditId);
    setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, [auditId]);

  const [imageUrls, setImageUrls] = useState<Record<string,string>>({});


  useEffect(() => {
  const loadUrls = async () => {
    const urls: Record<string,string> = {};

    for (const entry of entries) {
      for (const img of entry.images || []) {
        const signed = await getPrivateImageUrl(img);

        if (signed) {
          urls[img] = signed;
        }
      }
    }

    setImageUrls(urls);
  };

  loadUrls();
}, [entries]);

  // ---- Dodawanie wpisu ----
  const addEntry = async (entry: NonCriticalEntry) => {
    if (isFinished) return;

    const entryWithLine = { ...entry, line: entry.line || activeCategory };
    const saved = await saveNonCriticalEntry(auditId, entryWithLine);
    if (saved) {
      setEntries(prev => [...prev, saved]);
    }
  };

  // ---- Aktualizacja wpisu ----
  const updateEntry = async (updated: NonCriticalEntry) => {
    if (isFinished || !updated.id) return;

    const success = await updateNonCriticalEntry(updated.id, updated);
    if (success) {
      setEntries(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    }
  };

  // ---- Usuwanie wpisu ----
  const removeEntry = async (id?: number) => {
    if (isFinished || !id) return;

    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten wpis?");
    if (!confirmed) return;

    const success = await deleteNonCriticalEntry(id);
    if (success) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* Formularz dodawania */}
      <NonCriticalEntryForm
        auditId={auditId}
        activeCategory={activeCategory}
        onAdd={addEntry}
        disabled={isFinished}
      />

      {/* Komunikat */}
      {isFinished && (
        <p style={{ color: "red", fontSize: 12, marginTop: 10 }}>
          Audyt zakończony – edycja zablokowana
        </p>
      )}

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
                marginBottom: 10,
                border: "1px solid #ccc",
                padding: 10,
                borderRadius: 6,
                backgroundColor: isFinished ? "#f5f5f5" : "white"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong>{entry.name}</strong> <em>({entry.line})</em>

                  {entry.note && <p>{entry.note}</p>}

                  {/* ✅ WYŚWIETLANIE ZDJĘĆ */}
                  {entry.images && entry.images.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 8,
                        flexWrap: "wrap"
                      }}
                    >
                      {entry.images.map((img, index) => (
                        <img
                          key={index}
                          src={imageUrls[img]}
                          alt={`Zdjęcie ${index + 1}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            cursor: "pointer",
                            transition: "transform 0.2s"
                          }}
                          onClick={() => window.open(imageUrls[img], "_blank")}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "scale(1.1)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    disabled={isFinished}
                    onClick={() => {
                      const newName = prompt("Edytuj nazwę:", entry.name);
                      if (!newName) return;

                      const newLine =
                        prompt("Edytuj linię:", entry.line) || entry.line;

                      updateEntry({ ...entry, name: newName, line: newLine });
                    }}
                    style={{
                      cursor: isFinished ? "not-allowed" : "pointer",
                      opacity: isFinished ? 0.5 : 1
                    }}
                  >
                    ✏️
                  </button>

                  <button
                    disabled={isFinished}
                    onClick={() => removeEntry(entry.id)}
                    style={{
                      cursor: isFinished ? "not-allowed" : "pointer",
                      color: "red",
                      opacity: isFinished ? 0.5 : 1
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};