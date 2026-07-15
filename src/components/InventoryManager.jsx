import React, { useState, useMemo } from 'react';

const InventoryManager = ({ inventory, addProduct, updateProduct, deleteProduct, updateQuantity }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    sku: '', name: '', category: '', quantity: '', costPrice: '', salePrice: '', minStock: ''
  });

  // Movement Modal State
  const [movementModal, setMovementModal] = useState({ isOpen: false, item: null, type: 'buy', qty: '' });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(val);
  };

  // Product CRUD
  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        category: product.category || '',
        quantity: product.quantity || 0,
        costPrice: product.costPrice || product.price || 0,
        salePrice: product.salePrice || product.price || 0,
        minStock: product.minStock || 0
      });
    } else {
      setEditingId(null);
      setFormData({ sku: '', name: '', category: '', quantity: '', costPrice: '', salePrice: '', minStock: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const productData = {
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      salePrice: parseFloat(formData.salePrice) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      lastUpdated: new Date().toISOString()
    };

    if (editingId) {
      updateProduct(editingId, productData);
    } else {
      addProduct({ id: Date.now().toString(), ...productData, dateAdded: new Date().toISOString() });
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if(window.confirm('¿Eliminar definitivamente este artículo?')) {
      deleteProduct(id);
    }
  };

  // Movements (Buy/Sell)
  const openMovement = (item, type) => {
    setMovementModal({ isOpen: true, item, type, qty: '' });
  };

  const handleMovementSubmit = (e) => {
    e.preventDefault();
    const qty = parseFloat(movementModal.qty);
    if (!qty || qty <= 0) return;

    const { item, type } = movementModal;
    const delta = type === 'buy' ? qty : -qty;
    const unitPrice = type === 'buy'
      ? (item.costPrice || item.price || 0)
      : (item.salePrice || item.price || 0);

    updateQuantity(item.id, delta, {
      productName: item.name,
      sku: item.sku || null,
      unitPrice,
    });
    setMovementModal({ isOpen: false, item: null, type: 'buy', qty: '' });
  };

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const query = searchQuery.toLowerCase();
    return inventory.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.sku && item.sku.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query))
    );
  }, [inventory, searchQuery]);

  return (
    <div className="animate-fade">
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="🔍 Buscar por nombre, SKU o categoría..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '400px', margin: 0 }}
        />
        <button onClick={() => openModal()} className="btn btn-primary">
          + Nuevo Producto
        </button>
      </div>

      <div className="glass-card">
        <div className="table-container">
          {filteredInventory.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <h3>No se encontraron productos</h3>
              <p>Agrega mercancía a tu inventario para comenzar.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>SKU / Nombre</th>
                  <th>Stock</th>
                  <th>Costo / Venta</th>
                  <th>Ganancia c/u</th>
                  <th>Movimientos</th>
                  <th>Opciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => {
                  const isLowStock = (item.quantity || 0) <= (item.minStock || 0);
                  const cost = item.costPrice || item.price || 0;
                  const sale = item.salePrice || item.price || 0;
                  const profit = sale - cost;

                  return (
                    <tr key={item.id} style={{ background: isLowStock ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td>
                        <div className="item-name">
                          {item.sku && <span className="badge badge-normal">{item.sku}</span>}
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                          {item.category || 'Sin categoría'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: isLowStock ? 'var(--danger)' : 'inherit' }}>
                          {item.quantity}
                        </span>
                        {isLowStock && <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '4px' }}>Stock Bajo</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Costo: {formatCurrency(cost)}</div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>Venta: {formatCurrency(sale)}</div>
                      </td>
                      <td>
                        <span className="badge badge-normal" style={{ fontSize: '0.9rem' }}>
                          {formatCurrency(profit)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openMovement(item, 'sell')} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                            💰 Vender
                          </button>
                          <button onClick={() => openMovement(item, 'buy')} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                            🛒 Comprar
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openModal(item)} className="btn btn-icon btn-edit" title="Editar Detalles">✏️</button>
                          <button onClick={() => handleDelete(item.id)} className="btn btn-icon" title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Movement Modal (Vender / Comprar) */}
      {movementModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '700', color: movementModal.type === 'buy' ? 'var(--success)' : 'var(--danger)' }}>
              {movementModal.type === 'buy' ? '🛒 Registrar Compra' : '💰 Registrar Venta'}
            </h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
              Producto: <strong>{movementModal.item.name}</strong>
            </p>
            <form onSubmit={handleMovementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Cantidad a {movementModal.type === 'buy' ? 'ingresar' : 'descontar'} *</label>
                <input 
                  type="number" 
                  step="any" min="0.1" 
                  required 
                  placeholder="Ej: 5"
                  value={movementModal.qty} 
                  onChange={e => setMovementModal({...movementModal, qty: e.target.value})} 
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setMovementModal({ isOpen: false, item: null, type: 'buy', qty: '' })} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn" style={{ flex: 2, background: movementModal.type === 'buy' ? 'var(--success)' : 'var(--danger)', color: 'white' }}>
                  Confirmar {movementModal.type === 'buy' ? 'Compra' : 'Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>SKU (Código)</label>
                  <input type="text" placeholder="Ej: PROD-001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <input type="text" placeholder="Ej: Ropa" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input type="text" required placeholder="Ej: Camiseta de Algodón" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                <div className="form-group">
                  <label>Precio de Costo (Compra)</label>
                  <input type="number" step="any" min="0" required value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Precio de Venta al Público</label>
                  <input type="number" step="any" min="0" required value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Stock Actual (Cantidad Inicial)</label>
                  <input type="number" step="any" min="0" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Alerta de Stock Mínimo</label>
                  <input type="number" step="any" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={closeModal} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  {editingId ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
