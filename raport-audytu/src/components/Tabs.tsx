import React from 'react';

type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[]; // lista zakładek
};

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div style={{ display: 'flex', width: '100%', marginBottom: 20 }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            flex: 1, // zajmuje równą szerokość
            padding: '12px 0',
            fontSize: 16,
            fontWeight: activeTab === tab ? 'bold' : 'normal',
            backgroundColor: activeTab === tab ? '#e3f2fd' : '#f5f5f5',
            border: '1px solid #ccc',
            borderBottom: activeTab === tab ? '2px solid #1464f4' : '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
