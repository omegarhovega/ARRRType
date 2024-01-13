import { createClient } from '@supabase/supabase-js';

let supabaseUrl: string;
let supabaseAnonKey: string;

if (process.env.secrets) {
    // Parsing the secrets from the environment variable
    const secrets = JSON.parse(process.env.secrets);

    // Extract and verify the Supabase URL and Anon Key
    supabaseUrl = secrets.AMPLIFY_SIWA_CLIENT_ID;
    supabaseAnonKey = secrets.AMPLIFY_SIWA_PRIVATE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase URL or Anon Key is missing from secrets");
    }
} else {
    // Fallback to using import.meta.env
    supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
    supabaseAnonKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase URL or Anon Key is missing from import.meta.env");
    }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
