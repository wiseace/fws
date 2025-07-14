-- Fix function search path security warnings
-- Setting search_path prevents potential SQL injection attacks

-- Fix get_current_user_type function
CREATE OR REPLACE FUNCTION public.get_current_user_type()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT user_type::text FROM public.users WHERE id = auth.uid();
$function$;

-- Fix is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
$function$;

-- Fix update_verification_status function
CREATE OR REPLACE FUNCTION public.update_verification_status(request_id uuid, new_status verification_status, notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin') THEN
        RAISE EXCEPTION 'Only admins can update verification status';
    END IF;
    
    UPDATE public.verification_requests 
    SET 
        status = new_status,
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        review_notes = notes,
        updated_at = now()
    WHERE id = request_id;
    
    UPDATE public.users 
    SET verification_status = new_status
    WHERE id = (SELECT user_id FROM public.verification_requests WHERE id = request_id);
END;
$function$;

-- Fix get_admin_stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.users),
        'verified_users', (SELECT COUNT(*) FROM public.users WHERE verification_status = 'verified'),
        'pending_verifications', (SELECT COUNT(*) FROM public.verification_requests WHERE status = 'pending'),
        'active_subscriptions', (SELECT COUNT(*) FROM public.users WHERE subscription_plan != 'free'),
        'total_services', (SELECT COUNT(*) FROM public.services),
        'total_categories', (SELECT COUNT(*) FROM public.categories)
    );
$function$;

-- Fix make_user_admin function
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.users 
  SET 
    user_type = 'admin',
    is_verified = true,
    verification_status = 'verified',
    subscription_plan = 'yearly',
    can_access_contact = true,
    updated_at = now()
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$function$;

-- Fix delete_user_and_related_data function
CREATE OR REPLACE FUNCTION public.delete_user_and_related_data(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    -- Check if current user is admin
    IF NOT is_current_user_admin() THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;
    
    -- Delete related data in the correct order to avoid foreign key conflicts
    
    -- Delete contact requests where user is either seeker or provider
    DELETE FROM public.contact_requests 
    WHERE seeker_id = target_user_id OR provider_id = target_user_id;
    
    -- Delete verification requests
    DELETE FROM public.verification_requests 
    WHERE user_id = target_user_id;
    
    -- Delete services owned by the user
    DELETE FROM public.services 
    WHERE user_id = target_user_id;
    
    -- Delete from public.users table
    DELETE FROM public.users 
    WHERE id = target_user_id;
    
    -- Delete from auth.users table (this prevents login)
    DELETE FROM auth.users 
    WHERE id = target_user_id;
    
    -- Log the deletion
    RAISE NOTICE 'User % and all related data have been deleted from both public and auth tables', target_user_id;
END;
$function$;

-- Fix init_provider_onboarding function
CREATE OR REPLACE FUNCTION public.init_provider_onboarding()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    -- Only initialize for providers
    IF NEW.user_type = 'provider' THEN
        -- Insert onboarding steps
        INSERT INTO public.user_onboarding (user_id, step_name) VALUES 
            (NEW.id, 'profile_completion'),
            (NEW.id, 'verification_submission'),
            (NEW.id, 'first_service_creation'),
            (NEW.id, 'profile_optimization');
        
        -- Create welcome notification
        INSERT INTO public.user_notifications (user_id, title, message, type) VALUES 
            (NEW.id, 'Welcome to Findwhosabi!', 'Complete your profile and verification to start offering services.', 'info');
    ELSIF NEW.user_type = 'seeker' THEN
        -- Create welcome notification for seekers
        INSERT INTO public.user_notifications (user_id, title, message, type) VALUES 
            (NEW.id, 'Welcome to Findwhosabi!', 'Start browsing amazing services in your area.', 'info');
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix complete_onboarding_step function
CREATE OR REPLACE FUNCTION public.complete_onboarding_step(step_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.user_onboarding (user_id, step_name, completed, completed_at)
    VALUES (auth.uid(), step_name, TRUE, now())
    ON CONFLICT (user_id, step_name) 
    DO UPDATE SET 
        completed = TRUE, 
        completed_at = now(),
        updated_at = now();
END;
$function$;

-- Fix update_user_profile function
CREATE OR REPLACE FUNCTION public.update_user_profile(user_name text DEFAULT NULL::text, user_phone text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow authenticated users to update their own profile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update only allowed fields
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
$function$;

-- Fix check_user_owns_resource function
CREATE OR REPLACE FUNCTION public.check_user_owns_resource(resource_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT auth.uid() = resource_user_id OR is_current_user_admin();
$function$;

-- Fix validate_user_subscription function
CREATE OR REPLACE FUNCTION public.validate_user_subscription(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND subscription_plan != 'free'
    AND (subscription_expiry IS NULL OR subscription_expiry > now())
  );
$function$;

-- Fix create_manual_admin_user function
CREATE OR REPLACE FUNCTION public.create_manual_admin_user()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Insert or update admin user in public.users
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
    '00000000-0000-0000-0000-000000000001'::uuid,
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
    can_access_contact = true;
END;
$function$;

-- Fix create_contact_request function
CREATE OR REPLACE FUNCTION public.create_contact_request(provider_id uuid, service_id uuid, message text, contact_method text DEFAULT 'email'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  request_id uuid;
  seeker_profile record;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get seeker profile with validation
  SELECT * INTO seeker_profile 
  FROM public.users 
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Validate seeker has subscription and verification
  IF NOT validate_user_subscription(auth.uid()) THEN
    RAISE EXCEPTION 'Active subscription required to contact providers';
  END IF;

  IF seeker_profile.verification_status != 'verified' THEN
    RAISE EXCEPTION 'Account verification required to contact providers';
  END IF;

  -- Validate provider exists and is verified
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = provider_id 
    AND user_type = 'provider' 
    AND verification_status = 'verified'
  ) THEN
    RAISE EXCEPTION 'Provider not found or not verified';
  END IF;

  -- Validate service exists and belongs to provider
  IF NOT EXISTS (
    SELECT 1 FROM public.services 
    WHERE id = service_id 
    AND user_id = provider_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  -- Check for duplicate requests (prevent spam)
  IF EXISTS (
    SELECT 1 FROM public.contact_requests 
    WHERE seeker_id = auth.uid() 
    AND provider_id = create_contact_request.provider_id 
    AND service_id = create_contact_request.service_id
    AND created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'You have already contacted this provider in the last 24 hours';
  END IF;

  -- Create the contact request
  INSERT INTO public.contact_requests (
    seeker_id, 
    provider_id, 
    service_id, 
    message, 
    contact_method
  )
  VALUES (
    auth.uid(), 
    create_contact_request.provider_id, 
    create_contact_request.service_id, 
    message, 
    contact_method
  )
  RETURNING id INTO request_id;

  -- Create notification for provider
  INSERT INTO public.user_notifications (
    user_id, 
    title, 
    message, 
    type,
    action_url
  )
  VALUES (
    create_contact_request.provider_id,
    'New Contact Request',
    'You have received a new contact request for your service.',
    'contact_request',
    '/dashboard'
  );

  RETURN request_id;
END;
$function$;

-- Fix can_access_contact_info function
CREATE OR REPLACE FUNCTION public.can_access_contact_info(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    CASE 
      WHEN user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND verification_status = 'verified'
        AND subscription_plan != 'free'
        AND (subscription_expiry IS NULL OR subscription_expiry > now())
      )
    END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'seeker')
  ) ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', users.name),
    user_type = COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, users.user_type);
  RETURN NEW;
END;
$function$;