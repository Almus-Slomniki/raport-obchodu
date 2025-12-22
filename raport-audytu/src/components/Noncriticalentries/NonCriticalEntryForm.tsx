// NonCriticalEntryForm.tsx
import React, { useState } from "react";
import { categories } from "../../data/questions";
import { NonCriticalEntry } from "../types";
import { saveNonCriticalEntry, uploadNonCriticalImage } from "../../supabaseAudit";

// Checklist
const checklistData = {
  "Czystość i porządek": [
    "Miotły i inne środki czystości - nieużywane wiszą w kącikach",
    "Tablice cieni - uzupełnione",
    "Uporządkowane przejścia wewnątrz hal",
    "Wszystkie bramy i drzwi zamknięte",
    "Wszystkie przewody, kable zabezpieczone",
    "Wszystkie długopisy takie same",
    "W środku maszyn nie ma niedozwolonych przedmiotów",
    "Brak śmieci na halach",
    "Brak niedozwolonych artykułów w szafkach",
    "Brak ptaków i innych szkodników"
  ],
  Pracownicy: [
    "Każdy pracownik posiada ubranie robocze i kaski",
    "Szafki szatniowe - brak pożywienia",
    "Buty przechowywane w szafce",
    "Brak prywatnych rzeczy na halach",
    "Brak biżuterii u pracowników",
    "Brak jedzenia w biurze produkcji",
    "Znajomość procedur i zasad",
    "Praca z odkrytym produktem tylko w rękawiczkach",
    "Wszystkie wagi wypoziomowane",
    "Nadzór nad zapisami w dokumentacji"
  ],
  "Bezpieczeństwo i maszyny": [
    "Drogi ewakuacyjne - NIEZASTAWIONE",
    "Skrzynki elektryczne zamknięte",
    "Gaśnice, hydranty niezastawione",
    "Krańcówki przytwierdzone",
    "Butle z gazem w klatce",
    "Klamki w maszynach przytwierdzone",
    "Kluczyki w wózkach wyjęte",
    "Kaski przy suwnicach",
    "Brak stojących palet naruszeń BHP",
    "Wszystkie bramy i drzwi zamknięte"
  ],
  Otoczenie: [
    "Miotły i inne środki czystości w kącikach",
    "Tablice cieni uzupełnione",
    "Uporządkowane przejścia",
    "Wszystkie bramy i drzwi zamknięte",
    "Brak śmieci w magazynie",
    "Brak niedozwolonych artykułów w szafkach pracowniczych"
  ]
};

type ChecklistItem = { category: keyof typeof checklistData; text: string };

const allChecklistItems: ChecklistItem[] = (Object.keys(checklistData) as (keyof typeof checklistData)[])
  .flatMap(cat => checklistData[cat].map(text => ({ category: cat, text })));

type Props = { auditId: number; onAdd: (entry: NonCriticalEntry) => void };

export const NonCriticalEntryForm: React.FC<Props> = ({ auditId, onAdd }) => {
  const [selectedCategory, setSelectedCategory] =
    useState<keyof typeof checklistData | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);

  const [name, setName] = useState("");
  const [line, setLine] = useState(categories[0]);
  const [images, setImages] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<ChecklistItem[]>([]);

  const handleNameChange = (value: string) => {
    setName(value);
    setSelectedItem(null);

    if (value.trim().length > 0) {
      const filtered = allChecklistItems.filter(item =>
        item.text.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const addImages = async (files: FileList) => {
    const uploaded: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadNonCriticalImage(auditId, files[i]);
        uploaded.push(url);
      } catch (err) {
        console.error(err);
      }
    }

    setImages(prev => [...prev, ...uploaded]);
  };

  const handleAddEntry = async () => {
    if (!name.trim()) return;

    const entry: NonCriticalEntry = {
      name: name.trim(),
      line,
      images,
      note: ""
    };

    const saved = await saveNonCriticalEntry(auditId, entry);
    if (saved) {
      onAdd(saved);
      setName("");
      setLine(categories[0]);
      setImages([]);
      setSelectedItem(null);
      setSelectedCategory(null);
      setSuggestions([]);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>

{/* -----------------  TABS (każdy w osobnym wierszu na telefonie) ----------------- */}
<div
  style={{
    display: "flex",
    flexDirection: "column", // każdy przycisk w wierszu
    gap: 4, // odstęp między przyciskami
    marginTop: 10,
  }}
>
  {(Object.keys(checklistData) as (keyof typeof checklistData)[]).map(cat => (
    <button
      key={cat}
      style={{
        width: "100%",
        padding: "10px 0",
        border: "1px solid #ccc",
        borderRadius: 6,
        fontWeight: selectedCategory === cat ? "bold" : "normal",
        backgroundColor: selectedCategory === cat ? "#e3f2fd" : "white",
        cursor: "pointer",
        textAlign: "center",
        fontSize: 14,
      }}
      onClick={() => {
        setSelectedCategory(prev => (prev === cat ? null : cat));
        setSelectedItem(null);
        setName("");
      }}
    >
      {cat}
    </button>
  ))}
</div>


      {/* ----------------- ROZWIJANA LISTA POD TABAMI ----------------- */}
      {selectedCategory && (
        <ul
          style={{
            marginTop: 6,
            listStyle: "none",
            padding: 0,
            maxHeight: 220,
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "white"
          }}
        >
          {checklistData[selectedCategory].map((text: string, idx: number) => (
            <li key={idx}>
              <button
                type="button"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 10,
                  border: "none",
                  borderBottom: "1px solid #eee",
                  background: selectedItem?.text === text ? "#d0eaff" : "white",
                  cursor: "pointer",
                  fontSize: 14
                }}
                onClick={() => {
                  setName(text);
                  setSelectedItem({ category: selectedCategory, text });
                  setSelectedCategory(null); // zamyka listę
                }}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ----------------- INPUT + SUGESTIE ----------------- */}
      <div style={{ position: "relative", marginTop: 10 }}>
        <input
          type="text"
          placeholder="Nazwa wpisu"
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />

        {suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "white",
              zIndex: 10,
              maxHeight: 150,
              overflowY: "auto",
              marginTop: 2,
              paddingLeft: 0,
              listStyle: "none"
            }}
          >
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 8,
                    border: "none",
                    background: "#eee",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setName(s.text);
                    setSelectedItem(s);
                    setSuggestions([]);
                    setSelectedCategory(null);
                  }}
                >
                  {s.text} ({s.category})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ----------------- LINIA + ZDJĘCIA + DODAJ ----------------- */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
      

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
            fontSize: 28
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

        <span>{images.length > 0 ? `Dodano ${images.length}` : ""}</span>

        <button
          onClick={handleAddEntry}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1464f4",
            color: "white",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Dodaj
        </button>
      </div>
    </div>
  );
};
