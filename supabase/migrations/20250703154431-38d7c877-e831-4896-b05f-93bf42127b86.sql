-- Create the admin user properly in auth.users table
-- Since we can't directly insert into auth.users, we'll use the admin creation via Supabase Auth

-- First ensure the make_user_admin function works properly
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert admin user into public.users table directly
  INSERT INTO public.users (
    id,
    name,
    email,
    user_type,
    is_verified,
    verification_status,
    subscription_plan,
    subscription_status,
    can_access_contact
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Admin User',
    'hi@ariyo.dev',
    'admin',
    true,
    'verified',
    'yearly',
    'yearly',
    true
  ) ON CONFLICT (id) DO UPDATE SET
    user_type = 'admin',
    is_verified = true,
    verification_status = 'verified',
    subscription_plan = 'yearly',
    subscription_status = 'yearly',
    can_access_contact = true;
    
  -- Also insert into auth.users table for authentication
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
    raw_user_meta_data = '{"name": "Admin User", "user_type": "admin"}'::jsonb,
    email_confirmed_at = now();
END;
$$;

-- Execute the function to create admin user
SELECT public.create_admin_user();