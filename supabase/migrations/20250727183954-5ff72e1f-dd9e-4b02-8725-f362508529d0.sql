-- Fix handle_new_user function to support phone-based anonymous users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.users (
    id, 
    name, 
    email, 
    phone,
    user_type,
    phone_verified
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    -- For anonymous users with phone, create a dummy email
    COALESCE(
      NEW.email, 
      CASE 
        WHEN NEW.raw_user_meta_data->>'phone' IS NOT NULL 
        THEN 'phone_' || REPLACE(NEW.raw_user_meta_data->>'phone', '+', '') || '@phoneauth.local'
        ELSE 'user_' || NEW.id::text || '@anonymous.local'
      END
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'seeker'),
    COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, false)
  ) ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', users.name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', users.phone),
    user_type = COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, users.user_type),
    phone_verified = COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, users.phone_verified);
  RETURN NEW;
END;
$function$