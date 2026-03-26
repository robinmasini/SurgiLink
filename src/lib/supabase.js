import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials are missing! Check your .env file.')
}

let supabaseInstance = null;
try {
    if (supabaseUrl && supabaseAnonKey) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    }
} catch (err) {
    console.error('Failed to initialize Supabase client:', err)
}

export const supabase = supabaseInstance;
