-- Fix the security definer view by recreating it without SECURITY DEFINER
DROP VIEW IF EXISTS provider_wizard_progress;

CREATE VIEW provider_wizard_progress AS
SELECT
  u.id as user_id,
  
  -- Step 1: Complete Profile
  -- Check if essential profile fields are filled
  CASE 
    WHEN u.name IS NOT NULL 
      AND u.phone IS NOT NULL 
      AND u.service_location IS NOT NULL 
      AND u.skills IS NOT NULL 
      AND array_length(u.skills, 1) > 0
    THEN true 
    ELSE false 
  END as step_1_complete,

  -- Step 2: Get Verified
  CASE 
    WHEN u.verification_status = 'verified'
    THEN true 
    ELSE false 
  END as step_2_complete,

  -- Step 3: Choose Your Plan
  CASE 
    WHEN u.subscription_plan != 'free' 
      AND u.subscription_status != 'free'
    THEN true 
    ELSE false 
  END as step_3_complete,

  -- Step 4: Create First Service
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM services s 
      WHERE s.user_id = u.id 
        AND s.is_active = true
    ) 
    THEN true 
    ELSE false 
  END as step_4_complete,

  -- Calculate overall progress percentage
  ROUND(
    (
      (CASE WHEN u.name IS NOT NULL AND u.phone IS NOT NULL AND u.service_location IS NOT NULL AND u.skills IS NOT NULL AND array_length(u.skills, 1) > 0 THEN 1 ELSE 0 END) +
      (CASE WHEN u.verification_status = 'verified' THEN 1 ELSE 0 END) +
      (CASE WHEN u.subscription_plan != 'free' AND u.subscription_status != 'free' THEN 1 ELSE 0 END) +
      (CASE WHEN EXISTS (SELECT 1 FROM services s WHERE s.user_id = u.id AND s.is_active = true) THEN 1 ELSE 0 END)
    )::decimal / 4 * 100, 0
  ) as progress_percent

FROM users u
WHERE u.user_type = 'provider';

-- Add unique constraint to prevent duplicate onboarding steps
ALTER TABLE user_onboarding DROP CONSTRAINT IF EXISTS unique_user_step;
ALTER TABLE user_onboarding ADD CONSTRAINT unique_user_step UNIQUE (user_id, step_name);

-- Ensure the complete_onboarding_step function is correct
CREATE OR REPLACE FUNCTION public.complete_onboarding_step(input_step_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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