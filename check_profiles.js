
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProfiles() {
    console.log('--- Checking Profiles Table ---');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);
    if (profiles.length > 0) {
        console.log('Columns:', Object.keys(profiles[0]));
        console.log('Data:', JSON.stringify(profiles, null, 2));
    } else {
        console.log('No profiles found in the table.');
    }
}

checkProfiles();
