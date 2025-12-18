import jsPDF from "jspdf";
import font from "../fonts/Roboto-Regular-normal";
import { generateSummaryTable } from "./generateSummaryTable";
import { generateQuestionsSection } from "./generateQuestionsSection";

export const generatePDF = async (
  questions: any,
  imagesState: any,
  auditorName?: string,
  leaderName?: string
) => {
  const doc = new jsPDF("l", "mm", "a4");

  // Dodajemy font
  doc.addFileToVFS("Roboto-Regular.ttf", font);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // Wstawienie Audytora i Lidera w nagłówku
  const headerY = 10;
  if (auditorName) {
    // doc.setFontSize(12);
    // doc.text(`Audytor: ${auditorName}`, 10, headerY);
  }
  if (leaderName) {
    // doc.setFontSize(12);
    // doc.text(`Lider: ${leaderName}`, 10, headerY + 6);
  }

  // Generujemy tabelę podsumowującą
  const startY = generateSummaryTable(doc, questions, auditorName, leaderName);

  // Generujemy sekcję pytań wraz z obrazkami
  await generateQuestionsSection(doc, questions, imagesState, startY);

  const fileName = `Zagadnienia-Krytyczne-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
