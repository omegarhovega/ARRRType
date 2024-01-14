import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.AMPLIFY_SIWA_CLIENT_ID;
const supabaseAnonKey = process.env.AMPLIFY_SIWA_PRIVATE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
