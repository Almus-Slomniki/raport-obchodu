import React, { useState } from 'react';
import { Question } from '../data/questions';
import { ImageUploader } from './ImageUploader';
import { ImagePreviewList } from './ImagePreviewList';

type Props = {
  q: Question;
  activeTab: string;
  setAnswer: (cat: string, id: string, value: boolean | undefined) => void;
  updateNote: (cat: string, id: string, text: string) => void;
  addImageToQuestion: (cat: string, id: string, files: FileList) => void;
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

const handleRemoveImage = (index: number) => {
  if (isFinished) return;

  // Dodajemy potwierdzenie przed usunięciem
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
    <div style={{ marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 2 }}>
<div style={{ flex: 1 }}>
  <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>
    {q.text}
  </p>

  {q.description && (
    <p
      style={{
        fontSize: 12,
        margin: '2px 0 0 0',
        color: '#666',
        fontStyle: 'italic',
      }}
    >
      {q.description}
    </p>
  )}
</div>
        {/* Przycisk "TAK" */}
        <button
          onClick={() => handleToggleAnswer(true)}
          disabled={isFinished}
          style={{
            padding: '6px 12px',
            fontSize: 30,
            fontWeight: 'bold',
            color: '#28a745',
            borderRadius: 5,
            cursor: isFinished ? 'not-allowed' : 'pointer',
            minWidth: 50,
            border: q.answer === true ? '2px solid #28a745' : '1px solid #28a745',
            backgroundColor: q.answer === true ? '#c3e6cb' : '#f0f0f0',
            boxShadow: q.answer === true ? '0 0 5px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          V
        </button>

        {/* Przycisk "NIE" */}
        <button
          onClick={() => handleToggleAnswer(false)}
          disabled={isFinished}
          style={{
            padding: '6px 12px',
            fontSize: 30,
            fontWeight: 'bold',
            color: '#dc3545',
            borderRadius: 5,
            cursor: isFinished ? 'not-allowed' : 'pointer',
            minWidth: 50,
            border: q.answer === false ? '2px solid #dc3545' : '1px solid #dc3545',
            backgroundColor: q.answer === false ? '#f5c6cb' : '#f0f0f0',
            boxShadow: q.answer === false ? '0 0 5px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          X
        </button>

        {/* Sekcja zdjęć */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 2 }}>
          {!isFinished && (
            <ImageUploader
              onUpload={(files) => addImageToQuestion(activeTab, q.id, files)}
            />
          )}
          {images.length > 0 && (
            <span
              style={{ fontSize: 11, color: '#007bff', marginTop: 2, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => setShowImages(prev => !prev)}
            >
              {images.length} zdjęc{images.length > 1 ? 'ia' : 'ie'}
            </span>
          )}
        </div>

        {/* Przycisk notatki */}
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
            marginTop: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={showNote ? 'Ukryj notatkę' : 'Dodaj notatkę'}
        >
          ✏️
        </button>
      </div>

      {/* Pole notatki */}
      {showNote && (
        <textarea
          placeholder="Wpisz własną uwagę..."
          value={q.note || ''}
          onChange={(e) => updateNote(activeTab, q.id, e.target.value)}
          disabled={isFinished}
          style={{
            width: '100%',
            padding: 8,
            borderRadius: 4,
            border: '1px solid #ccc',
            marginBottom: 8,
            resize: 'vertical',
            fontSize: 14,
            backgroundColor: isFinished ? '#f5f5f5' : 'white'
          }}
        />
      )}

      {/* Podgląd zdjęć */}
    {showImages && (
  <ImagePreviewList
    images={images}
    onRemove={handleRemoveImage}
    disabled={isFinished} // blokuje przycisk po zakończeniu audytu
  />
)}

    </div>
  );
};
