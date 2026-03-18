import jsPDF from "jspdf";
import { categories, initialQuestions } from "../data/questions";

export const generateQuestionsSection = async (
  doc: jsPDF,
  questions: any,
  imagesState: any,
  startY: number
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const columnWidth = pageWidth - 2 * margin;
  const imageSpacing = 5;
  const maxImgWidth = columnWidth * 0.95;
  const maxImgHeight = 80;

  let yPos = startY || margin;

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  const imageToBase64 = async (url: string) =>
    new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Brak kontekstu canvas");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.5));
      };
      img.onerror = reject;
    });

  for (const cat of categories) {
    const catQuestions = questions[cat] || initialQuestions.map(q => ({ ...q }));
    if (catQuestions.length === 0) continue;

    // --- Nagłówek kategorii ---
    const headerLines = doc.splitTextToSize(`Linia: ${cat}`, columnWidth);
    doc.setFontSize(14);
    doc.setTextColor(20, 60, 120);
    doc.text(headerLines, margin, yPos);
    yPos += headerLines.length * 6 + 2;

    // --- Pytania w kategorii ---
    for (let i = 0; i < catQuestions.length; i++) {
      const q = catQuestions[i];

      // --- Wysokość bloku ---
      let blockHeight = 0;
      const qLines = doc.splitTextToSize(q.text, columnWidth - 20); // miejsce na ikonę
      blockHeight += qLines.length * 6 + 2;

      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth - 20);
        blockHeight += noteLines.length * 5 + 2;
      }

      const qImages = imagesState[cat]?.[q.id] || [];
      for (const imgSrc of qImages) {
        try {
          const img = await loadImage(await imageToBase64(imgSrc));
          const scale = Math.min(maxImgWidth / img.width, maxImgHeight / img.height, 1);
          blockHeight += img.height * scale + imageSpacing;
        } catch {}
      }

      if (yPos + blockHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      // --- Ikona statusu (V/X/okienko szare) ---
      const iconSize = 6;
      const iconX = margin;
      const iconY = yPos - 3;

      doc.setLineWidth(0.8);
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);

      if (q.answer === true) {
        doc.setDrawColor(0, 150, 0);
        doc.setFillColor(200, 255, 200);
        doc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, "FD");
        // doc.text("V", iconX + 1.5, iconY + 5); // V w środku
      } else if (q.answer === false) {
        doc.setDrawColor(200, 0, 0);
        doc.setFillColor(255, 200, 200);
        doc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, "FD");
        // doc.text("X", iconX + 1.7, iconY + 5); // X w środku
      } else {
        doc.setDrawColor(100);
        doc.setFillColor(255, 255, 255);
        doc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, "FD");
      }

      // --- Tekst pytania ---
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(qLines, margin + 12, yPos);
      yPos += qLines.length * 6 + 2;

      // --- Notatka ---
      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth - 20);
        doc.setTextColor(100, 100, 100);
        doc.text(noteLines, margin + 12, yPos);
        yPos += noteLines.length * 5 + 2;
      }
      doc.setTextColor(0, 0, 0);

      // --- Zdjęcia z ramką ---
      for (const imgSrc of qImages) {
        try {
          const base64 = await imageToBase64(imgSrc);
          const img = await loadImage(base64);
          let imgW = img.width * 0.264583;
          let imgH = img.height * 0.264583;
          const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
          imgW *= scale;
          imgH *= scale;

          if (yPos + imgH > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          doc.rect(margin - 1, yPos - 1, imgW + 2, imgH + 2); // ramka
          doc.addImage(base64, "JPEG", margin, yPos, imgW, imgH);
          yPos += imgH + imageSpacing;
        } catch {}
      }

      yPos += 4;
    }

    if (cat !== categories[categories.length - 1]) yPos += 8;
  }

  return yPos;
};