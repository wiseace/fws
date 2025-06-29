
-- Create custom types
CREATE TYPE user_type AS ENUM ('provider', 'seeker');
CREATE TYPE subscription_status AS ENUM ('free', 'monthly', 'semi_annual', 'yearly');

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  user_type user_type NOT NULL DEFAULT 'seeker',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  subscription_status subscription_status NOT NULL DEFAULT 'free',
  subscription_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  contact_info JSONB NOT NULL DEFAULT '{}', -- Store phone/email as JSON
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for services table
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own services" ON public.services
  FOR ALL USING (auth.uid() = user_id);

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'seeker')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user can access contact info
CREATE OR REPLACE FUNCTION public.can_access_contact_info(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND is_verified = true 
        AND subscription_status != 'free'
        AND (subscription_expiry IS NULL OR subscription_expiry > now())
      )
    END;
$$;

-- Create categories table for better organization
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name, description, icon) VALUES
  ('Plumbing', 'Water systems, pipes, and fixtures', 'wrench'),
  ('Electrical', 'Wiring, lighting, and electrical repairs', 'zap'),
  ('Carpentry', 'Woodworking and furniture repair', 'hammer'),
  ('Painting', 'Interior and exterior painting services', 'brush'),
  ('Cleaning', 'Home and office cleaning services', 'sparkles'),
  ('Gardening', 'Landscaping and garden maintenance', 'flower'),
  ('Automotive', 'Car repair and maintenance', 'car'),
  ('Technology', 'Computer and device repairs', 'laptop'),
  ('Beauty', 'Hair, makeup, and beauty services', 'scissors'),
  ('Tutoring', 'Educational and skill training', 'book');

-- Enable realtime for live updates
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
