-- Add sample categories
INSERT INTO public.categories (name, description, icon) VALUES
('Plumbing', 'Professional plumbing services including repairs, installations, and maintenance', '🔧'),
('Electrical', 'Licensed electrical work including wiring, installations, and repairs', '⚡'),
('Carpentry', 'Custom woodwork, furniture making, and carpentry services', '🔨'),
('Painting', 'Interior and exterior painting services', '🎨'),
('Cleaning', 'Professional cleaning services for homes and offices', '🧽'),
('Gardening', 'Landscaping, garden maintenance, and plant care', '🌱'),
('Roofing', 'Roof repairs, installations, and maintenance', '🏠'),
('HVAC', 'Heating, ventilation, and air conditioning services', '❄️'),
('Tailoring', 'Custom clothing alterations and tailoring services', '✂️'),
('Photography', 'Professional photography services for events and portraits', '📷'),
('Catering', 'Food and beverage services for events', '🍽️'),
('Tutoring', 'Educational tutoring and coaching services', '📚');

-- Add sample verified providers to auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'john.plumber@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "John Smith", "user_type": "provider"}'::jsonb,
  false,
  'authenticated'
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'sarah.electric@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Sarah Johnson", "user_type": "provider"}'::jsonb,
  false,
  'authenticated'
),
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'mike.carpenter@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Mike Wilson", "user_type": "provider"}'::jsonb,
  false,
  'authenticated'
),
(
  '44444444-4444-4444-4444-444444444444'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'emma.painter@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Emma Davis", "user_type": "provider"}'::jsonb,
  false,
  'authenticated'
),
(
  '55555555-5555-5555-5555-555555555555'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'alex.cleaner@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Alex Brown", "user_type": "provider"}'::jsonb,
  false,
  'authenticated'
),
(
  '66666666-6666-6666-6666-666666666666'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'lisa.garden@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Lisa Chen", "user_type": "provider"}'::jsonb,
  false,
  'authenticated'
);

-- Add sample users to public.users table with verified status
INSERT INTO public.users (
  id,
  name,
  email,
  user_type,
  is_verified,
  verification_status,
  subscription_plan,
  can_access_contact,
  subscription_status,
  subscription_expiry
) VALUES 
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'John Smith',
  'john.plumber@example.com',
  'provider',
  true,
  'verified',
  'yearly',
  true,
  'yearly',
  now() + interval '1 year'
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Sarah Johnson',
  'sarah.electric@example.com',
  'provider',
  true,
  'verified',
  'monthly',
  true,
  'monthly',
  now() + interval '1 month'
),
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Mike Wilson',
  'mike.carpenter@example.com',
  'provider',
  true,
  'verified',
  'semi_annual',
  true,
  'semi_annual',
  now() + interval '6 months'
),
(
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Emma Davis',
  'emma.painter@example.com',
  'provider',
  true,
  'verified',
  'yearly',
  true,
  'yearly',
  now() + interval '1 year'
),
(
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Alex Brown',
  'alex.cleaner@example.com',
  'provider',
  true,
  'verified',
  'monthly',
  true,
  'monthly',
  now() + interval '1 month'
),
(
  '66666666-6666-6666-6666-666666666666'::uuid,
  'Lisa Chen',
  'lisa.garden@example.com',
  'provider',
  true,
  'verified',
  'yearly',
  true,
  'yearly',
  now() + interval '1 year'
);

-- Add sample services
INSERT INTO public.services (
  id,
  user_id,
  service_name,
  category,
  description,
  location,
  contact_info,
  image_url,
  is_active
) VALUES 
(
  'a1111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Professional Plumbing Services',
  'Plumbing',
  'Expert plumbing services including pipe repairs, drain cleaning, and fixture installations. 15+ years of experience.',
  'Downtown, New York',
  '{"phone": "+1-555-0101", "email": "john.plumber@example.com"}'::jsonb,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  true
),
(
  'a2222222-2222-2222-2222-222222222222'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Licensed Electrical Work',
  'Electrical',
  'Certified electrician providing safe and reliable electrical installations, repairs, and upgrades.',
  'Brooklyn, New York',
  '{"phone": "+1-555-0202", "email": "sarah.electric@example.com"}'::jsonb,
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop',
  true
),
(
  'a3333333-3333-3333-3333-333333333333'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Custom Carpentry & Woodwork',
  'Carpentry',
  'Handcrafted furniture, custom cabinets, and precision carpentry work. Quality craftsmanship guaranteed.',
  'Queens, New York',
  '{"phone": "+1-555-0303", "email": "mike.carpenter@example.com"}'::jsonb,
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  true
),
(
  'a4444444-4444-4444-4444-444444444444'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Interior & Exterior Painting',
  'Painting',
  'Professional painting services for residential and commercial properties. Premium quality paints and finishes.',
  'Manhattan, New York',
  '{"phone": "+1-555-0404", "email": "emma.painter@example.com"}'::jsonb,
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop',
  true
),
(
  'a5555555-5555-5555-5555-555555555555'::uuid,
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Deep Cleaning Services',
  'Cleaning',
  'Thorough cleaning services for homes and offices. Eco-friendly products and flexible scheduling.',
  'Bronx, New York',
  '{"phone": "+1-555-0505", "email": "alex.cleaner@example.com"}'::jsonb,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  true
),
(
  'a6666666-6666-6666-6666-666666666666'::uuid,
  '66666666-6666-6666-6666-666666666666'::uuid,
  'Garden Design & Maintenance',
  'Gardening',
  'Professional landscaping, garden design, and ongoing maintenance services. Transform your outdoor space.',
  'Staten Island, New York',
  '{"phone": "+1-555-0606", "email": "lisa.garden@example.com"}'::jsonb,
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  true
);

-- Add sample verification requests
INSERT INTO public.verification_requests (
  id,
  user_id,
  full_name,
  phone_number,
  additional_info,
  status,
  submitted_at
) VALUES 
(
  'v1111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'John Smith',
  '+1-555-0101',
  'Licensed plumber with 15+ years experience. Available for emergency calls.',
  'pending',
  now() - interval '2 days'
),
(
  'v2222222-2222-2222-2222-222222222222'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Sarah Johnson',
  '+1-555-0202',
  'Certified electrician specializing in residential and commercial electrical work.',
  'pending',
  now() - interval '1 day'
),
(
  'v3333333-3333-3333-3333-333333333333'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Mike Wilson',
  '+1-555-0303',
  'Master carpenter with expertise in custom furniture and cabinet making.',
  'pending',
  now() - interval '3 hours'
);