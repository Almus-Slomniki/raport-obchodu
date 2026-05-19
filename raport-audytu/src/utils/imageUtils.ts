// utils/imageUtils.ts
export const compressImage = (file: File, maxWidth = 1024, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width); // skalowanie proporcjonalne
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Nie udało się utworzyć kontekstu canvas'));

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(compressedFile);
          } else {
            reject(new Error('Nie udało się skompresować obrazu'));
          }
        },
        'image/jpeg',
        quality // ustawienie jakości od 0 do 1
      );
    };

    img.onerror = (err) => reject(err);
    img.src = url;
  });
};