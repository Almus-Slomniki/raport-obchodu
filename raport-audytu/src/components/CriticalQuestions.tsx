// CriticalQuestions.tsx
import React from "react";
import { QuestionItem } from "./QuestionItem";
import { QuestionsState, ImagesState } from "./types";
import { saveAnswer } from "../supabaseAudit";

interface CriticalQuestionsProps {
  activeCategory: string;
  questions: QuestionsState;
  setQuestions: any;
  imagesState: ImagesState;
  setImagesState: any;
  auditId: number;
  isFinished: boolean;
  setAnswerFn: (cat: string, id: string, value: boolean | undefined) => void;
  updateNoteFn: (cat: string, id: string, note: string) => void;
  addImageFn: (cat: string, id: string, files: FileList) => void;
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
}) => (
  <div>
    {questions[activeCategory]?.map(q => (
      <QuestionItem
        key={q.id}
        q={q}
        activeTab={activeCategory}
        setAnswer={setAnswerFn}
        updateNote={updateNoteFn}
        addImageToQuestion={addImageFn}
        images={imagesState[activeCategory]?.[q.id] || []}
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
