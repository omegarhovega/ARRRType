import { createClient } from '@supabase/supabase-js';
import { Amplify } from 'aws-amplify';
import amplifyconfig from './amplifyconfiguration.json';
Amplify.configure(amplifyconfig);

// Parse the secrets from the environment variable
const secretsString = process.env.secrets;
if (!secretsString) {
    throw new Error("Environment secrets are not defined");
}

const secrets = JSON.parse(secretsString);

// Extract and verify the Supabase URL and Anon Key
const supabaseUrl = secrets.AMPLIFY_SIWA_CLIENT_ID;
const supabaseAnonKey = secrets.AMPLIFY_SIWA_PRIVATE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* Local deployment

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey) */