-- Drop all existing views and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS provider_wizard_progress CASCADE;

-- Check if there are any other views with SECURITY DEFINER
DO $$
DECLARE
    view_rec RECORD;
BEGIN
    FOR view_rec IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || view_rec.schemaname || '.' || view_rec.viewname || ' CASCADE';
        RAISE NOTICE 'Dropped view: %.%', view_rec.schemaname, view_rec.viewname;
    END LOOP;
END $$;

-- Recreate the provider_wizard_progress view without SECURITY DEFINER
CREATE VIEW provider_wizard_progress AS
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