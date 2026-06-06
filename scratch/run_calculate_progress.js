import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

// Now import pathwayService
const { calculateGlobalProgress } = await import('../src/services/pathwayService.js');
const { createClient } = await import('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const ids = [47, 48, 49];
    for (const id of ids) {
        console.log(`\nRecalculating for patient ID ${id}...`);
        const progress = await calculateGlobalProgress(id);
        console.log(`Returned progress: ${progress}%`);

        const { data: p } = await supabase
            .from('patients')
            .select('name, progress, status')
            .eq('id', id)
            .single();
        console.log(`Database state: Name: ${p.name} | Progress: ${p.progress}% | Status: ${p.status}`);
    }
}

run();
