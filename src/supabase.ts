import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

console.log("Supabase URL:", import.meta.env.VITE_APP_SUPABASE_URL);

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
