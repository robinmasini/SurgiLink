// Script rapide pour générer un lien patient
// Usage: Copie ce code dans la console du navigateur (sur une page où tu es connecté)

async function generatePatientLink(patientName = 'Martin Blanca') {
    // Importer depuis le module local
    const { supabase } = await import('./src/lib/supabase.js');

    // Fonction de génération de token
    function generateSecureToken() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    try {
        // 1. Trouver le patient
        const { data: patients, error: patientError } = await supabase
            .from('patients')
            .select('id, name')
            .ilike('name', `%${patientName}%`);

        if (patientError) {
            console.error('Erreur recherche patient:', patientError);
            return;
        }

        if (!patients || patients.length === 0) {
            console.error(`Patient "${patientName}" non trouvé`);
            // Lister tous les patients
            const { data: allPatients } = await supabase
                .from('patients')
                .select('id, name')
                .limit(10);
            console.log('Patients disponibles:', allPatients);
            return;
        }

        const patient = patients[0];
        console.log(`✅ Patient trouvé: ${patient.name} (ID: ${patient.id})`);

        // 2. Générer un token
        const token = generateSecureToken();

        // 3. Insérer dans la base
        const { data: tokenData, error: tokenError } = await supabase
            .from('patient_review_tokens')
            .insert([{
                patient_id: patient.id,
                token: token,
                is_active: true
            }])
            .select()
            .single();

        if (tokenError) {
            console.error('Erreur création token:', tokenError);
            return;
        }

        // 4. Générer l'URL
        const url = `http://localhost:5173/patient-portal/${token}`;

        console.log('\n🎉 LIEN GÉNÉRÉ AVEC SUCCÈS!\n');
        console.log('📋 URL du portail patient:');
        console.log(url);
        console.log('\n✨ Ce lien permet à', patient.name, 'd\'accéder à son portail sans login.');

        return url;
    } catch (err) {
        console.error('❌ Erreur:', err);
    }
}

// Pour utiliser automatiquement:
// generatePatientLink('Martin Blanca');

