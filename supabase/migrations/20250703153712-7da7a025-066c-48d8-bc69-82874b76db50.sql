-- Fix infinite recursion in RLS policies by creating security definer functions
-- This will resolve the "infinite recursion detected in policy for relation 'users'" error

-- Create security definer function to check user type safely
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
  SELECT user_type::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check if user is admin safely  
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;

-- Recreate policies using security definer functions to prevent recursion
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all services" ON public.services
  FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all verification requests" ON public.verification_requests
  FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can update verification requests" ON public.verification_requests
  FOR UPDATE USING (public.is_current_user_admin());

-- Fix enum inconsistency - Add 'admin' to user_type enum if it doesn't exist
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'admin';

-- Ensure all users have proper default values to prevent constraint violations
UPDATE public.users 
SET 
  subscription_plan = COALESCE(subscription_plan, 'free'),
  subscription_status = COALESCE(subscription_status, 'free'),
  verification_status = COALESCE(verification_status, 'not_verified'),
  can_access_contact = COALESCE(can_access_contact, false)
WHERE 
  subscription_plan IS NULL 
  OR subscription_status IS NULL 
  OR verification_status IS NULL 
  OR can_access_contact IS NULL;