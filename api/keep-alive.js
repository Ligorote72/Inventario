import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // En Vercel Serverless (Node.js), las variables de entorno están en process.env
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Missing Supabase environment variables' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Hacemos una consulta súper ligera a la tabla products solo para "despertar" la BD
    const { error } = await supabase.from('products').select('id').limit(1);
    
    if (error) {
      throw error;
    }

    res.status(200).json({ status: 'ok', message: 'La base de datos de Supabase fue despertada con éxito.' });
  } catch (error) {
    console.error('Error al despertar la base de datos:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}
