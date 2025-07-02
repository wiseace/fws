-- Create the admin user in our users table directly
-- We can't directly insert into auth.users, so we'll create the user via the application
-- and then update their status to admin

-- For now, let's create a function to upgrade a user to admin status
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users 
  SET 
    user_type = 'admin',
    is_verified = true,
    verification_status = 'verified',
    subscription_plan = 'yearly',
    can_access_contact = true,
    updated_at = now()
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;

-- Add RLS policies for admin users to access all data
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
    );

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
    );

-- Add policy for admins to view all services
CREATE POLICY "Admins can view all services" ON public.services
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
    );

-- Update the trigger to handle conflicts properly
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
  ) ON CONFLICT (email) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    user_type = COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'seeker');
  RETURN NEW;
END;
$$;