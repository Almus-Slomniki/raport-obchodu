import React from 'react';
import { categories } from '../data/questions';

type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div
      style={{
        display: 'flex',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 50,
        borderBottom: '1px solid #ccc',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      {categories.map((cat, index) => (
        <React.Fragment key={cat}>
          <button
            onClick={() => setActiveTab(cat)}
            style={{
              flex: 1,
              padding: '10px 0',
              textAlign: 'center',
              backgroundColor: activeTab === cat ? '#e3f2fd' : 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === cat ? 'bold' : 'normal',
            }}
          >
            {cat}
          </button>
          {index < categories.length - 1 && (
            <div
              style={{
                width: 1,
                backgroundColor: '#ccc',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
