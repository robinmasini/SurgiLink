import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProfiles() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log('--- PROFILES ---');
    profiles.forEach(p => {
        console.log(`[${p.role}] ${p.full_name} (${p.email}) - ID: ${p.id}`);
    });
}

checkProfiles();
