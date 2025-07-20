-- Fix SECURITY DEFINER view issue permanently
-- Drop the problematic view completely
DROP VIEW IF EXISTS public.provider_wizard_progress CASCADE;

-- Recreate the view with explicit SECURITY INVOKER (default behavior)
-- This ensures it respects RLS policies and uses current user permissions
CREATE VIEW public.provider_wizard_progress 
WITH (security_invoker = true) AS
SELECT
  u.id as user_id,
  
  CASE 
    WHEN u.name IS NOT NULL 
      AND u.phone IS NOT NULL 
      AND u.service_location IS NOT NULL 
      AND u.skills IS NOT NULL 
      AND array_length(u.skills, 1) > 0
    THEN true 
    ELSE false 
  END as step_1_complete,

  CASE 
    WHEN u.verification_status = 'verified'::verification_status
    THEN true 
    ELSE false 
  END as step_2_complete,

  CASE 
    WHEN u.subscription_plan != 'free'::subscription_plan 
      AND u.subscription_status != 'free'::subscription_status
    THEN true 
    ELSE false 
  END as step_3_complete,

  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.services s 
      WHERE s.user_id = u.id 
        AND s.is_active = true
    ) 
    THEN true 
    ELSE false 
  END as step_4_complete,

  ROUND(
    (
      (CASE WHEN u.name IS NOT NULL AND u.phone IS NOT NULL AND u.service_location IS NOT NULL AND u.skills IS NOT NULL AND array_length(u.skills, 1) > 0 THEN 1 ELSE 0 END) +
      (CASE WHEN u.verification_status = 'verified'::verification_status THEN 1 ELSE 0 END) +
      (CASE WHEN u.subscription_plan != 'free'::subscription_plan AND u.subscription_status != 'free'::subscription_status THEN 1 ELSE 0 END) +
      (CASE WHEN EXISTS (SELECT 1 FROM public.services s WHERE s.user_id = u.id AND s.is_active = true) THEN 1 ELSE 0 END)
    )::decimal / 4 * 100, 0
  ) as progress_percent

FROM public.users u
WHERE u.user_type = 'provider'::user_type;