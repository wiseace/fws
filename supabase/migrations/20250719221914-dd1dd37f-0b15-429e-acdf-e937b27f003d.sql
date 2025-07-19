-- Complete cleanup and recreation without SECURITY DEFINER
DROP VIEW IF EXISTS public.provider_wizard_progress CASCADE;

-- Recreate the view with fully qualified names to avoid any security definer issues
CREATE VIEW public.provider_wizard_progress AS
SELECT
  u.id as user_id,
  
  -- Step 1: Complete Profile
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
    WHEN u.verification_status = 'verified'::verification_status
    THEN true 
    ELSE false 
  END as step_2_complete,

  -- Step 3: Choose Your Plan
  CASE 
    WHEN u.subscription_plan != 'free'::subscription_plan 
      AND u.subscription_status != 'free'::subscription_status
    THEN true 
    ELSE false 
  END as step_3_complete,

  -- Step 4: Create First Service
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.services s 
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
      (CASE WHEN u.verification_status = 'verified'::verification_status THEN 1 ELSE 0 END) +
      (CASE WHEN u.subscription_plan != 'free'::subscription_plan AND u.subscription_status != 'free'::subscription_status THEN 1 ELSE 0 END) +
      (CASE WHEN EXISTS (SELECT 1 FROM public.services s WHERE s.user_id = u.id AND s.is_active = true) THEN 1 ELSE 0 END)
    )::decimal / 4 * 100, 0
  ) as progress_percent

FROM public.users u
WHERE u.user_type = 'provider'::user_type;

-- Grant appropriate permissions
GRANT SELECT ON public.provider_wizard_progress TO authenticated;
GRANT SELECT ON public.provider_wizard_progress TO anon;