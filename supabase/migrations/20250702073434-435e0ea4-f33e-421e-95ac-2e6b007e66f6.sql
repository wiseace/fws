-- Add sample services only (skipping categories that already exist)
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
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Professional Plumbing Services',
  'Plumbing',
  'Expert plumbing services including pipe repairs, drain cleaning, and fixture installations. 15+ years of experience.',
  'Downtown, New York',
  '{"phone": "+1-555-0101", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  true
),
(
  'a2222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Licensed Electrical Work',
  'Electrical',
  'Certified electrician providing safe and reliable electrical installations, repairs, and upgrades.',
  'Brooklyn, New York',
  '{"phone": "+1-555-0202", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop',
  true
),
(
  'a3333333-3333-3333-3333-333333333333'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Custom Carpentry & Woodwork',
  'Carpentry',
  'Handcrafted furniture, custom cabinets, and precision carpentry work. Quality craftsmanship guaranteed.',
  'Queens, New York',
  '{"phone": "+1-555-0303", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  true
),
(
  'a4444444-4444-4444-4444-444444444444'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Interior & Exterior Painting',
  'Painting',
  'Professional painting services for residential and commercial properties. Premium quality paints and finishes.',
  'Manhattan, New York',
  '{"phone": "+1-555-0404", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop',
  true
),
(
  'a5555555-5555-5555-5555-555555555555'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Deep Cleaning Services',
  'Cleaning',
  'Thorough cleaning services for homes and offices. Eco-friendly products and flexible scheduling.',
  'Bronx, New York',
  '{"phone": "+1-555-0505", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  true
),
(
  'a6666666-6666-6666-6666-666666666666'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Garden Design & Maintenance',
  'Gardening',
  'Professional landscaping, garden design, and ongoing maintenance services. Transform your outdoor space.',
  'Staten Island, New York',
  '{"phone": "+1-555-0606", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  true
),
(
  'a7777777-7777-7777-7777-777777777777'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Roof Repair & Installation',
  'Roofing',
  'Professional roofing services including repairs, replacements, and new installations. Weather-resistant solutions.',
  'Manhattan, New York',
  '{"phone": "+1-555-0707", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
  true
),
(
  'a8888888-8888-8888-8888-888888888888'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HVAC Installation & Repair',
  'HVAC',
  'Heating, ventilation, and air conditioning services. Energy-efficient solutions for home and business.',
  'Brooklyn, New York',
  '{"phone": "+1-555-0808", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  true
),
(
  'a9999999-9999-9999-9999-999999999999'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Custom Tailoring Services',
  'Tailoring',
  'Expert tailoring and alterations for all clothing types. Perfect fit guaranteed with attention to detail.',
  'Queens, New York',
  '{"phone": "+1-555-0909", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop',
  true
),
(
  'b1111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Professional Photography',
  'Photography',
  'Event photography, portraits, and commercial shoots. Capturing your precious moments with artistic flair.',
  'Manhattan, New York',
  '{"phone": "+1-555-1010", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop',
  true
),
(
  'b2222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Event Catering Services',
  'Catering',
  'Full-service catering for weddings, corporate events, and private parties. Delicious food, impeccable service.',
  'Bronx, New York',
  '{"phone": "+1-555-1111", "email": "admin@findwho.com"}'::jsonb,
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
  true
);

-- Add some sample verification requests for pending approvals
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
  '00000000-0000-0000-0000-000000000001'::uuid,
  'John Smith',
  '+1-555-0101',
  'Licensed plumber with 15+ years experience. Available for emergency calls.',
  'pending',
  now() - interval '2 days'
),
(
  'v2222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Sarah Johnson',
  '+1-555-0202',
  'Certified electrician specializing in residential and commercial electrical work.',
  'pending',
  now() - interval '1 day'
),
(
  'v3333333-3333-3333-3333-333333333333'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Mike Wilson',
  '+1-555-0303',
  'Master carpenter with expertise in custom furniture and cabinet making.',
  'pending',
  now() - interval '3 hours'
);