import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import InventoryManager from './components/InventoryManager';
import DashboardSummary from './components/DashboardSummary';
import MovementHistory from './components/MovementHistory';
import SettingsTab from './components/SettingsTab';
import { useInventoryData } from './hooks/useInventoryData';

function App({ session }) {
  const { inventory, movements, settings, updateSettings, addProduct, updateProduct, deleteProduct, updateQuantity, clearMovements } = useInventoryData(session);
  const [activeTab, setActiveTab] = useState('dashboard');

  const pageTitles = {
    dashboard: { title: 'Dashboard General', subtitle: 'Resumen y métricas clave de tus productos.' },
    inventory: { title: 'Gestión de Inventario', subtitle: 'Administra tus productos, controla el stock y define alertas.' },
    history: { title: 'Historial de Movimientos', subtitle: 'Registro completo de entradas y salidas de inventario.' },
    settings: { title: 'Configuración', subtitle: 'Personaliza tu inventario y fondo de pantalla.' },
  };

  const page = pageTitles[activeTab] || pageTitles.dashboard;

  const bgStyle = settings?.background_url ? {
    backgroundImage: `url(${settings.background_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  } : {};

  return (
    <div className="app-layout" style={bgStyle}>
      {settings?.background_url && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 0, pointerEvents: 'none' }}></div>
      )}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} session={session} settings={settings} />
      
      <main className="main-content">
        <header className="page-header">
          <h1>{page.title}</h1>
          <p>{page.subtitle}</p>
        </header>
        
        <div className="animate-fade" key={activeTab}>
          {activeTab === 'dashboard' && (
            <DashboardSummary inventory={inventory} movements={movements} />
          )}
          {activeTab === 'inventory' && (
            <InventoryManager 
              inventory={inventory} 
              addProduct={addProduct}
              updateProduct={updateProduct}
              deleteProduct={deleteProduct}
              updateQuantity={updateQuantity}
            />
          )}
          {activeTab === 'history' && (
            <MovementHistory movements={movements} clearMovements={clearMovements} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} updateSettings={updateSettings} session={session} />
          )}
        </div>
      </main>
      </div>
    </div>
  );
}

export default App;
