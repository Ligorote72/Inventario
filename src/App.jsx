import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import InventoryManager from './components/InventoryManager';
import DashboardSummary from './components/DashboardSummary';
import MovementHistory from './components/MovementHistory';
import { useInventoryData } from './hooks/useInventoryData';

function App({ session }) {
  const { inventory, movements, addProduct, updateProduct, deleteProduct, updateQuantity, clearMovements } = useInventoryData(session);
  const [activeTab, setActiveTab] = useState('dashboard');

  const pageTitles = {
    dashboard: { title: 'Dashboard General', subtitle: 'Resumen y métricas clave de tus productos.' },
    inventory: { title: 'Gestión de Inventario', subtitle: 'Administra tus productos, controla el stock y define alertas.' },
    history: { title: 'Historial de Movimientos', subtitle: 'Registro completo de entradas y salidas de inventario.' },
  };

  const page = pageTitles[activeTab] || pageTitles.dashboard;

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} session={session} />
      
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
        </div>
      </main>
    </div>
  );
}

export default App;
