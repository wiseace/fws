-- Update existing admin user or insert new one
DO $$
BEGIN
    -- Try to update existing admin user
    UPDATE public.users SET
        user_type = 'admin',
        is_verified = true,
        verification_status = 'verified',
        subscription_plan = 'yearly',
        can_access_contact = true
    WHERE email = 'hi@ariyo.dev';
    
    -- If no existing user, insert new one
    IF NOT FOUND THEN
        INSERT INTO public.users (
            id,
            name,
            email,
            user_type,
            is_verified,
            verification_status,
            subscription_plan,
            can_access_contact
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            'Admin User',
            'hi@ariyo.dev',
            'admin',
            true,
            'verified',
            'yearly',
            true
        );
    END IF;
END $$;

-- Delete existing dummy data
DELETE FROM public.services WHERE service_name LIKE '%Test%' OR service_name LIKE '%Sample%';
DELETE FROM public.users WHERE email LIKE '%test%' OR email LIKE '%sample%';

-- Insert 6 real categories
INSERT INTO public.categories (name, description, icon) VALUES
('Plumbing', 'Professional plumbing services including repairs, installations, and maintenance', 'wrench'),
('Tech Repair', 'Computer, phone, and electronics repair services', 'smartphone'),
('Tailoring', 'Custom clothing alterations and tailoring services', 'scissors'),
('Cleaning', 'Professional house and office cleaning services', 'spray-bottle'),
('Gardening', 'Landscaping, garden design, and maintenance services', 'leaf'),
('Electrical', 'Licensed electrical work and installations', 'zap')
ON CONFLICT (name) DO NOTHING;

-- Insert 12 real service provider users (check existence first)
DO $$
DECLARE
    provider_data RECORD;
    provider_list CURSOR FOR 
        SELECT * FROM (VALUES
            ('11111111-1111-1111-1111-111111111111'::uuid, 'John Smith', 'john.plumber@findwho.com', '+1-555-0101'),
            ('22222222-2222-2222-2222-222222222222'::uuid, 'Sarah Tech', 'sarah.tech@findwho.com', '+1-555-0102'),
            ('33333333-3333-3333-3333-333333333333'::uuid, 'Mike Tailor', 'mike.tailor@findwho.com', '+1-555-0103'),
            ('44444444-4444-4444-4444-444444444444'::uuid, 'Lisa Clean', 'lisa.clean@findwho.com', '+1-555-0104'),
            ('55555555-5555-5555-5555-555555555555'::uuid, 'Tom Garden', 'tom.garden@findwho.com', '+1-555-0105'),
            ('66666666-6666-6666-6666-666666666666'::uuid, 'Anna Electric', 'anna.electric@findwho.com', '+1-555-0106'),
            ('77777777-7777-7777-7777-777777777777'::uuid, 'David Plumber', 'david.plumber@findwho.com', '+1-555-0107'),
            ('88888888-8888-8888-8888-888888888888'::uuid, 'Emma Repair', 'emma.repair@findwho.com', '+1-555-0108'),
            ('99999999-9999-9999-9999-999999999999'::uuid, 'Chris Style', 'chris.style@findwho.com', '+1-555-0109'),
            ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Maria Clean', 'maria.clean@findwho.com', '+1-555-0110'),
            ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'James Green', 'james.green@findwho.com', '+1-555-0111'),
            ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'Sophie Electric', 'sophie.electric@findwho.com', '+1-555-0112')
        ) AS providers(id, name, email, phone);
BEGIN
    FOR provider_data IN provider_list LOOP
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = provider_data.email) THEN
            INSERT INTO public.users (
                id, name, email, user_type, is_verified, verification_status, 
                subscription_plan, can_access_contact, phone
            ) VALUES (
                provider_data.id, 
                provider_data.name, 
                provider_data.email, 
                'provider', 
                true, 
                'verified', 
                'monthly', 
                true, 
                provider_data.phone
            );
        END IF;
    END LOOP;
END $$;

-- Insert 12 real services mapped to providers
INSERT INTO public.services (
  id, user_id, service_name, category, description, location, 
  contact_info, image_url, is_active
) VALUES 
  ('s1111111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Expert Plumbing Solutions', 'Plumbing', 'Professional plumbing services with 15+ years experience. Emergency repairs, installations, and maintenance.', 'Downtown, New York', '{"phone": "+1-555-0101", "email": "john.plumber@findwho.com"}', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', true),
  ('s2222222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Tech Repair Pro', 'Tech Repair', 'Computer, smartphone, and electronics repair. Quick diagnostics and affordable solutions.', 'Brooklyn, New York', '{"phone": "+1-555-0102", "email": "sarah.tech@findwho.com"}', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop', true),
  ('s3333333-3333-3333-3333-333333333333'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'Custom Tailoring Studio', 'Tailoring', 'Bespoke tailoring and alterations. Perfect fit guaranteed with premium fabrics and craftsmanship.', 'Manhattan, New York', '{"phone": "+1-555-0103", "email": "mike.tailor@findwho.com"}', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop', true),
  ('s4444444-4444-4444-4444-444444444444'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Spotless Cleaning Service', 'Cleaning', 'Deep cleaning for homes and offices. Eco-friendly products and flexible scheduling options.', 'Queens, New York', '{"phone": "+1-555-0104", "email": "lisa.clean@findwho.com"}', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop', true),
  ('s5555555-5555-5555-5555-555555555555'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'Garden Paradise Design', 'Gardening', 'Landscape design, garden maintenance, and outdoor space transformation services.', 'Bronx, New York', '{"phone": "+1-555-0105", "email": "tom.garden@findwho.com"}', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', true),
  ('s6666666-6666-6666-6666-666666666666'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 'PowerLine Electrical', 'Electrical', 'Licensed electrical contractor. Residential and commercial electrical installations and repairs.', 'Staten Island, New York', '{"phone": "+1-555-0106", "email": "anna.electric@findwho.com"}', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop', true),
  ('s7777777-7777-7777-7777-777777777777'::uuid, '77777777-7777-7777-7777-777777777777'::uuid, 'Reliable Plumbing Co', 'Plumbing', '24/7 emergency plumbing service. Drain cleaning, pipe repair, and fixture installation.', 'Long Island, New York', '{"phone": "+1-555-0107", "email": "david.plumber@findwho.com"}', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', true),
  ('s8888888-8888-8888-8888-888888888888'::uuid, '88888888-8888-8888-8888-888888888888'::uuid, 'Quick Fix Tech', 'Tech Repair', 'Same-day tech repair service. Laptops, tablets, gaming consoles, and smart devices.', 'Jersey City, New Jersey', '{"phone": "+1-555-0108", "email": "emma.repair@findwho.com"}', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop', true),
  ('s9999999-9999-9999-9999-999999999999'::uuid, '99999999-9999-9999-9999-999999999999'::uuid, 'Elite Tailoring Services', 'Tailoring', 'Premium tailoring for business and formal wear. Same-day alterations available.', 'Hoboken, New Jersey', '{"phone": "+1-555-0109", "email": "chris.style@findwho.com"}', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop', true),
  ('saaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Crystal Clean Pro', 'Cleaning', 'Professional cleaning service for residential and commercial properties. Insured and bonded.', 'Newark, New Jersey', '{"phone": "+1-555-0110", "email": "maria.clean@findwho.com"}', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop', true),
  ('sbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Green Thumb Landscaping', 'Gardening', 'Full-service landscaping company. Design, installation, and maintenance of beautiful outdoor spaces.', 'White Plains, New York', '{"phone": "+1-555-0111", "email": "james.green@findwho.com"}', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', true),
  ('scccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'Bright Spark Electric', 'Electrical', 'Certified electricians providing safe and reliable electrical solutions for homes and businesses.', 'Yonkers, New York', '{"phone": "+1-555-0112", "email": "sophie.electric@findwho.com"}', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample verification requests
INSERT INTO public.verification_requests (
  id, user_id, full_name, phone_number, additional_info, status, submitted_at
) VALUES 
  ('v1111111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'John Smith', '+1-555-0101', 'Licensed plumber with 15+ years experience', 'pending', now() - interval '2 days'),
  ('v2222222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Sarah Tech', '+1-555-0102', 'Certified tech repair specialist', 'pending', now() - interval '1 day'),
  ('v3333333-3333-3333-3333-333333333333'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'Mike Tailor', '+1-555-0103', 'Master tailor with fashion design background', 'pending', now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert sample contact requests
INSERT INTO public.contact_requests (
  id, seeker_id, provider_id, service_id, contact_method, message
) VALUES 
  ('c1111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 's1111111-1111-1111-1111-111111111111'::uuid, 'phone', 'Need urgent plumbing repair for kitchen sink'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 's2222222-2222-2222-2222-222222222222'::uuid, 'email', 'Laptop screen repair needed')
ON CONFLICT (id) DO NOTHING;