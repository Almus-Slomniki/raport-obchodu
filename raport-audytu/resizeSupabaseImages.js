const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

// --- KONFIGURACJA ---
const SUPABASE_URL = "https://irrrasxtbyorhdfulaww.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlycnJhc3h0YnlvcmhkZnVsYXd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU5NTc2NiwiZXhwIjoyMDc4MTcxNzY2fQ.1N09eBNP7VfY-DSVfDBHyxCoM-kbcPlSA7-uzghNeWE";
const BUCKET = "audit-images";
const ROOT_FOLDER = "niekrytyczne";  
const MAX_WIDTH = 1024;
const JPEG_QUALITY = 70;
const PNG_COMPRESSION = 9;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNKCJA ---
async function resizeFile(filePath) {
  try {
    // 🔹 próbujemy pobrać plik
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);

    // 🔥 jeśli to folder → download nie działa → lecimy rekurencyjnie
    if (error) {
      if (
        error.message.includes("Object not found") ||
        error.message.includes("The resource does not exist")
      ) {
        await processFolder(filePath);
        return;
      }
      throw error;
    }

    // 🔹 to jest plik
    if (!filePath.match(/\.(jpe?g|png)$/i)) {
      console.log(`⏭ Pomijanie: ${filePath}`);
      return;
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    const image = sharp(buffer);
    const metadata = await image.metadata();

    // 🔥 tylko duże obrazy
    if (metadata.width <= MAX_WIDTH) {
      console.log(`⏭ Już mały: ${filePath}`);
      return;
    }

    let resizedBuffer;

    if (filePath.match(/\.(jpe?g)$/i)) {
      resizedBuffer = await image
        .rotate()
        .resize({ width: MAX_WIDTH })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
    } else {
      resizedBuffer = await image
        .rotate()
        .resize({ width: MAX_WIDTH })
        .png({ compressionLevel: PNG_COMPRESSION })
        .toBuffer();
    }

    await supabase.storage.from(BUCKET).upload(filePath, resizedBuffer, {
      upsert: true,
    });

    console.log(`✅ Zmniejszono: ${filePath}`);

  } catch (err) {
    console.error(`❌ Błąd: ${filePath}`, err.message);
  }
}

// --- REKURENCJA ---
async function processFolder(prefix) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 });

  if (error) {
    console.error(`❌ Błąd listy: ${prefix}`, error.message);
    return;
  }

  for (const item of data) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    await resizeFile(path);
  }
}

// --- START ---
(async () => {
  console.log(`📂 Start: ${ROOT_FOLDER}`);
  await processFolder(ROOT_FOLDER);
  console.log("🎉 DONE");
})();