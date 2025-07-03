-- Since we can't directly insert into auth.users, let's create a function to 
-- upgrade any existing user to admin status, and also fix the trigger

-- First, let's ensure our trigger handles admin user type properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'seeker')
  ) ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', users.name),
    user_type = COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, users.user_type);
  RETURN NEW;
END;
$$;

-- Create a function to manually create an admin user record
-- This will be used after manually creating the user via Supabase auth
CREATE OR REPLACE FUNCTION public.create_manual_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update admin user in public.users
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
END;
$$;