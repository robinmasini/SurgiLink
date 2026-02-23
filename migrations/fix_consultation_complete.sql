-- Migration Complete: Ajout de la colonne et des droits de traçabilité
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Création de la colonne si elle n'existe pas
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_consulted_at TIMESTAMPTZ;

-- 2. Création de la politique RLS (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patients' AND policyname = 'Portal: Patients can update consultation proof'
    ) THEN
        CREATE POLICY "Portal: Patients can update consultation proof" 
        ON public.patients 
        FOR UPDATE 
        TO anon 
        USING (has_valid_patient_token(id))
        WITH CHECK (has_valid_patient_token(id));
    END IF;
END
$$;

-- 3. Autorisation de mise à jour sur cette colonne spécifique pour le rôle public (anon)
GRANT UPDATE (last_consulted_at) ON public.patients TO anon;

-- Rafraîchissement du cache de l'API
NOTIFY pgrst, 'reload schema';
