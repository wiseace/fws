-- Create secure contact request function
CREATE OR REPLACE FUNCTION public.create_contact_request(
  provider_id uuid,
  service_id uuid,
  message text,
  contact_method text DEFAULT 'email'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;