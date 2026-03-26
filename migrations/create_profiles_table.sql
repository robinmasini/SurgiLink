-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('practitioner', 'nurse')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Insert initial users
-- Practitioner: Dr. Desouches
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('c512fc61-e751-4ea3-872e-8a04fee4da12', 'contact@desouches-chirurgien.com', 'Christophe DESOUCHES', 'practitioner')
ON CONFLICT (id) DO UPDATE SET role = 'practitioner', full_name = 'Christophe DESOUCHES';

-- Nurse: New account
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('fe1efb20-c915-41b1-9cbd-cbb18df43565', 'infirmier@surgilink.fr', 'Infirmier Cabinet', 'nurse')
ON CONFLICT (id) DO UPDATE SET role = 'nurse', full_name = 'Infirmier Cabinet';
