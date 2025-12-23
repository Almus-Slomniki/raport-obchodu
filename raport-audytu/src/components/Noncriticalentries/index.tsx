import React, { useEffect, useState } from "react";
import { NonCriticalEntry } from "../types";
import { 
  loadNonCriticalEntries, 
  saveNonCriticalEntry,
  deleteNonCriticalEntry,
  updateNonCriticalEntry
} from "../../supabaseAudit";
import { NonCriticalEntryForm } from "./NonCriticalEntryForm";
import { NonCriticalEntryItem } from "./NonCriticalEntryItem";

type Props = { 
  auditId: number;
  activeCategory: string; 
};

export const NonCriticalEntries: React.FC<Props> = ({ auditId, activeCategory }) => {
  const [entries, setEntries] = useState<NonCriticalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Ładowanie wpisów z Supabase
  const loadEntries = async () => {
    setLoading(true);
    const data = await loadNonCriticalEntries(auditId);
    setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, [auditId]);

  // Dodawanie wpisu – po zapisaniu odśwież listę
 const addEntry = async (entry: NonCriticalEntry) => {
  const entryWithLine = { ...entry, line: activeCategory };
  const saved = await saveNonCriticalEntry(auditId, entryWithLine);
  if (saved) {
    setEntries(prev => [...prev, saved]); // dodajemy tylko raz
  }
};

  // Aktualizacja wpisu w Supabase i w stanie
  const updateEntry = async (updated: NonCriticalEntry) => {
    if (!updated.id) return;
    const success = await updateNonCriticalEntry(updated.id, updated);
    if (success) {
      setEntries(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    }
  };

  // Usuwanie wpisu z Supabase i ze stanu
  const removeEntry = async (id?: number) => {
    if (!id) return;
    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten wpis?");
    if (!confirmed) return;
    const success = await deleteNonCriticalEntry(id);
    if (success) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <NonCriticalEntryForm activeCategory={activeCategory} auditId={auditId} onAdd={addEntry} />
      <h3 style={{ marginTop: 20 }}>Lista wpisów niekrytycznych</h3>
      {loading ? (
        <p>Ładowanie...</p>
      ) : entries.length === 0 ? (
        <p>Brak wpisów niekrytycznych.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {entries.map(entry => (
            <NonCriticalEntryItem
              key={entry.id || `${entry.name}-${Math.random()}`}
              entry={entry}
              onUpdate={updateEntry}
              onRemove={removeEntry}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
