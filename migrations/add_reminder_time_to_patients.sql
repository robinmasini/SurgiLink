-- Migration : Ajouter la colonne reminder_time à la table patients
-- Permet de stocker l'heure de rappel personnalisée pour chaque patient.

ALTER TABLE patients ADD COLUMN IF NOT EXISTS reminder_time TIME DEFAULT '08:30';
