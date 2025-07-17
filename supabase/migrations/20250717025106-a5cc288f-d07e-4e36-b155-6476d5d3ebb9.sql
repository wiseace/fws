-- Add profile_image_url column to users table
ALTER TABLE public.users 
ADD COLUMN profile_image_url TEXT;