// CategorySelector.tsx
import React from "react";

interface CategorySelectorProps {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
}) => (
  <div style={{ display: 'flex', marginBottom: 10 }}>
    {categories.map(cat => (
      <button
        key={cat}
        onClick={() => setActiveCategory(cat)}
        style={{
          flex: 1,
          padding: 8,
          backgroundColor: activeCategory === cat ? '#e3f2fd' : 'white',
          border: '1px solid #ccc',
          fontWeight: activeCategory === cat ? 'bold' : 'normal',
          cursor: 'pointer'
        }}
      >
        {cat}
      </button>
    ))}
  </div>
);
