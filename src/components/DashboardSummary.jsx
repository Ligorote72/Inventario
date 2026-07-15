import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { exportToCSV, formatInventoryForExport } from '../utils/exportUtils';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.75rem 1rem' }}>
      <p style={{ color: '#94a3b8', marginBottom: 4, fontSize: '0.8rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {typeof p.value === 'number' && p.name.includes('$')
            ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
};

const DashboardSummary = ({ inventory, movements = [] }) => {
  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalUnits = inventory.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const totalCost = inventory.reduce((acc, item) => acc + ((item.quantity || 0) * (item.costPrice || item.price || 0)), 0);
    const totalRevenue = inventory.reduce((acc, item) => acc + ((item.quantity || 0) * (item.salePrice || item.price || 0)), 0);
    const totalProfit = totalRevenue - totalCost;
    const lowStockItems = inventory.filter(item => (item.quantity || 0) <= (item.minStock || 0)).length;
    return { totalItems, totalUnits, totalCost, totalProfit, lowStockItems };
  }, [inventory]);

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const map = {};
    inventory.forEach(item => {
      const cat = item.category || 'Sin categoría';
      if (!map[cat]) map[cat] = { categoria: cat, unidades: 0, valor: 0 };
      map[cat].unidades += item.quantity || 0;
      map[cat].valor += (item.quantity || 0) * (item.costPrice || item.price || 0);
    });
    return Object.values(map).sort((a, b) => b.unidades - a.unidades);
  }, [inventory]);

  const pieData = useMemo(() =>
    categoryData.map(d => ({ name: d.categoria, value: d.valor }))
  , [categoryData]);

  // Last 10 movements for the line chart
  const movementTrend = useMemo(() => {
    return [...movements].reverse().slice(-15).map((m, i) => ({
      index: i + 1,
      entrada: m.type === 'buy' ? m.quantity * m.unitPrice : 0,
      salida: m.type === 'sell' ? m.quantity * m.unitPrice : 0,
    }));
  }, [movements]);

  const handleExport = () => {
    exportToCSV(formatInventoryForExport(inventory), `inventario_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div>
      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="dashboard-stats">
        <div className="stat-card" style={{ '--primary': 'var(--primary)' }}>
          <span className="stat-label">Valor Invertido (Costo)</span>
          <span className="stat-value">{formatCurrency(stats.totalCost)}</span>
        </div>
        <div className="stat-card" style={{ '--primary': 'var(--success)' }}>
          <span className="stat-label">Ganancia Potencial</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(stats.totalProfit)}</span>
        </div>
        <div className="stat-card" style={{ '--primary': 'var(--accent)' }}>
          <span className="stat-label">Unidades Totales</span>
          <span className="stat-value">{stats.totalUnits}</span>
        </div>
        <div className="stat-card" style={{ '--primary': 'var(--danger)' }}>
          <span className="stat-label">Stock Bajo / Agotado</span>
          <span className="stat-value" style={{ color: stats.lowStockItems > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
            {stats.lowStockItems}
          </span>
        </div>
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────────── */}
      {inventory.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Bar Chart: Stock by Category */}
          <div className="glass-card" style={{ marginBottom: 0 }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              📦 Unidades por Categoría
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="categoria" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="unidades" name="Unidades" radius={[6, 6, 0, 0]}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart: Value distribution */}
          <div className="glass-card" style={{ marginBottom: 0 }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              💰 Valor Invertido por Categoría
            </h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Valor']}
                    contentStyle={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--text-dim)', textAlign: 'center', paddingTop: '4rem' }}>Sin datos</p>
            )}
          </div>
        </div>
      )}

      {/* ── Movement Trend Line ─────────────────────────────────────────────── */}
      {movementTrend.length > 0 && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            📈 Tendencia de Movimientos Recientes
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={movementTrend} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="index" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Movimiento', position: 'insideBottom', fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipBar />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Line type="monotone" dataKey="entrada" name="$ Entrada" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="salida" name="$ Salida" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Export Button ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button onClick={handleExport} className="btn" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent)', fontSize: '0.85rem', padding: '0.6rem 1.4rem', border: '1px solid rgba(59,130,246,0.2)' }}>
          ⬇️ Exportar Inventario a Excel (CSV)
        </button>
      </div>

      {/* ── Low Stock Alert Table ────────────────────────────────────────────── */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>⚠️ Productos con Alerta de Stock</h2>
        {stats.lowStockItems === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>✅ Todo está en orden. No hay productos con nivel bajo.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SKU / Producto</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Min. Requerido</th>
                </tr>
              </thead>
              <tbody>
                {inventory.filter(item => (item.quantity || 0) <= (item.minStock || 0)).map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="item-name">
                        <span className="badge badge-warning">{item.sku || 'N/A'}</span>
                        {item.name}
                      </div>
                    </td>
                    <td><span className="badge badge-category">{item.category || 'Sin categoría'}</span></td>
                    <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{item.quantity}</td>
                    <td>{item.minStock || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSummary;
