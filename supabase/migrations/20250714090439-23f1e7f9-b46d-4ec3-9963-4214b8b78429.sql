-- Fix RLS policies to prevent privilege escalation
-- Users should not be able to modify their own user_type

-- Drop the existing policy that allows users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create separate policies for different types of updates
-- Allow users to update basic profile fields but NOT user_type or admin-only fields
CREATE POLICY "Users can update basic profile fields" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND user_type = OLD.user_type  -- Prevent changing user_type
  AND is_verified = OLD.is_verified  -- Prevent changing verification status
  AND verification_status = OLD.verification_status  -- Prevent changing verification status
  AND subscription_plan = OLD.subscription_plan  -- Prevent changing subscription (should be server-side only)
  AND subscription_status = OLD.subscription_status  -- Prevent changing subscription status
  AND can_access_contact = OLD.can_access_contact  -- Prevent changing contact access
);

-- Create admin-only policy for system fields
CREATE POLICY "Admins can update system fields" 
ON public.users 
FOR UPDATE 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

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

-- Update services policies to use proper authorization checks
DROP POLICY IF EXISTS "Users can manage their own services" ON public.services;

CREATE POLICY "Users can view their own services" 
ON public.services 
FOR SELECT 
USING (check_user_owns_resource(user_id));

CREATE POLICY "Users can create their own services" 
ON public.services 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can update their own services" 
ON public.services 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND user_id = OLD.user_id);

CREATE POLICY "Users can delete their own services" 
ON public.services 
FOR DELETE 
USING (auth.uid() = user_id);

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

-- Update contact requests policy to use server-side validation
DROP POLICY IF EXISTS "Verified subscribers can create contact requests" ON public.contact_requests;

CREATE POLICY "Verified subscribers can create contact requests" 
ON public.contact_requests 
FOR INSERT 
WITH CHECK (
  seeker_id = auth.uid() 
  AND validate_user_subscription(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND verification_status = 'verified'
  )
);