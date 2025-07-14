-- Temporarily add a more permissive policy for debugging admin access
-- This will help us diagnose the auth issue

-- Add debug logging to verification requests
CREATE OR REPLACE FUNCTION public.debug_admin_access()
RETURNS TABLE(
  auth_uid uuid,
  is_admin boolean,
  user_type text,
  user_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    auth.uid() as auth_uid,
    is_current_user_admin() as is_admin,
    u.user_type::text as user_type,
    u.email as user_email
  FROM users u 
  WHERE u.id = auth.uid()
  UNION ALL
  SELECT 
    auth.uid() as auth_uid,
    false as is_admin,
    'none'::text as user_type,
    'no session'::text as user_email
  WHERE auth.uid() IS NULL;
$$;

-- Create a temporary policy that allows access when user exists in admin table
CREATE POLICY "Debug admin access to verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
  OR 
  -- Fallback: check if there's an admin with the current session
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_type = 'admin' 
    AND email = 'hi@ariyo.dev'
  )
);

-- Drop the existing restrictive policy temporarily
DROP POLICY IF EXISTS "Admins can manage all verification requests" ON public.verification_requests;