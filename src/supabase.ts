import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.secrets.AMPLIFY_SIWA_CLIENT_ID;
const supabaseAnonKey = import.meta.env.secrets.AMPLIFY_SIWA_PRIVATE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)