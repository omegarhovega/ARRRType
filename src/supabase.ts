import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${process.env.secrets.AMPLIFY_SIWA_CLIENT_ID}';
const supabaseAnonKey = '${process.env.secrets.AMPLIFY_SIWA_PRIVATE_KEY}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)