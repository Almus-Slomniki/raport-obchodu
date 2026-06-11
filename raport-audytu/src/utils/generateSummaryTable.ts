import jsPDF from "jspdf";
import { categories, initialQuestions } from "../data/questions";

export const generateSummaryTable = (
  doc: jsPDF,
  questions: any,
  auditorName?: string,
  leaderName?: string,
  auditNumber?: number,
  auditDate?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 4;

  let y = 10;
  const baseRowHeight = 12; // zmniejszone z 16
  const startX = margin;

  /* ================= NAGŁÓWEK ================= */
  doc.setFontSize(16); // zmniejszone z 18
  doc.setFont("Roboto", "bold");
  doc.text("Zagadnienia krytyczne", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(11); // zmniejszone z 12

  if (auditorName) { doc.text(`Audytor: ${auditorName}`, pageWidth / 2, y, { align: "center" }); y += 5; }
  if (leaderName) { doc.text(`Lider: ${leaderName}`, pageWidth / 2, y, { align: "center" }); y += 5; }
  if (auditNumber !== undefined) { doc.text(`Numer audytu: ${String(auditNumber)}`, pageWidth / 2, y, { align: "center" }); y += 5; }
  if (auditDate) { doc.text(`Data audytu: ${auditDate}`, pageWidth / 2, y, { align: "center" }); y += 5; }

  /* ================= LEGENDA ================= */
  doc.setFont("Roboto", "bold");
  doc.setFontSize(9); // zmniejszone z 10
  doc.text("Metodologia:", startX + 200, y - 14);
  doc.setFont("Roboto", "normal");
  doc.text("V = zgodność  X = niezgodność", startX + 230, y - 14);

  // const legendX = startX + 200;
  // const legendY = y - 8;

  // doc.setFillColor(240, 240, 240);
  // doc.rect(legendX, legendY, 12, 8, "F");
  // doc.setDrawColor(200, 200, 200);
  // doc.line(legendX, legendY + 3, legendX + 12, legendY + 3);
  // doc.line(legendX, legendY + 6, legendX + 12, legendY + 6);
  // doc.setTextColor(0);
  // doc.text(" linia wyłączona z obchodu", legendX + 18, legendY + 6);
  // y -= 2;

  /* ================= TABELA ================= */
  const firstColWidth = 120;
  const otherColWidth = (pageWidth - margin * 2 - firstColWidth) / categories.length;
  const totalWidth = firstColWidth + categories.length * otherColWidth;
  const tableStartY = y;

  /* ===== NAGŁÓWKI KATEGORII + KOMENTARZE ===== */
  let headerHeight = baseRowHeight;
  categories.forEach((cat) => {
    const comment = questions[cat]?.[0]?.category_comment;
    if (questions[cat]?.[0]?.disabled && comment) {
      const lines: string[] = doc.splitTextToSize(String(comment), otherColWidth - 4);
      headerHeight = Math.max(headerHeight, 8 + lines.length * 4); // mniejsze linie
    }
  });

  categories.forEach((cat, i) => {
    const centerX = startX + firstColWidth + i * otherColWidth + otherColWidth / 2;
    const isDisabled = questions[cat]?.[0]?.disabled;
    const comment = questions[cat]?.[0]?.category_comment;

    doc.setFont("Roboto", "bold");
    doc.setFontSize(11); // zmniejszone z 12
    doc.setTextColor(20, 60, 120);
    doc.text(cat, centerX, y + 5, { align: "center" });

    if (isDisabled && comment) {
      doc.setFont("Roboto", "normal");
      doc.setFontSize(8); // zmniejszone z 9
      doc.setTextColor(80, 80, 80);

      const wrapped: string[] = doc.splitTextToSize(String(comment), otherColWidth - 4);
      wrapped.forEach((line: string, idx: number) => {
        doc.text(line, centerX, y + 10 + idx * 4, { align: "center" });
      });
    }
    doc.setTextColor(0);
  });

  y += headerHeight;
  doc.line(startX, y, startX + totalWidth, y);

  /* ================= WIERSZE PYTAŃ ================= */
  initialQuestions.forEach((q, qi) => {
    const wrappedQText = doc.splitTextToSize(q.text, firstColWidth - 4);
    const desc = q.description || "";
    const wrappedDesc = desc ? doc.splitTextToSize(desc, firstColWidth - 4) : [];

    const rowHeight = Math.max(baseRowHeight, wrappedQText.length * 5 + wrappedDesc.length * 4 + 4); // mniejsze spacing

    doc.setFont("Roboto", "normal");
    doc.setFontSize(11); // zmniejszone z 12
    doc.text(wrappedQText, startX + 2, y + 5);

    if (wrappedDesc.length) {
      doc.setFontSize(9); // mniejsze
      doc.setTextColor(60);
      doc.text(wrappedDesc, startX + 2, y + 5 + wrappedQText.length * 5);
      doc.setFontSize(11);
      doc.setTextColor(0);
    }

  categories.forEach((cat, ci) => {
  const qData = questions[cat]?.[qi];
  const colX = startX + firstColWidth + ci * otherColWidth;

  // Wyłączona linia → szare tło + kreskowanie
  if (qData?.disabled) {
    doc.setFillColor(240, 240, 240);
    doc.rect(colX, y, otherColWidth, rowHeight, "F");

    doc.setDrawColor(200, 200, 200);
    for (let py = y; py < y + rowHeight; py += 3) {
      doc.line(colX, py, colX + otherColWidth, py);
    }
  }

  // V/X tylko dla aktywnych linii
  if (!qData?.disabled) {
    let symbol = "";

    if (qData?.answer === true) symbol = "V";
    if (qData?.answer === false) symbol = "X";

    if (symbol === "V") doc.setTextColor(0, 150, 0);
    if (symbol === "X") doc.setTextColor(200, 0, 0);

    doc.setFont("Roboto", "bold");
    doc.setFontSize(16);
    doc.text(
      symbol,
      colX + otherColWidth / 2,
      y + rowHeight / 2 + 3,
      { align: "center" }
    );

    doc.setTextColor(0);
  }

  doc.setFont("Roboto", "normal");
  doc.setFontSize(11);
});

    y += rowHeight;
    doc.line(startX, y, startX + totalWidth, y);
  });

  /* ================= LINIE PIONOWE ================= */
  doc.line(startX, tableStartY, startX, y);
  doc.line(startX + firstColWidth, tableStartY, startX + firstColWidth, y);
  categories.forEach((_, i) => {
    const x = startX + firstColWidth + (i + 1) * otherColWidth;
    doc.line(x, tableStartY, x, y);
  });

  return y + 8;
};
