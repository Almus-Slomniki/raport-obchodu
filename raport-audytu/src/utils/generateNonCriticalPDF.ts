import jsPDF from "jspdf";
import font from "../fonts/Roboto-Regular-normal";
import { supabase } from "../supabaseClient";

export const generateNonCriticalPDF = async (auditId: number) => {
  try {
    const { data: entries, error } = await supabase
      .from("non_critical_entries")
      .select("*")
      .eq("audit_id", auditId)
      .order("line", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;
    if (!entries || entries.length === 0) {
      alert("Brak niekrytycznych uwag dla tego audytu.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    doc.addFileToVFS("Roboto-Regular.ttf", font);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const marginY = 15;
    const lineHeight = 7;
    const imgSize = 30;
    const imgGap = 5;

    let y = marginY;

    // Nagłówek PDF
    doc.setFont("Roboto", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 128);
    doc.text(`Raport niekrytycznych uwag - Obchód ${auditId}`, marginX, y);
    y += lineHeight * 3;

    // Grupowanie po linii
    const grouped: Record<string, typeof entries> = {};
    entries.forEach(entry => {
      const line = entry.line || "Brak kategorii";
      if (!grouped[line]) grouped[line] = [];
      grouped[line].push(entry);
    });

    for (const line of Object.keys(grouped)) {
      // Nagłówek linii
      if (y + lineHeight * 2 > pageHeight - marginY) {
        doc.addPage();
        y = marginY;
      }
      doc.setFont("Roboto", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 144, 255); // niebieski
      doc.text(`Linia: ${line}`, marginX, y);
      y += lineHeight + 2;

      doc.setFont("Roboto", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      for (const entry of grouped[line]) {
        const noteText = entry.note ? entry.note : "";
        const entryText = `• ${entry.name} ${noteText}`;
        const splitText = doc.splitTextToSize(entryText, pageWidth - marginX * 2);

        // drukowanie każdej linii osobno
        for (const lineText of splitText) {
          if (y + lineHeight > pageHeight - marginY) {
            doc.addPage();
            y = marginY;
          }
          doc.text(lineText, marginX + 5, y);
          y += lineHeight;
        }
        y += 2; // odstęp po wpisie

        // Miniaturki zdjęć
        if (entry.images && entry.images.length > 0) {
          let x = marginX + 5;
          let rowHeight = 0;

          for (const imgUrl of entry.images) {
            if (y + imgSize > pageHeight - marginY) {
              doc.addPage();
              y = marginY;
              x = marginX + 5;
            }

            try {
              const imgResp = await fetch(imgUrl);
              const blob = await imgResp.blob();
              const reader = new FileReader();
              const imgData: string = await new Promise(resolve => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              doc.addImage(imgData, 'JPEG', x, y, imgSize, imgSize);
              x += imgSize + imgGap;
              rowHeight = Math.max(rowHeight, imgSize);

              if (x + imgSize > pageWidth - marginX) {
                x = marginX + 5;
                y += rowHeight + imgGap;
                rowHeight = 0;
              }
            } catch (err) {
              console.error("Błąd ładowania obrazu:", err);
            }
          }
          y += rowHeight + 5;
        }

        if (y > pageHeight - marginY) {
          doc.addPage();
          y = marginY;
        }
      }

      y += lineHeight * 2; // odstęp między liniami
    }

    doc.save(`Niekrytyczne-${auditId}.pdf`);
  } catch (err) {
    console.error("Błąd generowania PDF niekrytycznych:", err);
    alert("Błąd generowania PDF niekrytycznych.");
  }
};
