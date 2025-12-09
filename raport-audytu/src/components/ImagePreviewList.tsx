import React from 'react';

type Props = {
  images: string[];
  onRemove: (index: number) => void;
  disabled?: boolean; // nowy prop
};

export const ImagePreviewList: React.FC<Props> = ({ images, onRemove, disabled = false }) => {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 5 }}>
      {images.map((img, index) => (
        <div key={index} style={{ position: 'relative' }}>
          <img
            src={img}
            alt={`preview-${index}`}
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
          />
          {!disabled && (
            <button
              onClick={() => onRemove(index)}
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
