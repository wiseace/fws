-- Update the user profile function to include address
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_name text DEFAULT NULL::text, 
  user_phone text DEFAULT NULL::text,
  user_address text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow authenticated users to update their own profile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sanitize inputs to prevent injection
  user_name := NULLIF(TRIM(user_name), '');
  user_phone := NULLIF(TRIM(user_phone), '');
  user_address := NULLIF(TRIM(user_address), '');

  -- Update only allowed fields (never user_type or admin fields)
  UPDATE public.users 
  SET 
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    address = COALESCE(user_address, address),
    updated_at = now()
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$function$