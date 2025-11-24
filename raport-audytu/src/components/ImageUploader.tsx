import React, { ChangeEvent } from 'react';

type Props = {
  onUpload: (files: FileList) => void;
};

export const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = ''; // reset input, żeby można było wybrać te same pliki ponownie
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
