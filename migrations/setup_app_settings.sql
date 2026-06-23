-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update settings (strictly for admin/practitioner roles in a real app, but for now allowed for simplicity)
CREATE POLICY "Allow authenticated users to update settings"
ON public.app_settings FOR ALL
TO authenticated
USING (true);

-- Initialize default settings
INSERT INTO public.app_settings (key, value)
VALUES 
('financial_impact_unit', '2450'),
('status_rules', '{
    "no_portal_access_hours": 24,
    "j7_incomplete_days": 7,
    "j2_incomplete_days": 2,
    "j3_critical_upgrade": 3,
    "progress_warning_threshold": 50,
    "progress_critical_threshold": 80
}'),
('reminder_offsets', '{
    "welcome": -18,
    "j7": -7,
    "j2": -2,
    "j1": -1,
    "j0": 0,
    "j1_postop": 1,
    "j4_satisfaction": 4,
    "esatis": 4
}')
ON CONFLICT (key) DO NOTHING;
