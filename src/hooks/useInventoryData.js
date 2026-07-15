import { useState, useEffect } from 'react';

export function useInventoryData() {
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('basic-inventory-data');
    return saved ? JSON.parse(saved) : [];
  });

  const [movements, setMovements] = useState(() => {
    const saved = localStorage.getItem('basic-inventory-movements');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('basic-inventory-data', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('basic-inventory-movements', JSON.stringify(movements));
  }, [movements]);

  const addProduct = (product) => {
    setInventory(prev => [product, ...prev]);
  };

  const updateProduct = (id, updates) => {
    setInventory(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteProduct = (id) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  /**
   * @param {string} id - Product ID
   * @param {number} delta - Positive = buy/entry, Negative = sell/exit
   * @param {object} meta - { productName, sku, unitPrice } 
   */
  const updateQuantity = (id, delta, meta = {}) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, lastUpdated: new Date().toISOString() };
      }
      return item;
    }));

    // Register movement in history
    const movement = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      productId: id,
      productName: meta.productName || 'Desconocido',
      sku: meta.sku || null,
      type: delta > 0 ? 'buy' : 'sell',
      quantity: Math.abs(delta),
      unitPrice: meta.unitPrice || 0,
    };
    setMovements(prev => [movement, ...prev]);
  };

  const clearMovements = () => {
    if (window.confirm('¿Eliminar todo el historial de movimientos? Esta acción no se puede deshacer.')) {
      setMovements([]);
    }
  };

  return {
    inventory,
    movements,
    addProduct,
    updateProduct,
    deleteProduct,
    updateQuantity,
    clearMovements,
  };
}
