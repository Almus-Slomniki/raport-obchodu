import jsPDF from "jspdf";
import font from "../fonts/Roboto-Regular-normal";
import { supabase } from "../supabaseClient";
import { getPrivateImageUrl } from "../supabaseAudit";

export const generateNonCriticalPDF = async (auditId: number) => {
  try {
    const { data: entries, error } = await supabase
      .from("non_critical_entries")
      .select("*")
      .eq("audit_id", auditId)
      .order("line", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;
    if (!entries?.length) return alert("Brak danych");

    const doc = new jsPDF("p", "mm", "a4");

    doc.addFileToVFS("Roboto-Regular.ttf", font);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const M = 15;
    let y = M;

    const LINE_H = 6;

    // =========================
    // HELPERS
    // =========================
    const loadImage = (blob: Blob) =>
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.src = url;
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
      });

    const compressImage = (img: HTMLImageElement) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const MAX = 1400;

      let w = img.width;
      let h = img.height;

      const ratio = Math.min(MAX / w, MAX / h, 1);
      w *= ratio;
      h *= ratio;

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0, w, h);

      return canvas.toDataURL("image/jpeg", 0.75);
    };

    const checkPage = (needed: number) => {
      if (y + needed > H - 15) {
        doc.addPage();
        y = 15;
      }
    };

    // =========================
    // HEADER BAR
    // =========================
    doc.setFillColor(20, 40, 90);
    doc.rect(0, 0, W, 28, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("RAPORT NIEKRYTYCZNYCH UWAG", M, 12);

    doc.setFontSize(11);
    doc.text(`Audit ID: ${auditId}`, M, 20);

    y = 40;

    // =========================
    // GROUP DATA
    // =========================

    console.log("NON CRITICAL ENTRIES:", entries);
    const grouped: Record<string, typeof entries> = {};

    for (const e of entries) {
      const key = e.line || "Brak linii";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }

    // =========================
    // SECTION HEADER
    // =========================
    const drawSectionHeader = (title: string) => {
      const h = 16;

      checkPage(h + 5);

      doc.setFillColor(245, 247, 252);
      doc.setDrawColor(200);
      doc.roundedRect(M, y, W - M * 2, h, 3, 3, "FD");

      doc.setFontSize(15);
      doc.setTextColor(25, 70, 170);

      doc.text(title, W / 2, y + 10, { align: "center" });

      y += h + 6;
    };

    // =========================
    // ENTRY (TEXT - BETTER TYPOGRAPHY)
    // =========================
    const renderEntry = async (entry: any) => {
      const text = `• ${entry.name}${entry.note ? " — " + entry.note : ""}`;
      const lines = doc.splitTextToSize(text, W - M * 2 - 10);

const images = Array.isArray(entry.images)
  ? entry.images.slice(0, 4)
  : [];
  
      const maxW = 105;   // 🔥 BIGGER IMAGES
      const maxH = 80;

      const LINE_H = 6;

      // =========================
      // PRE-CALC HEIGHT (CRITICAL)
      // =========================
      const imgRows = images.length ? Math.ceil(images.length / 2) : 0;
      const imgHeight = imgRows * (maxH + 12);

      const textHeight = lines.length * LINE_H + 10;

      const totalHeight = textHeight + imgHeight + 15;

      checkPage(totalHeight);

      // =========================
      // TEXT (IMPROVED STYLE)
      // =========================
      doc.setFontSize(12);              // 🔥 slightly bigger
      doc.setTextColor(30, 30, 30);

      for (const l of lines) {
        doc.text(l, M + 5, y);
        y += LINE_H;
      }

      y += 6;

      // =========================
      // IMAGES (BIGGER + CLEAN GRID)
      // =========================
      let x = M + 5;
      let col = 0;

    const drawImage = async (path: string) => {
  try {
    const imageUrl = path.startsWith("http")
      ? path
      : await getPrivateImageUrl(path);

    if (!imageUrl) {
      console.error("Brak URL dla:", path);
      return null;
    }

    const res = await fetch(imageUrl);

    if (!res.ok) {
      console.error("Błąd pobrania:", imageUrl);
      return null;
    }

    const blob = await res.blob();

    const img = await loadImage(blob);

    const imgData = compressImage(img);

    let w = img.width;
    let h = img.height;

    const ratio = Math.min(maxW / w, maxH / h);

    w *= ratio;
    h *= ratio;

    return { imgData, w, h };
  } catch (err) {
    console.error("drawImage:", err);
    return null;
  }
};

  for (const img of images) {
  const result = await drawImage(img);

  if (!result) continue;

  const { imgData, w, h } = result;

  doc.addImage(imgData, "JPEG", x, y, w, h);

  x += maxW + 12;
  col++;

  if (col === 2) {
    col = 0;
    x = M + 5;
    y += maxH + 12;
  }
}

      if (col !== 0) {
        y += maxH + 12;
      }

      y += 8;

      // separator
      doc.setDrawColor(235);
      doc.line(M, y, W - M, y);
      y += 6;
    };

    // =========================
    // MAIN LOOP
    // =========================
    for (const line of Object.keys(grouped)) {
      drawSectionHeader(`LINIA: ${line}`);

      for (const entry of grouped[line]) {
        await renderEntry(entry);
      }

      y += 6;
    }

    // =========================
    // SAVE
    // =========================
    const d = new Date();
    const date = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;

    doc.save(`Raport-Niekrytyczny-${auditId}-${date}.pdf`);
  } catch (e) {
    console.error(e);
    alert("Błąd PDF");
  }
};