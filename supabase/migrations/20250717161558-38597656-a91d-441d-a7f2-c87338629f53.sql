
-- Add new columns to users table for enhanced provider information
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS service_location TEXT,
ADD COLUMN IF NOT EXISTS city_or_state TEXT,
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS price_range_min DECIMAL,
ADD COLUMN IF NOT EXISTS price_range_max DECIMAL,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add new columns to services table for better search
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS price_range_min DECIMAL,
ADD COLUMN IF NOT EXISTS price_range_max DECIMAL,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_skills ON public.users USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_users_tags ON public.users USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_users_service_location ON public.users(service_location);
CREATE INDEX IF NOT EXISTS idx_users_city_or_state ON public.users(city_or_state);
CREATE INDEX IF NOT EXISTS idx_services_skills ON public.services USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_services_tags ON public.services USING GIN(tags);

-- Create a function for smart search matching
CREATE OR REPLACE FUNCTION public.smart_search_providers(
  search_term TEXT DEFAULT '',
  search_location TEXT DEFAULT '',
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  availability_only BOOLEAN DEFAULT FALSE,
  user_lat DECIMAL DEFAULT NULL,
  user_lng DECIMAL DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  profile_image_url TEXT,
  skills TEXT[],
  tags TEXT[],
  service_location TEXT,
  city_or_state TEXT,
  availability_status TEXT,
  price_range_min DECIMAL,
  price_range_max DECIMAL,
  last_active TIMESTAMP WITH TIME ZONE,
  service_id UUID,
  service_name TEXT,
  service_description TEXT,
  service_category TEXT,
  service_price_min DECIMAL,
  service_price_max DECIMAL,
  match_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
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
$$;
