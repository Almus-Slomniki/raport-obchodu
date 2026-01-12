import React from "react";

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
}) => (
  <div style={{ display: 'flex', marginBottom: 10 }}>
    {categories.map(cat => {
      const active = activeCategory === cat;
      const complete = isCategoryComplete(cat);

      return (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          style={{
            flex: 1,
            padding: 8,
            backgroundColor: complete
              ? '#C8FFC8'              // zielone gdy wszystkie odpowiedzi są
              : active
              ? '#3da2eb'             // kolor aktywnej kategorii
              : 'white',
            border: '1px solid #ccc',
            fontWeight: active ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          {cat}
        </button>
      );
    })}
  </div>
);
