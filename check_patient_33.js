
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPatient() {
    const { data, error } = await supabase
        .from('patients')
        .select('name, phone')
        .eq('id', 33)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkPatient();
