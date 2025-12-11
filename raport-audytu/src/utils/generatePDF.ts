import jsPDF from "jspdf";
import font from "../fonts/Roboto-Regular-normal";
import { generateSummaryTable } from "./generateSummaryTable";
import { generateQuestionsSection } from "./generateQuestionsSection";

export const generatePDF = async (questions: any, imagesState: any, auditorName?: string) => {
  const doc = new jsPDF("l", "mm", "a4");

  // Dodajemy font
  doc.addFileToVFS("Roboto-Regular.ttf", font);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // Przekazujemy auditorName
  const startY = generateSummaryTable(doc, questions, auditorName);
  await generateQuestionsSection(doc, questions, imagesState, startY);

  const fileName = `Zagadnienia-Krytyczne-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
