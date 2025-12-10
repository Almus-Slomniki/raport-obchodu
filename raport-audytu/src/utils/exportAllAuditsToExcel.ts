import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { categories, initialQuestions } from "../data/questions";

interface AuditAnswer {
  audit_id: number;
  finished_at: string | null; // data zakończenia audytu z supabase
  category: string;
  question_id: string;
  question_text: string;
  answer: boolean | null;
}

export const exportAllAuditsToExcel = async (allAnswers: AuditAnswer[]) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Raport Audytów");

  // Grupowanie odpowiedzi po audytach
  const auditsGrouped: Record<number, AuditAnswer[]> = {};
  allAnswers.forEach(ans => {
    if (!auditsGrouped[ans.audit_id]) auditsGrouped[ans.audit_id] = [];
    auditsGrouped[ans.audit_id].push(ans);
  });

  let currentRow = 1;

  for (const auditIdStr of Object.keys(auditsGrouped)) {
    const auditId = Number(auditIdStr);
    const auditData = auditsGrouped[auditId];

    // Pobranie daty zakończenia audytu
    const finishedAt = auditData[0].finished_at
      ? auditData[0].finished_at.split("T")[0] // YYYY-MM-DD
      : "";

    // --- Nagłówek z datą zakończenia audytu ---
    const dateRow = ws.getRow(currentRow);
    dateRow.getCell(1).value = `Obchód ${auditId} - Data zakończenia: ${finishedAt}`;
    dateRow.font = { bold: true, size: 14 };
    currentRow += 2; // przerwa

    // --- Nagłówki tabeli ---
    const headerRow = ws.getRow(currentRow);
    headerRow.values = ["Pytanie", ...categories];
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1464F4" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
    currentRow++;

    // --- Wiersze pytań ---
    initialQuestions.forEach((q, qi) => {
      const row = ws.getRow(currentRow);
      row.getCell(1).value = q.text;

      categories.forEach((cat, ci) => {
        const ans = auditData.find(a => a.category === cat && a.question_id === (qi + 1).toString())?.answer;
        const value = ans === true ? "✔" : ans === false ? "✖" : "";
        const cell = row.getCell(ci + 2);
        cell.value = value;

        // Kolorowanie ✔/✖
        if (value === "✔") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } };
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        } else if (value === "✖") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        }

        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });

      row.height = 20;
      currentRow++;
    });

    currentRow += 2; // odstęp przed kolejnym audytem
  }

  // Szerokości kolumn
  ws.columns = [
    { width: 60 }, // Pytanie
    ...categories.map(() => ({ width: 10 }))
  ];

  // --- Eksport ---
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Raport_wszystkich_audytow.xlsx`);
};
