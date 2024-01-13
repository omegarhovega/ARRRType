import { createClient } from '@supabase/supabase-js'

interface Secrets {
    AMPLIFY_SIWA_CLIENT_ID?: string;
    AMPLIFY_SIWA_PRIVATE_KEY?: string;
}

let secrets: Secrets = {};
if (process.env.secrets) {
    secrets = JSON.parse(process.env.secrets);
}

const supabaseUrl = secrets.AMPLIFY_SIWA_CLIENT_ID;
const supabaseAnonKey = secrets.AMPLIFY_SIWA_PRIVATE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)