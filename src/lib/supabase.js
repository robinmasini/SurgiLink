import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) ||
    (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SUPABASE_URL) ||
    'https://placeholder.supabase.co'

const supabaseAnonKey = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
    'placeholder'

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    console.warn('Supabase credentials are missing. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
