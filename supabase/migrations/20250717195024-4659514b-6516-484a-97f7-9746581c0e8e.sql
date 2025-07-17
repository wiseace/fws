-- Allow anyone to view verified providers in the users table
-- This enables non-logged-in users to see providers on the providers page

CREATE POLICY "Anyone can view verified providers" 
ON public.users 
FOR SELECT 
USING (
  user_type = 'provider' 
  AND is_verified = true 
  AND verification_status = 'verified'
);