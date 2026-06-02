import React, { useEffect, useState } from "react";
import { NonCriticalEntry } from "../types";
import { getPrivateImageUrl } from "../../supabaseAudit";

type Props = {
  entry: NonCriticalEntry;
  onUpdate: (entry: NonCriticalEntry) => void;
  onRemove: (id?: number) => void;
};

export const NonCriticalEntryItem: React.FC<Props> = ({
  entry,
  onUpdate,
  onRemove,
}) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      if (!entry.images?.length) {
        setImageUrls([]);
        return;
      }

      setLoading(true);

      try {
        const urls = await Promise.all(
          entry.images.map(async (img) => {
            // jeśli już jest pełny URL
            if (
              img?.startsWith("http://") ||
              img?.startsWith("https://") ||
              img?.startsWith("blob:")
            ) {
              return img;
            }

            // zawsze świeży signed URL
            const signedUrl = await getPrivateImageUrl(img, 43200);

            return signedUrl || null;
          })
        );

        setImageUrls(urls.filter(Boolean) as string[]);
      } catch (err) {
        console.error("Błąd ładowania zdjęć:", err);
        setImageUrls([]);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [entry.id]); // 🔥 KLUCZOWE: refresh po ID, nie po images

  const handleAddNote = () => {
    const note = prompt("Wpisz uwagi:", entry.note || "");

    if (note !== null) {
      onUpdate({
        ...entry,
        note,
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    if (window.confirm("Czy na pewno chcesz usunąć to zdjęcie?")) {
      onUpdate({
        ...entry,
        images: entry.images?.filter((_, i) => i !== index),
      });
    }
  };

  return (
    <li
      style={{
        marginBottom: 16,
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 10,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        backgroundColor: "#fafafa",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Usuń wpis */}
      <button
        onClick={() => {
          if (window.confirm("Czy na pewno chcesz usunąć ten wpis?")) {
            onRemove(entry.id);
          }
        }}
        style={{
          position: "absolute",
          top: -13,
          right: -13,
          backgroundColor: "grey",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: 24,
          height: 24,
          fontSize: 16,
          lineHeight: "24px",
          textAlign: "center",
          cursor: "pointer",
        }}
        aria-label="Usuń wpis"
      >
        ×
      </button>

      {/* Dane */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <strong style={{ fontSize: 16 }}>
          {entry.name || "Brak nazwy"}
        </strong>

        <div style={{ fontSize: 14, color: "#333" }}>
          Linia: {entry.line || "Brak linii"}
        </div>

        {entry.note && (
          <div style={{ fontStyle: "italic", color: "#555", fontSize: 13 }}>
            Uwagi: {entry.note}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ fontSize: 12, color: "#888" }}>
          Ładowanie zdjęć...
        </div>
      )}

      {/* Zdjęcia */}
      {imageUrls.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          {imageUrls.map((img, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: 100,
                height: 100,
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            >
              <img
                src={img}
                alt={`Zdjęcie ${i + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              <button
                onClick={() => handleRemoveImage(i)}
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Brak zdjęć */}
      {!loading && imageUrls.length === 0 && (
        <div style={{ fontSize: 12, color: "#999" }}>
          Brak zdjęć
        </div>
      )}

      {/* Uwagi */}
      <button
        onClick={handleAddNote}
        style={{
          marginTop: 8,
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #ccc",
          backgroundColor: "#f0f0f0",
          cursor: "pointer",
        }}
      >
        Dodaj uwagi
      </button>
    </li>
  );
};