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

    // --- Pierwsze pytanie ---
    const firstQuestion = catQuestions[0];

    // --- Obliczamy wysokość całego bloku (nagłówek + pytanie + notatka + zdjęcia) ---
    let firstBlockHeight = 0;

    const headerLines = doc.splitTextToSize(`Linia: ${cat}`, columnWidth);
    firstBlockHeight += headerLines.length * 6 + 2;

    const questionLines = doc.splitTextToSize(firstQuestion.text, columnWidth);
    firstBlockHeight += questionLines.length * 6 + 2;

    if (firstQuestion.note && firstQuestion.note.trim() !== "") {
      const noteLines = doc.splitTextToSize(`Uwaga: ${firstQuestion.note}`, columnWidth);
      firstBlockHeight += noteLines.length * 5 + 2;
    }

    const firstImages = imagesState[cat]?.[firstQuestion.id] || [];
    for (const imgSrc of firstImages) {
      try {
        const img = await loadImage(await imageToBase64(imgSrc));
        const imgW = img.width * 0.264583;
        const imgH = img.height * 0.264583;
        const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
        firstBlockHeight += imgH * scale + imageSpacing;
      } catch {}
    }

    // --- Dodaj nową stronę jeśli potrzeba ---
    if (yPos + firstBlockHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    // --- Nagłówek linii ---
    doc.setFontSize(14);
    doc.setTextColor(20, 60, 120);
    doc.text(headerLines, margin, yPos);
    yPos += headerLines.length * 6 + 2;

    // --- Pierwsze pytanie ---
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(questionLines, margin, yPos);
    yPos += questionLines.length * 6 + 2;

    // --- Komentarz pierwszego pytania ---
    if (firstQuestion.note && firstQuestion.note.trim() !== "") {
      const noteLines = doc.splitTextToSize(`Uwaga: ${firstQuestion.note}`, columnWidth);
      doc.setTextColor(100, 100, 100);
      doc.text(noteLines, margin, yPos);
      yPos += noteLines.length * 5 + 2;
      doc.setTextColor(0, 0, 0);
    }

    // --- Zdjęcia pierwszego pytania ---
    for (const imgSrc of firstImages) {
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
        doc.addImage(base64, "JPEG", margin, yPos, imgW, imgH);
        yPos += imgH + imageSpacing;
      } catch {}
    }

    yPos += 4;

    // --- Pozostałe pytania ---
    for (let i = 1; i < catQuestions.length; i++) {
      const q = catQuestions[i];
      const qLines = doc.splitTextToSize(`• ${q.text}`, columnWidth);
      let blockHeight = qLines.length * 6 + 2;

      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth);
        blockHeight += noteLines.length * 5 + 2;
      }

      const qImages = imagesState[cat]?.[q.id] || [];
      for (const imgSrc of qImages) {
        try {
          const img = await loadImage(await imageToBase64(imgSrc));
          let imgW = img.width * 0.264583;
          let imgH = img.height * 0.264583;
          const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
          blockHeight += imgH * scale + imageSpacing;
        } catch {}
      }
      blockHeight += 4;

      if (yPos + blockHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(qLines, margin, yPos);
      yPos += qLines.length * 6 + 2;

      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth);
        doc.setTextColor(100, 100, 100);
        doc.text(noteLines, margin, yPos);
        yPos += noteLines.length * 5 + 2;
        doc.setTextColor(0, 0, 0);
      }

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
          doc.addImage(base64, "JPEG", margin, yPos, imgW, imgH);
          yPos += imgH + imageSpacing;
        } catch {}
      }

      yPos += 4;
    }

    // --- Mała przerwa po kategorii tylko jeśli nie jest ostatnia ---
    if (cat !== categories[categories.length - 1]) yPos += 8;
  }

  return yPos;
};
