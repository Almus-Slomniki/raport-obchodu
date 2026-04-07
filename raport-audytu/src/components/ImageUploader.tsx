import React, { ChangeEvent } from 'react';

/**
 * Compress image using Canvas
 * @param file - original image file
 * @param maxWidth - maksymalna szerokość w px (domyślnie 1024)
 * @param quality - jakość JPEG od 0 do 1 (domyślnie 0.7)
 * @returns Promise<File> - skompresowany plik
 */
const compressImage = (file: File, maxWidth = 1024, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Nie udało się utworzyć kontekstu canvas'));

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Nie udało się skompresować obrazu'));
          const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

type Props = {
  onUpload: (files: File[]) => void;
};

export const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);

      try {
        const compressedFiles = await Promise.all(filesArray.map(file => compressImage(file)));
        onUpload(compressedFiles);
      } catch (err) {
        console.error('Błąd kompresji obrazów:', err);
        onUpload(filesArray); // jeśli błąd – wyślij oryginały
      }

      e.target.value = ''; // reset input
    }
  };

  return (
    <label
      style={{
        display: 'inline-block',
        cursor: 'pointer',
        padding: '6px 10px',
        borderRadius: 5,
        border: '1px solid #ccc',
        backgroundColor: '#f0f0f0',
        fontSize: 16,
        textAlign: 'center',
      }}
    >
      📷
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </label>
  );
};