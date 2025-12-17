import jsPDF from "jspdf";
import { categories, initialQuestions } from "../data/questions";

export const generateSummaryTable = (
  doc: jsPDF,
  questions: any,
  auditorName?: string,
  leaderName?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 4;

  let y = 7; // START wyżej
  const baseRowHeight = 16;
  const startX = margin;

  // --- Nagłówek dokumentu ---
  doc.setFontSize(18);
  doc.setFont("Roboto", "bold");
  doc.text("Zagadnienia krytyczne", pageWidth / 2, y, { align: "center" });
  y += 5;

  // --- Informacja o audytorze ---
  if (auditorName) {
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");
    doc.text(`Audytor: ${auditorName}`, pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  // --- Informacja o liderze ---
  if (leaderName) {
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");
    doc.text(`Lider: ${leaderName}`, pageWidth / 2, y, { align: "center" });
    y += 8;
  }

  doc.setFontSize(14);

  // --- Legenda nad tabelą ---
  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  doc.text("Metodologia:", startX, y);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.text("V = zgodność  X = niezgodność", startX + 30, y);
  y += 8; // odstęp przed tabelą

  // --- Górna linia tabeli ---
  const firstColWidth = 120;
  const otherColWidth = (pageWidth - margin * 2 - firstColWidth) / categories.length;
  const totalWidth = firstColWidth + categories.length * otherColWidth;
  doc.line(startX, y, startX + totalWidth, y);
  const tableStartY = y;

  // --- Nagłówki kategorii ---
  categories.forEach((cat, i) => {
    const centerX = startX + firstColWidth + i * otherColWidth + otherColWidth / 2;
    const centerY = y + baseRowHeight / 2 + 1;

    doc.setFont("Roboto", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 60, 120);
    doc.text(cat, centerX, centerY, { align: "center" });
    doc.setFont("Roboto", "normal");
    doc.setTextColor(0, 0, 0);
  });

  y += baseRowHeight;

  // Linia pod nagłówkami
  doc.line(startX, y, startX + totalWidth, y);

  // --- Pytania i odpowiedzi ---
  initialQuestions.forEach((q, qi) => {
    const wrappedQText = doc.splitTextToSize(q.text, firstColWidth - 4);
    const desc = q.description || "";
    const wrappedDesc = desc ? doc.splitTextToSize(desc, firstColWidth - 4) : [];

    const rowHeight = Math.max(
      baseRowHeight,
      wrappedQText.length * 7 + 4 + wrappedDesc.length * 5
    );

    // --- Rysujemy pytanie ---
    doc.setFont("Roboto", "normal");
    doc.setFontSize(12);
    doc.text(wrappedQText, startX + 2, y + 7);

    // --- Rysujemy opis pod pytaniem ---
    if (wrappedDesc.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      doc.text(wrappedDesc, startX + 2, y + 7 + wrappedQText.length * 7, {
        maxWidth: firstColWidth - 4
      });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
    }

    // --- Rysujemy symbole odpowiedzi ---
    categories.forEach((cat, ci) => {
      const qData = questions[cat]?.[qi];
      let ansSymbol = "";

      if (qData?.answer === true) ansSymbol = "V";
      else if (qData?.answer === false) ansSymbol = "X";

      const centerX = startX + firstColWidth + ci * otherColWidth + otherColWidth / 2;
      const centerY = y + baseRowHeight / 2 + 3;

      if (ansSymbol === "V") doc.setTextColor(0, 150, 0);
      else if (ansSymbol === "X") doc.setTextColor(200, 0, 0);
      else doc.setTextColor(0, 0, 0);

      doc.setFont("Roboto", "bold");
      doc.setFontSize(20);
      doc.text(ansSymbol, centerX, centerY, { align: "center" });
      doc.setFont("Roboto", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
    });

    y += rowHeight;
    doc.line(startX, y, startX + totalWidth, y);
  });

  // --- pionowe linie tabeli ---
  doc.line(startX, tableStartY, startX, y);
  doc.line(startX + firstColWidth, tableStartY, startX + firstColWidth, y);
  categories.forEach((_, i) => {
    const x = startX + firstColWidth + (i + 1) * otherColWidth;
    doc.line(x, tableStartY, x, y);
  });

  return y + 10;
};
