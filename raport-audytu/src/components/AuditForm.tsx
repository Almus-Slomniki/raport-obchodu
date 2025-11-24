import React, { useEffect, useState } from 'react';
import { categories, initialQuestions } from '../data/questions';
import { Tabs } from './Tabs';
import { QuestionItem } from './QuestionItem';
import { QuestionsState, ImagesState } from './types';
import { loadAuditData, saveAnswer, uploadImage } from '../supabaseAudit';
import { generatePDF } from '../utils/generatePDF';
import { AuditActions } from './AuditActions';
import { exportToExcel } from '../utils/exportToExcel';

export const AuditForm: React.FC = () => {
  const [auditId, setAuditId] = useState<number | null>(null);
  const [auditInput, setAuditInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>(categories[0]);
  const [questions, setQuestions] = useState<QuestionsState>({});
  const [imagesState, setImagesState] = useState<ImagesState>({});

  useEffect(() => {
    const lastAudit = localStorage.getItem("lastUnfinishedAudit");
    if (lastAudit) {
      setAuditId(parseInt(lastAudit));
      console.log("🔄 Wczytano ostatni niezakończony audyt:", lastAudit);
    }
  }, []);

  useEffect(() => {
    if (auditId === null) return;

    const load = async () => {
      const { questions: loadedQuestions, images: loadedImages } = await loadAuditData(auditId);

      const fullQuestions: QuestionsState = {};
      const fullImages: ImagesState = {};

      categories.forEach(cat => {
        fullQuestions[cat] = initialQuestions.map((q, index) => {
          const questionId = (index + 1).toString();
          const loadedQ = loadedQuestions[cat]?.find(lq => lq.id === questionId);

          return {
            ...q,
            id: questionId,
            answer: loadedQ?.answer ?? undefined,
            note: loadedQ?.note ?? '',
            images: loadedQ?.images ?? [],
          };
        });

        fullImages[cat] = loadedImages[cat] || {};
      });

      setQuestions(fullQuestions);
      setImagesState(fullImages);
    };

    load();
  }, [auditId]);

  const handleAuditSubmit = () => {
    if (!auditInput) return;
    const num = parseInt(auditInput);
    if (!isNaN(num)) {
      setAuditId(num);
      localStorage.setItem("lastUnfinishedAudit", num.toString());
    }
  };

  const setAnswerFn = (cat: string, id: string, value: boolean | undefined) => {
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q => q.id === id ? { ...q, answer: value } : q);
      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion && auditId !== null) saveAnswer(auditId, cat, updatedQuestion);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  const updateNoteFn = (cat: string, id: string, note: string) => {
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q => q.id === id ? { ...q, note } : q);
      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion && auditId !== null) saveAnswer(auditId, cat, updatedQuestion);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  const addImageFn = async (cat: string, id: string, files: FileList) => {
    if (auditId === null) return;

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(auditId, cat, id, files[i]);
      uploadedUrls.push(url);
    }

    setImagesState(prev => ({
      ...prev,
      [cat]: {
        ...(prev[cat] || {}),
        [id]: [...(prev[cat]?.[id] || []), ...uploadedUrls],
      },
    }));

    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q =>
        q.id === id ? { ...q, images: [...(q.images || []), ...uploadedUrls] } : q
      );
      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion) saveAnswer(auditId, cat, updatedQuestion);
      return { ...prev, [cat]: updatedCategory };
    });
  };

  const downloadAllImages = async (imagesState: any) => {
    for (const line of Object.keys(imagesState)) {
      for (const qId of Object.keys(imagesState[line])) {
        const images = imagesState[line][qId];
        for (let i = 0; i < images.length; i++) {
          const url = images[i];
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${line}_pytanie${qId}_${i + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            await new Promise(r => setTimeout(r, 100));
          } catch (e) {
            console.error("Błąd pobierania:", url, e);
          }
        }
      }
    }
  };

  if (auditId === null) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: '50px auto', textAlign: 'center' }}>
        <h2>Wpisz numer audytu</h2>
        <input
          type="number"
          value={auditInput}
          onChange={e => setAuditInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAuditSubmit(); }}
          placeholder="Numer audytu"
          style={{ padding: 10, fontSize: 16, width: '100%', marginBottom: 10 }}
        />
        <button
          onClick={handleAuditSubmit}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            backgroundColor: '#1464f4',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Wczytaj audyt
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Zagadnienia krytyczne</h1>
      <p>📌 Numer obchodu: <strong>{auditId}</strong></p>
      <AuditActions auditId={auditId} />
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {questions[activeTab]?.map(q => (
        <QuestionItem
          key={q.id}
          q={q}
          activeTab={activeTab}
          setAnswer={setAnswerFn}
          updateNote={updateNoteFn}
          addImageToQuestion={addImageFn}
          images={imagesState[activeTab]?.[q.id] || []}
          auditId={auditId}
          imagesState={imagesState}
          setImagesState={setImagesState}
          questions={questions}
          setQuestions={setQuestions}
          saveAnswer={saveAnswer}
        />
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          style={{
            padding: '10px 20px',
            fontSize: 16,
            backgroundColor: '#1464f4',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
          onClick={() => generatePDF(questions, imagesState)}
        >
          📄 Pobierz PDF
        </button>

        <button
          style={{
            padding: '10px 20px',
            fontSize: 16,
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
          onClick={() => exportToExcel(questions,  auditId)}
        >
          📊 Eksport do Excel
        </button>

        <button onClick={() => downloadAllImages(imagesState)}>
          Pobierz wszystkie zdjęcia
        </button>
      </div>
    </div>
  );
};
