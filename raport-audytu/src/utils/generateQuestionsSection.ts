import jsPDF from "jspdf";
import { categories, initialQuestions } from "../data/questions";

/**
 * Generuje sekcję pytań z obrazkami w PDF
 * @param doc - instancja jsPDF
 * @param questions - obiekty pytań
 * @param imagesState - obrazy przypisane do pytań
 * @param startY - początkowa pozycja Y w PDF
 * @param onProgress - opcjonalny callback procentu postępu
 */
export const generateQuestionsSection = async (
  doc: jsPDF,
  questions: any,
  imagesState: any,
  startY: number,
  onProgress?: (percent: number) => void
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const maxImgWidth = 120; // mm
  const maxImgHeight = 80; // mm
  const imageSpacing = 5;

  let yPos = startY || margin;
  let totalQuestions = 0;
  categories.forEach(cat => totalQuestions += (questions[cat]?.length || initialQuestions.length));
  let processedQuestions = 0;

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
        resolve(canvas.toDataURL("image/jpeg", 0.5)); // kompresja 50%
      };
      img.onerror = reject;
    });

  for (const cat of categories) {
    const catQuestions = questions[cat] || initialQuestions.map(q => ({ ...q }));
    if (!catQuestions.length) continue;

    // Nagłówek kategorii
    doc.setFontSize(14);
    doc.setTextColor(20, 60, 120);
    const headerLines = doc.splitTextToSize(`Linia: ${cat}`, pageWidth - 2 * margin);
    doc.text(headerLines, margin, yPos);
    yPos += headerLines.length * 6 + 2;

    for (const q of catQuestions) {
      // --- Tekst pytania ---
      const qLines = doc.splitTextToSize(q.text, pageWidth - 2 * margin - 20);
      const questionHeight = qLines.length * 6 + 2;

      let noteHeight = 0;
      if (q.note?.trim()) {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, pageWidth - 2 * margin - 20);
        noteHeight = noteLines.length * 5 + 2;
      }

      // --- Oblicz wysokość zdjęć ---
      const qImages = imagesState[cat]?.[q.id] || [];
      let imagesHeight = 0;
      for (const imgSrc of qImages) {
        try {
          const img = await loadImage(await imageToBase64(imgSrc));
          const scale = Math.min(maxImgWidth / (img.width * 0.264583), maxImgHeight / (img.height * 0.264583), 1);
          imagesHeight += img.height * 0.264583 * scale + imageSpacing;
        } catch {}
      }

      const blockHeight = questionHeight + noteHeight + imagesHeight + 4;

      // --- Nowa strona jeśli brak miejsca ---
      if (yPos + blockHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      // --- Ikona statusu ---
      const iconSize = 6;
      const iconX = margin;
      const iconY = yPos - 3;

      doc.setLineWidth(0.8);
      doc.setFontSize(7);

      if (q.answer === true) {
        doc.setDrawColor(0, 150, 0);
        doc.setFillColor(200, 255, 200);
        doc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, "FD");
      } else if (q.answer === false) {
        doc.setDrawColor(200, 0, 0);
        doc.setFillColor(255, 200, 200);
        doc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, "FD");
      } else {
        doc.setDrawColor(100);
        doc.setFillColor(255, 255, 255);
        doc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, "FD");
      }

      // --- Tekst pytania ---
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(qLines, margin + 12, yPos);
      yPos += questionHeight;

      // --- Notatka ---
      if (noteHeight) {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, pageWidth - 2 * margin - 20);
        doc.setTextColor(100, 100, 100);
        doc.text(noteLines, margin + 12, yPos);
        yPos += noteHeight;
        doc.setTextColor(0, 0, 0);
      }

      // --- Zdjęcia ---
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

      // 🔥 callback postępu
      processedQuestions++;
      if (onProgress) onProgress(Math.floor((processedQuestions / totalQuestions) * 100));
    }

    yPos += 8; // odstęp między kategoriami
  }

  return yPos;
};