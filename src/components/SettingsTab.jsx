import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const SettingsTab = ({ settings, updateSettings, session }) => {
  const [companyName, setCompanyName] = useState(settings?.company_name || 'InvPro');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveName = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateSettings({ ...settings, company_name: companyName });
      setSuccessMsg('Nombre actualizado correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg('Error al guardar el nombre.');
    }
  };

  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir al bucket 'backgrounds'
      let { error: uploadError } = await supabase.storage
        .from('backgrounds')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Actualizar los settings del usuario
      await updateSettings({ ...settings, background_url: publicUrl });
      
      setSuccessMsg('Fondo de pantalla actualizado correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
      setErrorMsg('Error subiendo la imagen. Verifica que el bucket exista y sea público.');
    } finally {
      setUploading(false);
    }
  };

  const handleClearBackground = async () => {
    await updateSettings({ ...settings, background_url: '' });
    setSuccessMsg('Fondo de pantalla restaurado por defecto.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Personalización</h2>
      
      {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>{errorMsg}</div>}
      {successMsg && <div style={{ color: '#10b981', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>{successMsg}</div>}

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Nombre de la Empresa / Proyecto</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={handleSaveName}>Guardar</button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Fondo de Pantalla Personalizado</label>
        
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <div style={{ 
            border: '2px dashed var(--surface-border)', 
            padding: '2rem', 
            borderRadius: '12px', 
            textAlign: 'center',
            position: 'relative'
          }}>
            {uploading ? (
              <p>Subiendo imagen...</p>
            ) : (
              <>
                <p style={{ marginBottom: '1rem' }}>Selecciona una imagen de tu computadora</p>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <button className="btn" style={{ pointerEvents: 'none' }}>Examinar...</button>
              </>
            )}
          </div>
          
          {settings?.background_url && (
             <button 
                className="btn" 
                onClick={handleClearBackground} 
                style={{ background: 'transparent', border: '1px solid var(--surface-border)' }}
             >
               Restaurar fondo por defecto
             </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default SettingsTab;
