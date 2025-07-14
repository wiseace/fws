-- Ensure admin user exists and is properly configured
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
) ON CONFLICT (id) DO UPDATE SET
  user_type = 'admin',
  is_verified = true,
  verification_status = 'verified',
  subscription_plan = 'yearly',
  subscription_status = 'yearly',
  can_access_contact = true,
  updated_at = now();