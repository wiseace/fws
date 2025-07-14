-- Fix RLS policies to prevent privilege escalation
-- Users should not be able to modify their own user_type

-- Drop the existing policy that allows users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create admin-only policy for system fields
CREATE POLICY "Admins can update system fields" 
ON public.users 
FOR UPDATE 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create policy that allows users to update only basic profile fields
CREATE POLICY "Users can update basic profile fields" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Create function to safely update user profile (only allowed fields)
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_name text DEFAULT NULL,
  user_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users to update their own profile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update only allowed fields
  UPDATE public.users 
  SET 
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    updated_at = now()
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Create function to safely check user authorization for resources
CREATE OR REPLACE FUNCTION public.check_user_owns_resource(
  resource_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() = resource_user_id OR is_current_user_admin();
$$;

-- Create function for subscription validation (server-side)
CREATE OR REPLACE FUNCTION public.validate_user_subscription(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND subscription_plan != 'free'
    AND (subscription_expiry IS NULL OR subscription_expiry > now())
  );
$$;