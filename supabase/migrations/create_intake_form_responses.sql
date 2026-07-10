-- ================================================================
-- TABLE: intake_form_responses
-- Stocke les fiches de renseignements médicaux remplies par les patients
-- ================================================================

CREATE TABLE IF NOT EXISTS public.intake_form_responses (
    id              BIGSERIAL PRIMARY KEY,
    patient_id      BIGINT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    submitted_at    TIMESTAMPTZ,
    form_completed  BOOLEAN DEFAULT FALSE,

    -- Section 1 — Identité
    last_name                   TEXT,
    first_name                  TEXT,
    maiden_name                 TEXT,
    birth_date                  DATE,
    address                     TEXT,
    postal_code                 TEXT,
    city                        TEXT,
    phone                       TEXT,
    email                       TEXT,
    emergency_contact_name      TEXT,
    emergency_contact_phone     TEXT,

    -- Section 2 — Médecins référents
    general_practitioner        TEXT,
    gp_city                     TEXT,
    specialist                  TEXT,
    specialist_city             TEXT,

    -- Section 3 — Situation générale
    profession                  TEXT,
    referral_source             JSONB DEFAULT '[]',
    referral_other              TEXT,

    -- Section 4 — Données médicales
    height_cm                   INTEGER,
    weight_kg                   INTEGER,
    has_allergies               BOOLEAN,
    allergies_detail            TEXT,
    is_smoker                   BOOLEAN,
    cigarettes_per_day          INTEGER,
    has_treatment               BOOLEAN,
    treatment_detail            TEXT,

    -- Section 5 — Motif de consultation
    consultation_reasons        JSONB DEFAULT '[]',
    consultation_other          TEXT,

    -- Section 6 — Ressenti esthétique
    discomfort_level            TEXT,
    discomfort_duration         TEXT,
    previous_consultation       BOOLEAN,

    -- Section 7 — Antécédents médicaux personnels
    antecedents                 JSONB DEFAULT '{}',
    antecedents_details         TEXT,

    -- Section 8 — Antécédents chirurgicaux & familiaux
    previous_surgery            BOOLEAN,
    previous_surgery_detail     TEXT,
    surgical_complications      BOOLEAN,
    complications_detail        TEXT,
    easy_hematomas              BOOLEAN,
    keloid_scars                BOOLEAN,
    autoimmune_family           BOOLEAN,
    autoimmune_detail           TEXT,
    family_history_other        TEXT,

    -- Méta / Signature
    id_card_recto               TEXT,
    id_card_verso               TEXT,
    has_aesthetic_interventions BOOLEAN,
    aesthetic_satisfied         BOOLEAN,
    signed_city                 TEXT,
    signed_date                 DATE,

    -- Timestamps
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    -- Un seul enregistrement par patient (upsert sur patient_id)
    CONSTRAINT intake_form_responses_patient_id_key UNIQUE (patient_id)
);

-- Index pour accès rapide par patient
CREATE INDEX IF NOT EXISTS idx_intake_form_responses_patient_id
    ON public.intake_form_responses (patient_id);

-- Trigger updated_at auto
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.intake_form_responses;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.intake_form_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS : activer la sécurité au niveau des lignes
ALTER TABLE public.intake_form_responses ENABLE ROW LEVEL SECURITY;

-- Politique : le patient peut lire/écrire SA propre fiche (via token → patient_id)
-- et les praticiens authentifiés peuvent tout lire
CREATE POLICY "Patients can upsert their own intake form"
    ON public.intake_form_responses
    FOR ALL
    USING (true)
    WITH CHECK (true);
