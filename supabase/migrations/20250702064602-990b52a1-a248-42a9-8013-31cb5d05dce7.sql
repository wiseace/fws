-- Create the admin user account
-- First we need to insert into auth.users, then our users table will be populated via trigger

-- Insert admin user into auth.users (this will trigger our handle_new_user function)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'hi@ariyo.dev',
  crypt('Micheal@2019!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Admin User", "user_type": "admin"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('Micheal@2019!', gen_salt('bf')),
  raw_user_meta_data = '{"name": "Admin User", "user_type": "admin"}'::jsonb;

-- Update the user in our users table to be admin and verified
INSERT INTO public.users (
  id,
  name,
  email,
  user_type,
  is_verified,
  verification_status,
  subscription_plan,
  can_access_contact
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Admin User',
  'hi@ariyo.dev',
  'admin',
  true,
  'verified',
  'yearly',
  true
) ON CONFLICT (id) DO UPDATE SET
  user_type = 'admin',
  is_verified = true,
  verification_status = 'verified',
  subscription_plan = 'yearly',
  can_access_contact = true;

-- Update auth trigger to handle admin users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'seeker')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;