import { supabase } from '../lib/supabase';

export default function TestSupabase() {
    return (
        <div style={{ padding: '50px', background: '#FFF7ED' }}>
            <h1>Supabase Import Test</h1>
            <p>If you see this, the Supabase import is WORKING.</p>
            <p>Supabase client exists: {supabase ? 'YES' : 'NO'}</p>
        </div>
    );
}
