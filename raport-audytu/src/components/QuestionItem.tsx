// QuestionItem.tsx
import React, { useState } from 'react';
import { Question } from '../data/questions';
import { ImageUploader } from './ImageUploader';
import { ImagePreviewList } from './ImagePreviewList';
import imageCompression from 'browser-image-compression';

const MAX_NOTE_LENGTH = 500;

const sanitizeInput = (text: string) =>
  text
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/\.\.\//g, "");

type Props = {
  q: Question;
  activeTab: string;
  setAnswer: (cat: string, id: string, value: boolean | undefined) => void;
  updateNote: (cat: string, id: string, text: string) => void;
  addImageToQuestion: (cat: string, id: string, files: File[]) => void; // File[]
  images?: string[];
  auditId: number;
  imagesState: Record<string, Record<string, string[]>>;
  setImagesState: React.Dispatch<React.SetStateAction<Record<string, Record<string, string[]>>>>;
  questions: Record<string, Question[]>;
  setQuestions: React.Dispatch<React.SetStateAction<Record<string, Question[]>>>;
  saveAnswer: (auditId: number, cat: string, question: Question) => void;
  isFinished?: boolean;
};

export const QuestionItem: React.FC<Props> = ({
  q,
  activeTab,
  setAnswer,
  updateNote,
  addImageToQuestion,
  images = [],
  auditId,
  imagesState,
  setImagesState,
  questions,
  setQuestions,
  saveAnswer,
  isFinished = false,
}) => {
  const [showNote, setShowNote] = useState(false);
  const [showImages, setShowImages] = useState(false);

  // 🔹 Kompresja zdjęć przed dodaniem
  const handleUploadImages = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const compressedFiles: File[] = [];
    for (const file of files) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,         // max 0.5 MB
          maxWidthOrHeight: 1024, // max 1024 px
          useWebWorker: true,
        });
        compressedFiles.push(compressed as File);
      } catch (err) {
        console.warn('Nie udało się skompresować zdjęcia', err);
        compressedFiles.push(file); // jeśli błąd – dodaj oryginał
      }
    }

    addImageToQuestion(activeTab, q.id, compressedFiles);
  };

  const handleRemoveImage = (index: number) => {
    if (isFinished) return;
    const confirmDelete = window.confirm('Czy na pewno chcesz usunąć to zdjęcie?');
    if (!confirmDelete) return;

    const updatedImages = [...images];
    updatedImages.splice(index, 1);

    setImagesState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [q.id]: updatedImages
      }
    }));

    const updatedQuestions = questions[activeTab].map(question =>
      question.id === q.id ? { ...question, images: updatedImages } : question
    );
    setQuestions(prev => ({ ...prev, [activeTab]: updatedQuestions }));

    saveAnswer(auditId, activeTab, { ...q, images: updatedImages });
  };

  const handleToggleAnswer = (value: boolean) => {
    if (isFinished) return;
    const newValue = q.answer === value ? undefined : value;
    setAnswer(activeTab, q.id, newValue);
  };

  return (
    <div
      style={{
        marginBottom: 12,
        padding: 10,
        borderBottom: '1px solid #ccc',
        borderRadius: 6,
        backgroundColor: '#fafafa',
      }}
    >
      {/* Tekst pytania */}
      <div style={{ width: '100%' }}>
        <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>{q.text}</p>
        {q.description && (
          <p
            style={{
              fontSize: 12,
              margin: '2px 0 4px 0',
              color: '#666',
              fontStyle: 'italic',
              whiteSpace: 'pre-line'
            }}
          >
            {q.description}
          </p>
        )}
      </div>

      {/* Linia przycisków TAK/NIE + notatka + zdjęcia */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 300,
          margin: '8px auto',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        {/* TAK/NIE z nagłówkami */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 500, width: 50, textAlign: 'center' }}>Zgodność</span>
            <span style={{ fontSize: 12, fontWeight: 500, width: 50, textAlign: 'center' }}>Niezgodność</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleToggleAnswer(true)}
              disabled={isFinished}
              style={{
                width: 70,
                height: 60,
                fontSize: 32,
                fontWeight: 'bold',
                color: '#28a745',
                borderRadius: 6,
                border: q.answer === true ? '2px solid #28a745' : '1px solid #28a745',
                backgroundColor: q.answer === true ? '#c3e6cb' : '#f0f0f0',
                cursor: isFinished ? 'not-allowed' : 'pointer',
              }}
              title="Zgodność"
            >
              V
            </button>
            <button
              onClick={() => handleToggleAnswer(false)}
              disabled={isFinished}
              style={{
                width: 70,
                height: 60,
                fontSize: 32,
                fontWeight: 'bold',
                color: '#dc3545',
                borderRadius: 6,
                border: q.answer === false ? '2px solid #dc3545' : '1px solid #dc3545',
                backgroundColor: q.answer === false ? '#f5c6cb' : '#f0f0f0',
                cursor: isFinished ? 'not-allowed' : 'pointer',
              }}
              title="Niezgodność"
            >
              X
            </button>
          </div>
        </div>

        {/* Notatki + zdjęcia */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 70,
          }}
        >
          {/* Notatka z sygnalizatorem */}
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <button
              onClick={() => setShowNote(prev => !prev)}
              disabled={isFinished}
              style={{
                width: 35,
                height: 35,
                fontSize: 16,
                borderRadius: 4,
                border: '1px solid #ccc',
                backgroundColor: showNote ? '#e0e0e0' : '#f0f0f0',
                cursor: isFinished ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={showNote ? 'Ukryj notatkę' : 'Dodaj notatkę'}
            >
              ✏️
            </button>

            {q.note && q.note.trim() !== '' && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  border: '1px solid white',
                }}
              />
            )}
          </div>

          {/* Upload zdjęć */}
          {!isFinished && <ImageUploader onUpload={handleUploadImages} />}

          {/* Liczba zdjęć */}
          {images.length > 0 && (
            <span
              style={{ fontSize: 11, color: '#007bff', textAlign: 'center', marginTop: 4 }}
              onClick={() => setShowImages(prev => !prev)}
            >
              {images.length} zdjęc{images.length > 1 ? 'ia' : 'ie'}
            </span>
          )}
        </div>
      </div>

      {/* Pole notatki */}
      {showNote && (
        <div style={{ width: '100%' }}>
          <textarea
  placeholder="Wpisz własną uwagę..."
  value={q.note || ''}
  maxLength={MAX_NOTE_LENGTH}
  onChange={(e) => {
    const value = sanitizeInput(e.target.value).substring(
      0,
      MAX_NOTE_LENGTH
    );

    updateNote(activeTab, q.id, value);
  }}
  disabled={isFinished}
  style={{
    width: '100%',
    padding: 8,
    borderRadius: 4,
    border: '1px solid #ccc',
    marginTop: 6,
    marginBottom: 4,
    resize: 'vertical',
    fontSize: 14,
    backgroundColor: isFinished ? '#f5f5f5' : 'white',
    minHeight: 60,
    lineHeight: 1.4,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere'
  }}
/>
<div
  style={{
    textAlign: "right",
    fontSize: 11,
    color: "#666"
  }}
>
  {(q.note || "").length}/{MAX_NOTE_LENGTH}
</div>
          {!isFinished && (
            <button
              onClick={() => {
                updateNote(activeTab, q.id, q.note || '');
                setShowNote(false);
              }}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                borderRadius: 4,
                border: '1px solid #ccc',
                cursor: 'pointer',
                backgroundColor: '#f0f0f0',
              }}
            >
              Zapisz
            </button>
          )}
        </div>
      )}

      {/* Podgląd zdjęć */}
      {showImages && <ImagePreviewList images={images} onRemove={handleRemoveImage} disabled={isFinished} />}
    </div>
  );
};