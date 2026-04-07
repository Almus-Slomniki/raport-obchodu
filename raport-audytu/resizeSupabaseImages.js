const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

// --- KONFIGURACJA ---
const SUPABASE_URL = "https://irrrasxtbyorhdfulaww.supabase.co"; 
const SUPABASE_KEY = "TWÓJ_SERVICE_ROLE_KEY"; // Wklej swój Service Role Key
const BUCKET = "audit-images";
const ROOT_FOLDER = "audits";  
const MAX_WIDTH = 1024;
const JPEG_QUALITY = 70;
const PNG_COMPRESSION = 9;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Funkcja zmniejszająca pojedynczy plik tylko jeśli jest za duży ---
async function resizeFile(filePath) {
  try {
    const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(filePath);
    if (downloadError) throw downloadError;

    const buffer = Buffer.from(await data.arrayBuffer());
    let resizedBuffer;

    // sprawdzamy czy to JPEG lub PNG
    if (filePath.match(/\.(jpe?g)$/i) || filePath.match(/\.png$/i)) {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (metadata.width > MAX_WIDTH) {
        if (filePath.match(/\.(jpe?g)$/i)) {
          resizedBuffer = await image
            .rotate() // EXIF Orientation
            .resize({ width: MAX_WIDTH })
            .jpeg({ quality: JPEG_QUALITY })
            .toBuffer();
        } else if (filePath.match(/\.png$/i)) {
          resizedBuffer = await image
            .rotate()
            .resize({ width: MAX_WIDTH })
            .png({ compressionLevel: PNG_COMPRESSION })
            .toBuffer();
        }

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, resizedBuffer, { upsert: true });
        if (uploadError) throw uploadError;

        console.log(`✅ Zmniejszono: ${filePath}`);
      } else {
        console.log(`⏭ Plik już ma odpowiednią szerokość: ${filePath}`);
      }
    } else {
      console.log(`⏭ Pomijanie pliku (nie JPEG/PNG): ${filePath}`);
    }
  } catch (err) {
    if (err.message.includes("Object not found") || err.message.includes("The resource does not exist")) {
      await processFolder(filePath); // traktujemy jako folder
    } else {
      console.error(`❌ Błąd przy ${filePath}:`, err.message);
    }
  }
}

// --- Funkcja rekurencyjna do przetwarzania folderu ---
async function processFolder(prefix) {
  const limit = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit, offset });
    if (error) {
      console.error(`❌ Błąd listowania folderu ${prefix}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      await resizeFile(path);
    }

    offset += limit;
  }
}

// --- Uruchomienie ---
(async () => {
  console.log(`📂 Przetwarzanie wszystkich plików w folderze: ${ROOT_FOLDER}`);
  await processFolder(ROOT_FOLDER);
  console.log("\n🎉 Wszystkie pliki przetworzone!");
})();