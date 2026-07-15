import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'history', label: 'Historial', icon: '📋' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: '1.8rem' }}>⚡</span> InvPro
      </div>
      <nav className="nav-links">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ display: 'inline-block' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', padding: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center' }}>
        v2.0 Professional
      </div>
    </aside>
  );
};

export default Sidebar;
