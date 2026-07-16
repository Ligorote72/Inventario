import React, { useState, useMemo } from 'react';
import { exportToCSV, formatMovementsForExport } from '../utils/exportUtils';
import { generateReceiptPDF } from '../utils/pdfGenerator';

const MovementHistory = ({ movements, userRole, settings, clearMovements }) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'buy' | 'sell'

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return movements;
    return movements.filter(m => m.type === filter);
  }, [movements, filter]);

  const stats = useMemo(() => {
    const totalBuys = movements.filter(m => m.type === 'buy').reduce((acc, m) => acc + m.quantity * m.unitPrice, 0);
    const totalSells = movements.filter(m => m.type === 'sell').reduce((acc, m) => acc + m.quantity * m.unitPrice, 0);
    const buyCount = movements.filter(m => m.type === 'buy').length;
    const sellCount = movements.filter(m => m.type === 'sell').length;
    return { totalBuys, totalSells, buyCount, sellCount };
  }, [movements]);

  const handleExport = () => {
    exportToCSV(formatMovementsForExport(movements), `historial_movimientos_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="animate-fade">
      {/* Summary Cards */}
      <div className="dashboard-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ '--primary': 'var(--success)' }}>
          <span className="stat-label">Total Compras</span>
          <span className="stat-value" style={{ color: 'var(--success)', fontSize: '1.5rem' }}>{formatCurrency(stats.totalBuys)}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{stats.buyCount} movimientos</span>
        </div>
        <div className="stat-card" style={{ '--primary': 'var(--danger)' }}>
          <span className="stat-label">Total Ventas (PVP)</span>
          <span className="stat-value" style={{ color: 'var(--danger)', fontSize: '1.5rem' }}>{formatCurrency(stats.totalSells)}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{stats.sellCount} movimientos</span>
        </div>
        <div className="stat-card" style={{ '--primary': 'var(--primary)' }}>
          <span className="stat-label">Balance Neto</span>
          <span className="stat-value" style={{ color: stats.totalSells - stats.totalBuys >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '1.5rem' }}>
            {formatCurrency(stats.totalSells - stats.totalBuys)}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{movements.length} total</span>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'buy', 'sell'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn"
              style={{
                padding: '0.5rem 1.2rem',
                fontSize: '0.85rem',
                background: filter === f
                  ? f === 'buy' ? 'rgba(16,185,129,0.2)' : f === 'sell' ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)'
                  : 'rgba(255,255,255,0.05)',
                color: filter === f
                  ? f === 'buy' ? 'var(--success)' : f === 'sell' ? 'var(--danger)' : 'var(--primary)'
                  : 'var(--text-dim)',
                border: '1px solid',
                borderColor: filter === f
                  ? f === 'buy' ? 'rgba(16,185,129,0.3)' : f === 'sell' ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.3)'
                  : 'transparent',
              }}
            >
              {f === 'all' ? 'Todos' : f === 'buy' ? '🟢 Compras' : '🔴 Ventas'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExport} className="btn" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent)', fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
            ⬇️ Exportar CSV
          </button>
          {userRole === 'admin' && (
            <button onClick={clearMovements} className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
              🗑️ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card">
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>Sin movimientos</h3>
              <p>Registra una compra o venta para ver el historial aquí.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Total</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{formatDate(m.date)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: m.type === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: m.type === 'buy' ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${m.type === 'buy' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}
                      >
                        {m.type === 'buy' ? '⬆️ Entrada' : '⬇️ Salida'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.productName}</div>
                      {m.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{m.sku}</div>}
                      {m.customerName && <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '2px' }}>👤 {m.customerName}</div>}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: m.type === 'buy' ? 'var(--success)' : 'var(--danger)' }}>
                        {m.type === 'buy' ? '+' : '-'}{m.quantity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-dim)' }}>{formatCurrency(m.unitPrice)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(m.quantity * m.unitPrice)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {m.type === 'sell' && (
                        <button 
                          onClick={() => generateReceiptPDF(m, settings)} 
                          className="btn-icon" 
                          title="Descargar Recibo"
                          style={{ padding: '0.4rem' }}
                        >
                          📄
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovementHistory;
