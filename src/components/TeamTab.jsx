import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const TeamTab = ({ session, userRole }) => {
  const [employees, setEmployees] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('owner_id', session.user.id);
    
    if (error) {
      toast.error('Error al cargar equipo');
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchEmployees();
    }
  }, [userRole]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    if (newEmail === session.user.email) {
      toast.error('No puedes agregarte a ti mismo');
      return;
    }

    const { error } = await supabase.from('employees').insert([{
      owner_id: session.user.id,
      email: newEmail.trim().toLowerCase(),
      role: 'vendedor'
    }]);

    if (error) {
      toast.error('Error al agregar empleado');
      console.error(error);
    } else {
      toast.success('Vendedor agregado correctamente');
      setNewEmail('');
      fetchEmployees();
    }
  };

  const handleRemoveEmployee = async (id) => {
    if (!window.confirm('¿Eliminar acceso a este empleado?')) return;

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Acceso revocado');
      fetchEmployees();
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="empty-state">
        <div className="icon">🔒</div>
        <h3>Acceso Denegado</h3>
        <p>Solo los administradores pueden gestionar el equipo de trabajo.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>👥 Mi Equipo de Trabajo</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          Añade el correo de Google de tus vendedores. Cuando inicien sesión, podrán descontar stock de tu inventario sin ver los costos ni las ganancias.
        </p>
      </div>

      <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="email" 
          placeholder="correo.del.vendedor@gmail.com" 
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary">Añadir Vendedor</button>
      </form>

      {loading ? (
        <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>Cargando equipo...</p>
      ) : employees.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <div className="icon">👤</div>
          <p>No tienes ningún empleado registrado aún.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Fecha de Ingreso</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.email}</td>
                  <td><span className="badge badge-normal" style={{ textTransform: 'capitalize' }}>{emp.role}</span></td>
                  <td style={{ color: 'var(--text-dim)' }}>{new Date(emp.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleRemoveEmployee(emp.id)}
                      className="btn-icon" 
                      title="Revocar acceso"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamTab;
