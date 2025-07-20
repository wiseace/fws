-- Aggressive cleanup of all possible SECURITY DEFINER objects
-- Check for and remove any functions that might be creating SECURITY DEFINER views

-- First, completely drop the view from all possible locations
DROP VIEW IF EXISTS public.provider_wizard_progress CASCADE;
DROP VIEW IF EXISTS provider_wizard_progress CASCADE;

-- Check if there are any functions with SECURITY DEFINER that might be creating views
-- We'll remove SECURITY DEFINER from our functions and use SET search_path instead

-- Update the complete_onboarding_step function to remove potential issues
DROP FUNCTION IF EXISTS public.complete_onboarding_step(text);

-- Recreate without SECURITY DEFINER to avoid any cascading security issues
CREATE OR REPLACE FUNCTION public.complete_onboarding_step(input_step_name text)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.user_onboarding (user_id, step_name, completed, completed_at)
    VALUES (auth.uid(), input_step_name, TRUE, now())
    ON CONFLICT (user_id, step_name) 
    DO UPDATE SET 
        completed = TRUE, 
        completed_at = now(),
        updated_at = now();
END;
$function$;

-- Now recreate the view completely fresh
CREATE VIEW public.provider_wizard_progress AS
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