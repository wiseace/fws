-- Update smart_search_providers function to show providers to unsubscribed seekers
-- but maintain contact info restrictions
CREATE OR REPLACE FUNCTION public.smart_search_providers(
  search_term text DEFAULT ''::text, 
  search_location text DEFAULT ''::text, 
  min_price numeric DEFAULT NULL::numeric, 
  max_price numeric DEFAULT NULL::numeric, 
  availability_only boolean DEFAULT false, 
  user_lat numeric DEFAULT NULL::numeric, 
  user_lng numeric DEFAULT NULL::numeric
)
RETURNS TABLE(
  user_id uuid, 
  name text, 
  email text, 
  phone text, 
  profile_image_url text, 
  skills text[], 
  tags text[], 
  service_location text, 
  city_or_state text, 
  availability_status text, 
  price_range_min numeric, 
  price_range_max numeric, 
  last_active timestamp with time zone, 
  service_id uuid, 
  service_name text, 
  service_description text, 
  service_category text, 
  service_price_min numeric, 
  service_price_max numeric, 
  match_score integer
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.phone,
    u.profile_image_url,
    u.skills,
    u.tags,
    u.service_location,
    u.city_or_state,
    u.availability_status,
    u.price_range_min,
    u.price_range_max,
    u.last_active,
    s.id as service_id,
    s.service_name,
    s.description as service_description,
    s.category as service_category,
    s.price_range_min as service_price_min,
    s.price_range_max as service_price_max,
    -- Calculate match score based on multiple factors
    (
      CASE WHEN search_term = '' THEN 50
           WHEN LOWER(s.service_name) ILIKE '%' || LOWER(search_term) || '%' THEN 100
           WHEN LOWER(s.description) ILIKE '%' || LOWER(search_term) || '%' THEN 80
           WHEN LOWER(s.category) ILIKE '%' || LOWER(search_term) || '%' THEN 70
           WHEN u.skills && STRING_TO_ARRAY(LOWER(search_term), ' ') THEN 90
           WHEN u.tags && STRING_TO_ARRAY(LOWER(search_term), ' ') THEN 85
           ELSE 0
      END +
      CASE WHEN search_location = '' THEN 25
           WHEN LOWER(u.service_location) ILIKE '%' || LOWER(search_location) || '%' THEN 50
           WHEN LOWER(u.city_or_state) ILIKE '%' || LOWER(search_location) || '%' THEN 45
           WHEN LOWER(s.location) ILIKE '%' || LOWER(search_location) || '%' THEN 40
           ELSE 0
      END
    ) as match_score
  FROM public.users u
  INNER JOIN public.services s ON u.id = s.user_id
  WHERE 
    u.user_type = 'provider'
    AND u.is_verified = true
    AND u.verification_status = 'verified'
    -- Removed subscription requirement - show all verified providers
    AND s.is_active = true
    AND (
      search_term = '' OR
      LOWER(s.service_name) ILIKE '%' || LOWER(search_term) || '%' OR
      LOWER(s.description) ILIKE '%' || LOWER(search_term) || '%' OR
      LOWER(s.category) ILIKE '%' || LOWER(search_term) || '%' OR
      u.skills && STRING_TO_ARRAY(LOWER(search_term), ' ') OR
      u.tags && STRING_TO_ARRAY(LOWER(search_term), ' ')
    )
    AND (
      search_location = '' OR
      LOWER(u.service_location) ILIKE '%' || LOWER(search_location) || '%' OR
      LOWER(u.city_or_state) ILIKE '%' || LOWER(search_location) || '%' OR
      LOWER(s.location) ILIKE '%' || LOWER(search_location) || '%'
    )
    AND (min_price IS NULL OR s.price_range_min >= min_price OR u.price_range_min >= min_price)
    AND (max_price IS NULL OR s.price_range_max <= max_price OR u.price_range_max <= max_price)
    AND (NOT availability_only OR u.availability_status = 'available')
  ORDER BY 
    match_score DESC,
    u.last_active DESC NULLS LAST,
    s.created_at DESC;
END;
$function$

-- Also update the services RLS policy to allow viewing all active services
DROP POLICY IF EXISTS "Anyone can view services" ON services;
CREATE POLICY "Anyone can view services" 
ON services FOR SELECT 
USING (is_active = true);