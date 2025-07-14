-- Create or update the admin user in our users table (skip auth.users for now)
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
  '11111111-1111-1111-1111-111111111111'::uuid,
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
  can_access_contact = true,
  updated_at = now();

-- Add profile_picture_url column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add storage buckets for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile pictures
CREATE POLICY "Users can view all profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);