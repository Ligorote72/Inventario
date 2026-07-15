import React from 'react';
import { supabase } from '../supabaseClient';

const Sidebar = ({ activeTab, setActiveTab, session, settings }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'history', label: 'Historial', icon: '📋' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user?.user_metadata || {};

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: '1.8rem' }}>⚡</span> {settings?.company_name || 'InvPro'}
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
      
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {session && (
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user.full_name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.full_name || 'Usuario'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {session.user.email}
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="btn" 
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center' }}>
          v3.0 Cloud Sync
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
