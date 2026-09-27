import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wjrdwwuajqqvapbawxak.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
