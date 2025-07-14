-- Fix the admin user's profile to have proper admin privileges
UPDATE public.users 
SET 
  is_verified = true,
  verification_status = 'verified',
  subscription_plan = 'yearly',
  subscription_status = 'yearly',
  can_access_contact = true,
  updated_at = now()
WHERE email = 'hi@ariyo.dev' AND user_type = 'admin';