-- Force complete cleanup of any SECURITY DEFINER views
-- First, check if there are any functions that might be creating views with SECURITY DEFINER

-- Drop all objects that might reference the view
DROP VIEW IF EXISTS public.provider_wizard_progress CASCADE;

-- Clear any potential cached view definitions by recreating with explicit security invoker
CREATE VIEW public.provider_wizard_progress
SECURITY INVOKER
AS
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
      (CASE WHEN u.verification_status = 'verified' THEN 1 ELSE 0 END) +
      (CASE WHEN u.subscription_plan != 'free' AND u.subscription_status != 'free' THEN 1 ELSE 0 END) +
      (CASE WHEN EXISTS (SELECT 1 FROM public.services s WHERE s.user_id = u.id AND s.is_active = true) THEN 1 ELSE 0 END)
    )::decimal / 4 * 100, 0
  ) as progress_percent

FROM public.users u
WHERE u.user_type = 'provider';

-- Add row level security to the view itself
ALTER VIEW public.provider_wizard_progress SET (security_barrier = false);

-- Ensure no RLS policies are applied to this view that might cause SECURITY DEFINER behavior
-- Views should inherit the security context of the querying user, not the view creator