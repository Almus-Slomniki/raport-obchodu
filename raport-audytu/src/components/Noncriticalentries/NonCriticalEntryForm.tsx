import React, { useEffect, useState } from "react";
import { NonCriticalEntry } from "../types";
import { uploadNonCriticalImage, getPrivateImageUrl } from "../../supabaseAudit";

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
  disabled?: boolean;
};

export const NonCriticalEntryForm: React.FC<Props> = ({
  auditId,
  activeCategory,
  onAdd,
  disabled = false
}) => {
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [line, setLine] = useState(activeCategory);
  const [images, setImages] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<ChecklistItem[]>([]);


  useEffect(() => {
    setLine(activeCategory);
  }, [activeCategory]);

  const toggleCategory = (cat: Category) => {
    if (disabled) return;

    setOpenCategory(prev => (prev === cat ? null : cat));
    // setLine(cat);
    setName("");
    setSuggestions([]);
  };

  const handleNameChange = (value: string) => {
    if (disabled) return;

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
  if (disabled) return;

  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const path = await uploadNonCriticalImage(
        auditId,
        files[i]
      );

      const signedUrl = await getPrivateImageUrl(path);

      if (signedUrl) {
        uploadedUrls.push(signedUrl);
      }
    } catch (e) {
      console.error(e);
    }
  }

  setImages(prev => [...prev, ...uploadedUrls]);
};

  const handleAddEntry = () => {
    if (disabled) return;
    if (!name.trim()) return;

   onAdd({
  name: name.trim(),
  line: line.trim(),
  images,
  note: ""
});

    setName("");
    setImages([]);
    setSuggestions([]);
    setOpenCategory(null);
    setLine(activeCategory);
  };

  return (
    <div style={{ marginTop: 20, opacity: disabled ? 0.6 : 1 }}>
      {/* KATEGORIE */}
      {categories.map((cat, catIndex) => {
        const catNumber = catIndex + 1;
        return (
          <div key={cat} style={{ marginBottom: 6 }}>
            <button
              disabled={disabled}
              onClick={() => toggleCategory(cat)}
              style={{
                width: "100%",
                padding: "10px 0",
                border: "1px solid #ccc",
                borderRadius: 6,
                background: openCategory === cat ? "#3da2eb" : "white",
                fontWeight: "bold",
                cursor: disabled ? "not-allowed" : "pointer"
              }}
            >
              {catNumber}. {cat}
            </button>

            {openCategory === cat && (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {checklistData[cat].map((text, itemIndex) => (
                  <li key={itemIndex}>
                    <button
                      type="button"
                      disabled={disabled}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 10,
                        border: "none",
                        borderBottom: "1px solid #eee",
                        cursor: disabled ? "not-allowed" : "pointer"
                      }}
                      onClick={() => {
                        if (disabled) return;
                        setName(text);
                        // setLine(cat);
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

      {/* INPUT */}
      <input
        value={name}
        placeholder="Treść uwagi"
        onChange={e => handleNameChange(e.target.value)}
        disabled={disabled}
        style={{ width: "100%", padding: 8, marginTop: 10 }}
      />

      {/* SELECT */}
     <div style={{ marginTop: 10 }}>
  <label
    style={{
      display: "block",
      marginBottom: 4,
      fontSize: 12,
      color: "#666",
      fontWeight: 600,
    }}
  >
    Linia
  </label>

  <input
    value={line}
    onChange={e => setLine(e.target.value)}
    placeholder="Np. CMG2, CMG3..."
    disabled={disabled}
    style={{
      width: "100%",
      padding: 10,
      borderRadius: 6,
      border: "1px solid #ccc",
      fontSize: 14,
    }}
  />
</div>
     {/* ZDJĘCIA + DODAJ */}
<div
  style={{
    display: "flex",
    gap: 10,
    marginTop: 10,
    alignItems: "center",
  }}
>
  <label
    style={{
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: 24,
    }}
  >
    📸
    <input
      type="file"
      multiple
      accept="image/*"
      capture="environment"
      disabled={disabled}
      onChange={e => e.target.files && addImages(e.target.files)}
      style={{ display: "none" }}
    />
  </label>

  {images.length > 0 && (
    <span
      style={{
        fontSize: 13,
        color: "#1464f4",
        fontWeight: 500,
      }}
    >
      Dodano {images.length} zdję{images.length === 1 ? "cie" : images.length < 5 ? "cia" : "ć"}
    </span>
  )}

  <button
    onClick={handleAddEntry}
    disabled={disabled}
    style={{
      padding: "10px 20px",
      background: "#1464f4",
      color: "white",
      borderRadius: 6,
      fontWeight: "bold",
      cursor: disabled ? "not-allowed" : "pointer",
    }}
  >
    Dodaj
  </button>
</div>
    </div>
  );
};