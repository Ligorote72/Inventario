import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthGate = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Error logging in with Google:', error.message);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'white' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>Cargando inventario...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-color)', 
        color: 'white' 
      }}>
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="sidebar-logo" style={{ justifyContent: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>
            <span>⚡</span> InvPro
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Bienvenido</h1>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem' }}>
            Inicia sesión para gestionar tu inventario en la nube.
          </p>
          <button 
            onClick={handleGoogleLogin} 
            className="btn" 
            style={{ 
              width: '100%', 
              background: 'white', 
              color: '#333', 
              fontSize: '1rem',
              padding: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem'
            }}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '20px', height: '20px' }} />
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { session });
        }
        return child;
      })}
    </React.Fragment>
  );
};

export default AuthGate;
