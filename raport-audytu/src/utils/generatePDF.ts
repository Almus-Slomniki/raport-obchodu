import jsPDF from "jspdf";
import font from "../fonts/Roboto-Regular-normal";
import { generateSummaryTable } from "./generateSummaryTable";
import { generateQuestionsSection } from "./generateQuestionsSection";

export const generatePDF = async (
  questions: any,
  imagesState: any,
  auditorName?: string,
  leaderName?: string,
) => {
  const doc = new jsPDF("l", "mm", "a4");

  // Dodajemy font
  doc.addFileToVFS("Roboto-Regular.ttf", font);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // // Nagłówek z audytorem i liderem
  // doc.setFontSize(14);
  // doc.text(`Audytor: ${auditorName || "-"}`, 10, 10);
  // doc.text(`Lider: ${leaderName || "-"}`, 10, 18);

  // Generujemy tabelę podsumowującą
  const startY = generateSummaryTable(doc, questions, auditorName, leaderName);

  // Wygenerowanie sekcji pytań z obrazkami
  await generateQuestionsSection(doc, questions, imagesState, startY);

  // Przykład wyciemnienia w tabeli podsumowującej, jeśli pytanie disabled
  let currentY = startY;
  const rowHeight = 10;

  Object.keys(questions).forEach(cat => {
    questions[cat].forEach((q: any) => {
      if (q.disabled) {
        // Jasnoszare tło dla wyłączonej linii
        doc.setFillColor(220, 220, 220); // poprawne RGB
        doc.rect(10, currentY, 270, rowHeight, "F");
      }
      doc.setTextColor(0, 0, 0); // czarny tekst
      doc.text(`${cat}: ${q.text}`, 12, currentY + 7); // trochę paddingu w wierszu
      currentY += rowHeight;
    });
  });

  // Nazwa pliku z aktualną datą
  const fileName = `Zagadnienia-Krytyczne-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
