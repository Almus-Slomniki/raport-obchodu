import React, { useState } from "react";

interface CategorySelectorProps {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  isCategoryComplete: (cat: string) => boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
  isCategoryComplete,
}) => {
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);

  const toggleDisable = (cat: string) => {
    setDisabledCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
      {categories.map(cat => {
        const active = activeCategory === cat;
        const complete = isCategoryComplete(cat);
        const disabled = disabledCategories.includes(cat);

        return (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <button
              onClick={() => !disabled && setActiveCategory(cat)}
              style={{
                flex: 1,
                padding: 8,
                backgroundColor: disabled
                  ? '#f8f8f8'      // delikatne wyszarzenie
                  : complete
                  ? '#C8FFC8'
                  : active
                  ? '#3da2eb'
                  : 'white',
                border: '1px solid #ccc',
                fontWeight: active ? 'bold' : 'normal',
                cursor: disabled ? 'not-allowed' : 'pointer',
                color: disabled ? '#999' : 'black',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span>{cat}</span>
              
            </button>
            <span
                onClick={(e) => { e.stopPropagation(); toggleDisable(cat); }}
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: '#666',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 'normal'
                }}
              >
                {disabled ? 'Włącz linię do obchodu' : 'Wyłącz linię z obchodu'}
              </span>
          </div>
        );
      })}
    </div>
  );
};
