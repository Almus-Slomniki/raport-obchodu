import jsPDF from "jspdf";
import font from "../fonts/Roboto-Regular-normal";
import { generateSummaryTable } from "./generateSummaryTable";
import { generateQuestionsSection } from "./generateQuestionsSection";

/**
 * Generuje PDF z audytu
 * @param questions - pytania audytu
 * @param imagesState - obrazy przypisane do pytań
 * @param auditNumber - numer audytu
 * @param auditorName - imię audytora
 * @param leaderName - imię lidera
 */
export const generatePDF = async (
  questions: any,
  imagesState: any,
  auditNumber?: number,      // numer audytu
  auditorName?: string,
  leaderName?: string,
) => {
  const doc = new jsPDF("l", "mm", "a4");

  // Dodajemy font
  doc.addFileToVFS("Roboto-Regular.ttf", font);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // --- Generujemy tabelę podsumowującą, teraz z numerem audytu ---
  const startY = generateSummaryTable(doc, questions, auditorName, leaderName, auditNumber);

  // --- Sekcja pytań z obrazkami ---
  await generateQuestionsSection(doc, questions, imagesState, startY);

  // --- Jasnoszare wiersze dla pytań disabled ---
  let currentY = startY;
  const rowHeight = 10;
  Object.keys(questions).forEach(cat => {
    questions[cat].forEach((q: any) => {
      if (q.disabled) {
        doc.setFillColor(220, 220, 220);
        doc.rect(10, currentY, 270, rowHeight, "F");
      }
      doc.setTextColor(0, 0, 0);
      doc.text(`${cat}: ${q.text}`, 12, currentY + 7);
      currentY += rowHeight;
    });
  });

  // --- Nazwa pliku PDF z numerem audytu ---
  const now = new Date();
  const dateString = `${now.getDate().toString().padStart(2,"0")}-${(now.getMonth()+1).toString().padStart(2,"0")}-${now.getFullYear()}`;
  const fileName = `Zagadnienia-Krytyczne-${auditNumber ?? "XXX"}-${dateString}.pdf`;

  doc.save(fileName);
};
