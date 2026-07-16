import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

export function useInventoryData(session) {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [settings, setSettings] = useState({ company_name: 'InvPro', background_url: '' });
  const [userRole, setUserRole] = useState('admin');
  const [ownerId, setOwnerId] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    } else {
      setInventory([]);
      setMovements([]);
      setSettings({ company_name: 'InvPro', background_url: '' });
    }
  }, [session]);

  const fetchData = async () => {
    if (!session?.user) return;

    // Determine Role & Owner ID
    let currentOwnerId = session.user.id;
    let currentRole = 'admin';

    const { data: employeeData } = await supabase
      .from('employees')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (employeeData) {
      currentOwnerId = employeeData.owner_id;
      currentRole = employeeData.role;
    }
    setOwnerId(currentOwnerId);
    setUserRole(currentRole);

    // Fetch products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', currentOwnerId)
      .order('date_added', { ascending: false });
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
    } else {
      // Map database snake_case to frontend camelCase
      const formattedProducts = productsData.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        quantity: Number(p.quantity),
        costPrice: Number(p.cost_price),
        salePrice: Number(p.sale_price),
        minStock: Number(p.min_stock),
        dateAdded: p.date_added,
        lastUpdated: p.last_updated
      }));
      setInventory(formattedProducts);
    }

    // Fetch movements
    const { data: movementsData, error: movementsError } = await supabase
      .from('movements')
      .select('*')
      .eq('user_id', currentOwnerId)
      .order('date', { ascending: false });
    
    if (movementsError) {
      console.error('Error fetching movements:', movementsError);
    } else {
      const formattedMovements = movementsData.map(m => ({
        id: m.id,
        productId: m.product_id,
        productName: m.product_name,
        sku: m.sku,
        type: m.type,
        quantity: Number(m.quantity),
        unitPrice: Number(m.unit_price),
        customerName: m.customer_name,
        date: m.date
      }));
      setMovements(formattedMovements);
    }

    // Fetch settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', currentOwnerId)
      .single();
      
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
    } else if (settingsData) {
      setSettings({
        company_name: settingsData.company_name || 'InvPro',
        background_url: settingsData.background_url || ''
      });
    }
  };

  const addProduct = async (product) => {
    // Optimistic UI update
    setInventory(prev => [product, ...prev]);

    // DB insert
    const { error } = await supabase.from('products').insert([{
      id: product.id,
      user_id: ownerId || session.user.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      cost_price: product.costPrice,
      sale_price: product.salePrice,
      min_stock: product.minStock,
      date_added: product.dateAdded || new Date().toISOString()
    }]);

    if (error) {
      console.error('Error adding product:', error);
      toast.error('Error al añadir producto');
      fetchData(); // Rollback on error
    } else {
      toast.success('Producto añadido correctamente');
    }
  };

  const updateProduct = async (id, updates) => {
    // Optimistic UI update
    setInventory(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));

    // DB update
    const dbUpdates = { last_updated: new Date().toISOString() };
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;

    const { error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', ownerId || session.user.id);
      
    if (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar producto');
      fetchData(); // Rollback on error
    } else {
      toast.success('Producto actualizado');
    }
  };

  const deleteProduct = async (id) => {
    // Optimistic UI update
    setInventory(prev => prev.filter(item => item.id !== id));

    // DB delete
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', ownerId || session.user.id);
      
    if (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar producto');
      fetchData(); // Rollback on error
    } else {
      toast.success('Producto eliminado');
    }
  };

  const updateQuantity = async (id, delta, meta = {}) => {
    // Find current product in state to get its current quantity
    const product = inventory.find(item => item.id === id);
    if (!product) return;
    
    const newQty = Math.max(0, product.quantity + delta);

    // Optimistic UI update
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQty, lastUpdated: new Date().toISOString() } : item
    ));

    const movement = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      productId: id,
      productName: meta.productName || 'Desconocido',
      sku: meta.sku || null,
      type: delta > 0 ? 'buy' : 'sell',
      quantity: Math.abs(delta),
      unitPrice: meta.unitPrice || 0,
      customerName: meta.customerName || null
    };
    setMovements(prev => [movement, ...prev]);

    // DB updates
    const { error: pError } = await supabase
      .from('products')
      .update({ quantity: newQty, last_updated: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', ownerId || session.user.id);
      
    if (pError) {
      console.error('Error updating product quantity:', pError);
      toast.error('Error al actualizar inventario');
    }

    const { error: mError } = await supabase.from('movements').insert([{
      id: movement.id,
      user_id: ownerId || session.user.id,
      product_id: movement.productId,
      product_name: movement.productName,
      sku: movement.sku,
      type: movement.type,
      quantity: movement.quantity,
      unit_price: movement.unitPrice,
      customer_name: movement.customerName,
      date: movement.date
    }]);

    if (mError) {
      console.error('Error adding movement:', mError);
      fetchData(); // Rollback on error
    }
  };

  const clearMovements = async () => {
    // Usamos toast customizado si quisieramos, pero window.confirm es bloqueante y más seguro para esto
    if (window.confirm('¿Eliminar todo el historial de movimientos de la base de datos? Esta acción no se puede deshacer.')) {
      setMovements([]);
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('user_id', ownerId || session.user.id); // Delete all movements for this owner

      if (error) {
        console.error('Error clearing movements:', error);
        toast.error('Error al vaciar historial');
        fetchData(); // Rollback on error
      } else {
        toast.success('Historial vaciado correctamente');
      }
    }
  };

  const updateSettings = async (newSettings) => {
    // Optimistic UI update
    setSettings(prev => ({ ...prev, ...newSettings }));

    // DB upsert
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        company_name: newSettings.company_name,
        background_url: newSettings.background_url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating settings:', error);
      fetchData(); // Rollback on error
    }
  };

  return {
    inventory,
    movements,
    settings,
    userRole,
    ownerId,
    addProduct,
    updateProduct,
    deleteProduct,
    updateQuantity,
    clearMovements,
    updateSettings
  };
}
