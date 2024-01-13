import { createClient } from '@supabase/supabase-js'

let secrets = {};
if (process.env.secrets) {
    secrets = JSON.parse(process.env.secrets);
}

const supabaseUrl = secrets.AMPLIFY_SIWA_CLIENT_ID;
const supabaseAnonKey = secrets.AMPLIFY_SIWA_PRIVATE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)