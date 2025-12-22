// NonCriticalEntries.tsx
import React, { useEffect, useState } from "react";
import { NonCriticalEntry } from "../types";
import { loadNonCriticalEntries } from "../../supabaseAudit";
import { NonCriticalEntryForm } from "./NonCriticalEntryForm";
import { NonCriticalEntryItem } from "./NonCriticalEntryItem";

type Props = { 
  auditId: number;
  activeCategory: string; // <- dodajemy activeCategory
};

export const NonCriticalEntries: React.FC<Props> = ({ auditId, activeCategory }) => {
  const [entries, setEntries] = useState<NonCriticalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await loadNonCriticalEntries(auditId);
      setEntries(data || []);
      setLoading(false);
    };
    load();
  }, [auditId]);

  // Nowy wpis automatycznie z activeCategory
  const addEntry = (entry: NonCriticalEntry) => {
    const newEntry = { ...entry, line: activeCategory };
    setEntries(prev => [...prev, newEntry]);
  };

  const updateEntry = (updated: NonCriticalEntry) => {
    setEntries(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  };

  const removeEntry = (id?: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div style={{ marginTop: 20 }}>
      <NonCriticalEntryForm auditId={auditId} onAdd={addEntry} />
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
