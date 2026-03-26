import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkProfiles() {
    console.log('--- Profiles Check ---')
    const { data: users, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error('Auth User List Error:', authError.message)
    } else {
        console.log('Auth Users found:', users.users.length)
        users.users.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`))
    }

    const { data: profiles, error: profError } = await supabase.from('profiles').select('*')
    if (profError) {
        console.error('Profiles Table Error:', profError.message)
    } else {
        console.log('Profiles found:', profiles.length)
        profiles.forEach(p => console.log(`- ${p.id}: ${p.full_name} (${p.role})`))
    }
}

checkProfiles()
