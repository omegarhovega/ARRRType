import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.secrets.AMPLIFY_SIWA_CLIENT_ID as string;
const supabaseAnonKey = process.env.secrets.AMPLIFY_SIWA_PRIVATE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)