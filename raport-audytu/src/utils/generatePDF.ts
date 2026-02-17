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
  auditNumber?: number,
  auditorName?: string,
  leaderName?: string,
) => {
  const doc = new jsPDF("l", "mm", "a4");

  // --- Dodajemy font Roboto ---
  doc.addFileToVFS("Roboto-Regular.ttf", font);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // --- Generujemy tabelę podsumowującą i pobieramy startY ---
  const startY = generateSummaryTable(doc, questions, auditorName, leaderName, auditNumber);

  // --- Sekcja pytań z obrazkami ---
  const lastY = await generateQuestionsSection(doc, questions, imagesState, startY);

  // --- Jasnoszare tło dla pytań disabled (bez tekstu) ---
  if (questions && typeof questions === "object") {
    const rowHeight = 10;
    let currentY = startY;

    Object.keys(questions).forEach(cat => {
      questions[cat].forEach((q: any) => {
        if (q.disabled) {
          doc.setFillColor(220, 220, 220);
          doc.rect(10, currentY, doc.internal.pageSize.getWidth() - 20, rowHeight, "F");
        }
        currentY += rowHeight;
      });
    });
  }

  // --- Nazwa pliku PDF z numerem audytu i datą ---
  const now = new Date();
  const dateString = `${now.getDate().toString().padStart(2,"0")}-${(now.getMonth()+1).toString().padStart(2,"0")}-${now.getFullYear()}`;
  const fileName = `Zagadnienia-Krytyczne-${auditNumber ?? "XXX"}-${dateString}.pdf`;

  // --- Zapis PDF ---
  doc.save(fileName);
};
