-- Fix the admin user creation by handling the correct order
-- First insert into auth.users, then the trigger will create the public.users record

-- Create a simplified admin user creation
CREATE OR REPLACE FUNCTION public.create_admin_auth_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert admin user into auth.users table first
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
    
  -- Update the public.users record to be admin (trigger should have created it)
  UPDATE public.users 
  SET 
    user_type = 'admin',
    is_verified = true,
    verification_status = 'verified',
    subscription_plan = 'yearly',
    subscription_status = 'yearly',
    can_access_contact = true
  WHERE email = 'hi@ariyo.dev';
  
  -- If no record exists, insert it manually
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
  ) ON CONFLICT (email) DO NOTHING;
END;
$$;

-- Execute the function to create admin user
SELECT public.create_admin_auth_user();