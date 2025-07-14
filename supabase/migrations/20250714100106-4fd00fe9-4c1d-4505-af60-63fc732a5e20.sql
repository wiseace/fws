-- Fix verification_requests table structure and RLS policies
-- The table already exists, but let's ensure RLS policies are correct

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Users can create their own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;

-- Create proper RLS policies
CREATE POLICY "Admins can manage all verification requests" 
ON public.verification_requests 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Users can create their own verification requests" 
ON public.verification_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (auth.uid() = user_id OR is_current_user_admin());

-- Ensure admin user is properly set up
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
  '3878ae46-71ca-494e-af93-d0f8d8e83d9d'::uuid,
  'Admin User',
  'hi@ariyo.dev',
  'admin',
  true,
  'verified',
  'yearly',
  'yearly',
  true
) ON CONFLICT (email) DO UPDATE SET
  user_type = 'admin',
  is_verified = true,
  verification_status = 'verified',
  subscription_plan = 'yearly',
  subscription_status = 'yearly',
  can_access_contact = true,
  updated_at = now();