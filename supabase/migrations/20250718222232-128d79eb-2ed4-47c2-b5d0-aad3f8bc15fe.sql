-- Update the can_access_contact_info function to not require verification for seekers
CREATE OR REPLACE FUNCTION public.can_access_contact_info(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND subscription_plan != 'free'
        AND (subscription_expiry IS NULL OR subscription_expiry > now())
        AND (
          -- For seekers, only subscription is required
          user_type = 'seeker' 
          OR 
          -- For providers, both subscription and verification are required
          (user_type = 'provider' AND verification_status = 'verified')
        )
      )
    END;
$function$;