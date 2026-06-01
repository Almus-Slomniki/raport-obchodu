import React from "react";
import { QuestionItem } from "./QuestionItem";
import { QuestionsState, ImagesState } from "./types";
import { saveAnswer } from "../supabaseAudit";

interface CriticalQuestionsProps {
  activeCategory: string;
  questions: QuestionsState;
  setQuestions: React.Dispatch<React.SetStateAction<QuestionsState>>;
  imagesState: ImagesState;
  setImagesState: React.Dispatch<React.SetStateAction<ImagesState>>;
  auditId: number;
  isFinished: boolean;
  setAnswerFn: (cat: string, id: string, value: boolean | undefined) => void;
  updateNoteFn: (cat: string, id: string, note: string) => void;
  addImageFn: (cat: string, id: string, files: File[]) => void;
}

export const CriticalQuestions: React.FC<CriticalQuestionsProps> = ({
  activeCategory,
  questions,
  setQuestions,
  imagesState,
  setImagesState,
  auditId,
  isFinished,
  setAnswerFn,
  updateNoteFn,
  addImageFn,
}) => {
  const categoryQuestions = questions?.[activeCategory] || [];

  if (!categoryQuestions.length) {
    return <div style={{ padding: 10 }}>Brak pytań w tej kategorii</div>;
  }

  return (
    <div>
      {categoryQuestions.map((q) => (
        <QuestionItem
          key={q.id}
          q={q}
          activeTab={activeCategory}
          setAnswer={setAnswerFn}
          updateNote={updateNoteFn}
          addImageToQuestion={addImageFn}
          images={imagesState?.[activeCategory]?.[q.id] || []}
          auditId={auditId}
          imagesState={imagesState}
          setImagesState={setImagesState}
          questions={questions}
          setQuestions={setQuestions}
          saveAnswer={saveAnswer}
          isFinished={isFinished}
        />
      ))}
    </div>
  );
};