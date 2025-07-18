-- PHASE 1: Critical Database Security Fixes

-- Fix all database functions to include proper search_path for security
-- This prevents SQL injection attacks through search_path manipulation

-- 1. Fix update_user_profile function
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_name text DEFAULT NULL,
  user_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow authenticated users to update their own profile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sanitize inputs to prevent injection
  user_name := NULLIF(TRIM(user_name), '');
  user_phone := NULLIF(TRIM(user_phone), '');

  -- Update only allowed fields (never user_type or admin fields)
  UPDATE public.users 
  SET 
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    updated_at = now()
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- 2. Fix check_user_owns_resource function
CREATE OR REPLACE FUNCTION public.check_user_owns_resource(
  resource_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT auth.uid() = resource_user_id OR is_current_user_admin();
$$;

-- 3. Fix validate_user_subscription function
CREATE OR REPLACE FUNCTION public.validate_user_subscription(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND subscription_plan != 'free'
    AND (subscription_expiry IS NULL OR subscription_expiry > now())
  );
$$;

-- 4. Fix get_current_user_type function
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT user_type::text FROM public.users WHERE id = auth.uid();
$$;

-- 5. Fix is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
$$;

-- 6. Create secure admin role management function (PHASE 2: Privilege Escalation Fix)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id uuid,
  new_user_type user_type,
  admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Critical security check: Only allow current admins to update roles
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Prevent self-demotion (admin removing their own admin status)
  IF target_user_id = auth.uid() AND new_user_type != 'admin' THEN
    RAISE EXCEPTION 'Security violation: Cannot remove your own admin privileges';
  END IF;

  -- Validate target user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Update user type with audit trail
  UPDATE public.users 
  SET 
    user_type = new_user_type,
    updated_at = now()
  WHERE id = target_user_id;

  -- Create audit log entry
  INSERT INTO public.user_notifications (
    user_id, 
    title, 
    message, 
    type
  ) VALUES (
    target_user_id,
    'Account Role Updated',
    'Your account role has been updated to: ' || new_user_type::text || 
    CASE WHEN admin_notes IS NOT NULL THEN '. Admin notes: ' || admin_notes ELSE '' END,
    'info'
  );

  -- Log the admin action
  INSERT INTO public.user_notifications (
    user_id, 
    title, 
    message, 
    type
  ) VALUES (
    auth.uid(),
    'Role Change Executed',
    'Updated user role for user ID: ' || target_user_id::text || ' to: ' || new_user_type::text,
    'info'
  );
END;
$$;

-- 7. Create secure admin user deletion function
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  target_user_id uuid,
  admin_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Critical security check: Only allow current admins
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Security violation: Cannot delete your own account';
  END IF;

  -- Validate reason is provided
  IF admin_reason IS NULL OR TRIM(admin_reason) = '' THEN
    RAISE EXCEPTION 'Admin reason is required for user deletion';
  END IF;

  -- Call the existing secure deletion function
  PERFORM delete_user_and_related_data(target_user_id);

  -- Log the admin action
  INSERT INTO public.user_notifications (
    user_id, 
    title, 
    message, 
    type
  ) VALUES (
    auth.uid(),
    'User Deletion Executed',
    'Deleted user ID: ' || target_user_id::text || '. Reason: ' || admin_reason,
    'info'
  );
END;
$$;