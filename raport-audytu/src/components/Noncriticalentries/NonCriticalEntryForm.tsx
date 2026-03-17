import React, { useEffect, useState } from "react";
import { NonCriticalEntry } from "../types";
import { uploadNonCriticalImage } from "../../supabaseAudit";

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

type Category = keyof typeof checklistData;
type ChecklistItem = { category: Category; text: string };

const categories = Object.keys(checklistData) as Category[];
const allChecklistItems: ChecklistItem[] = categories.flatMap(cat =>
  checklistData[cat].map(text => ({ category: cat, text }))
);

type Props = {
  auditId: number;
  activeCategory: string;
  onAdd: (entry: NonCriticalEntry) => void;
};

export const NonCriticalEntryForm: React.FC<Props> = ({
  auditId,
  activeCategory,
  onAdd
}) => {
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [name, setName] = useState(""); // treść uwagi
  const [line, setLine] = useState(activeCategory); // aktualna kategoria lub "inne"
  const [images, setImages] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<ChecklistItem[]>([]);

  const isCustom = line === "inne";

  useEffect(() => {
    setLine(activeCategory);
  }, [activeCategory]);

  const toggleCategory = (cat: Category) => {
    setOpenCategory(prev => (prev === cat ? null : cat));
    setLine(cat);
    setName("");
    setSuggestions([]);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = allChecklistItems.filter(item =>
      item.text.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
  };

  const addImages = async (files: FileList) => {
    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadNonCriticalImage(auditId, files[i]);
        uploaded.push(url);
      } catch (e) {
        console.error(e);
      }
    }
    setImages(prev => [...prev, ...uploaded]);
  };

  const handleAddEntry = () => {
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      line: isCustom ? "inne" : line,
      images,
      note: ""
    });

    // reset
    setName("");
    setImages([]);
    setSuggestions([]);
    setOpenCategory(null);
    setLine(activeCategory);
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* KATEGORIE + PODPUNKTY */}
      {categories.map((cat, catIndex) => {
        const catNumber = catIndex + 1;
        return (
          <div key={cat} style={{ marginBottom: 6 }}>
            <button
              onClick={() => toggleCategory(cat)}
              style={{
                width: "100%",
                padding: "10px 0",
                border: "1px solid #ccc",
                borderRadius: 6,
                background: openCategory === cat ? "#3da2eb" : "white",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              {catNumber}. {cat}
            </button>

            {openCategory === cat && (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginTop: 4,
                  border: "1px solid #ccc",
                  borderRadius: 6
                }}
              >
                {checklistData[cat].map((text, itemIndex) => (
                  <li key={itemIndex}>
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 10,
                        border: "none",
                        borderBottom: "1px solid #eee",
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        setName(text);
                        setLine(cat);
                        setOpenCategory(null);
                      }}
                    >
                      {catNumber}.{itemIndex + 1} {text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {/* INPUT TREŚCI UWAGI */}
      <div style={{ position: "relative", marginTop: 10 }}>
        <input
          value={name}
          placeholder="Treść uwagi"
          onChange={e => handleNameChange(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />

        {!isCustom && suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "white",
              border: "1px solid #ccc",
              listStyle: "none",
              padding: 0,
              margin: 0,
              zIndex: 10
            }}
          >
            {suggestions.map((s, i) => {
              const catNumber = categories.indexOf(s.category) + 1;
              const itemNumber = checklistData[s.category].indexOf(s.text) + 1;
              return (
                <li key={i}>
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 8,
                      border: "none",
                      background: "#eee"
                    }}
                    onClick={() => {
                      setName(s.text);
                      setLine(s.category);
                      setSuggestions([]);
                    }}
                  >
                    {catNumber}.{itemNumber} {s.text}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* SELECT DLA KATEGORII: tylko aktualna + "inne" */}
      <select
        value={line}
        onChange={e => setLine(e.target.value)}
        style={{ display: "block", marginTop: 10, marginBottom: 10, width: "100%", padding: 8 }}
      >
        <option value={line}>{line}</option>
        {!isCustom && <option value="inne">➕ Inne</option>}
      </select>

      {/* ZDJĘCIA + PRZYCISK DODAJ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ cursor: "pointer", fontSize: 24 }}>
            📸
            {images.length > 0 && (
              <div style={{ fontStyle: "italic", color: "green" }}>
                Dodano {images.length} {images.length === 1 ? "zdjęcie" : "zdjęcia"}
              </div>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              capture="environment"
              onChange={e => e.target.files && addImages(e.target.files)}
              style={{ display: "none" }}
            />
          </label>

          <button
            onClick={handleAddEntry}
            style={{
              padding: "10px 20px",
              background: "#1464f4",
              color: "white",
              borderRadius: 6,
              fontWeight: "bold"
            }}
          >
            Dodaj
          </button>
        </div>
      </div>
    </div>
  );
};