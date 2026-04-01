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

    const imgGap = 5;

    // 🔥 max rozmiary (proporcjonalne)
    const maxWidth = 100;
    const maxHeight = 75;

    let y = marginY;

    // NAGŁÓWEK
    doc.setFont("Roboto", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 128);
    doc.text(`Raport niekrytycznych uwag - Obchód ${auditId}`, marginX, y);
    y += lineHeight * 3;

    // GRUPOWANIE
    const grouped: Record<string, typeof entries> = {};
    entries.forEach(entry => {
      const line = entry.line || "Brak linii";
      if (!grouped[line]) grouped[line] = [];
      grouped[line].push(entry);
    });

    for (const line of Object.keys(grouped)) {
      if (y + lineHeight * 3 > pageHeight - marginY) {
        doc.addPage();
        y = marginY;
      }

      // NAGŁÓWEK LINII
      doc.setFont("Roboto", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 144, 255);
      doc.text(`Linia: ${line}`, marginX, y);
      y += lineHeight + 1;

      // PODNAGŁÓWEK
      doc.setFont("Roboto", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Typ uwagi:", marginX + 5, y);
      y += lineHeight;

      doc.setFont("Roboto", "normal");
      doc.setFontSize(12);

      for (const entry of grouped[line]) {
        const noteText = entry.note ? ` ${entry.note}` : "";
        const entryText = `• ${entry.name}${noteText}`;

        const splitText = doc.splitTextToSize(
          entryText,
          pageWidth - marginX * 2
        );

        // TEKST
        for (const lineText of splitText) {
          if (y + lineHeight > pageHeight - marginY) {
            doc.addPage();
            y = marginY;
          }
          doc.text(lineText, marginX + 10, y);
          y += lineHeight;
        }

        y += 2;

        // 🔥 ZDJĘCIA Z PROPORCJAMI
        if (entry.images && entry.images.length > 0) {
          let x = marginX + 10;
          let imagesInRow = 0;

          for (const imgUrl of entry.images) {
            try {
              const imgResp = await fetch(imgUrl);
              const blob = await imgResp.blob();
              const reader = new FileReader();

              const imgData: string = await new Promise(resolve => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              // 🔥 pobranie proporcji
              const img = new Image();
              img.src = imgData;

              await new Promise(res => {
                img.onload = res;
              });

              let width = img.width;
              let height = img.height;

              // 🔥 skalowanie proporcjonalne
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;

              // sprawdzenie strony
              if (y + height > pageHeight - marginY) {
                doc.addPage();
                y = marginY;
                x = marginX + 10;
                imagesInRow = 0;
              }

              doc.addImage(imgData, "JPEG", x, y, width, height);

              imagesInRow++;
              x += maxWidth + imgGap;

              // max 2 w rzędzie
              if (imagesInRow === 2) {
                imagesInRow = 0;
                x = marginX + 10;
                y += maxHeight + imgGap;
              }
            } catch (err) {
              console.error("Błąd ładowania obrazu:", err);
            }
          }

          if (imagesInRow !== 0) {
            y += maxHeight + imgGap;
          }

          y += 5;
        }

        if (y > pageHeight - marginY) {
          doc.addPage();
          y = marginY;
        }
      }

      y += lineHeight * 2;
    }

    const now = new Date();
    const dateString = `${now
      .getDate()
      .toString()
      .padStart(2, "0")}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getFullYear()}`;

    doc.save(
      `Zagadnienia-niekrytyczne-${auditId ?? "XXX"}-${dateString}.pdf`
    );
  } catch (err) {
    console.error("Błąd generowania PDF niekrytycznych:", err);
    alert("Błąd generowania PDF niekrytycznych.");
  }
};