import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.AMPLIFY_SIWA_CLIENT_ID as string;
const supabaseAnonKey = process.env.AMPLIFY_SIWA_PRIVATE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)