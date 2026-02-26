
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
    const { data: p } = await supabase.from('patients').select('id, name, created_at, user_id').order('created_at', { ascending: false });
    console.table(p);
}

listAll();
