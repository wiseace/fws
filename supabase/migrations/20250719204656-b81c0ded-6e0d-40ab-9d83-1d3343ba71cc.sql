-- Add Google Maps location fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Add Google Maps location fields to services table  
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Update the update_user_profile function to handle new location fields
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_name text DEFAULT NULL,
  user_phone text DEFAULT NULL,
  user_address text DEFAULT NULL,
  user_latitude numeric DEFAULT NULL,
  user_longitude numeric DEFAULT NULL,
  user_city text DEFAULT NULL,
  user_state text DEFAULT NULL,
  user_country text DEFAULT NULL,
  user_postal_code text DEFAULT NULL,
  user_formatted_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow authenticated users to update their own profile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sanitize inputs to prevent injection
  user_name := NULLIF(TRIM(user_name), '');
  user_phone := NULLIF(TRIM(user_phone), '');
  user_address := NULLIF(TRIM(user_address), '');
  user_city := NULLIF(TRIM(user_city), '');
  user_state := NULLIF(TRIM(user_state), '');
  user_country := NULLIF(TRIM(user_country), '');
  user_postal_code := NULLIF(TRIM(user_postal_code), '');
  user_formatted_address := NULLIF(TRIM(user_formatted_address), '');

  -- Update only allowed fields (never user_type or admin fields)
  UPDATE public.users 
  SET 
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    address = COALESCE(user_address, address),
    latitude = COALESCE(user_latitude, latitude),
    longitude = COALESCE(user_longitude, longitude),
    city = COALESCE(user_city, city),
    state = COALESCE(user_state, state),
    country = COALESCE(user_country, country),
    postal_code = COALESCE(user_postal_code, postal_code),
    formatted_address = COALESCE(user_formatted_address, formatted_address),
    updated_at = now()
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;