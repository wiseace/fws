-- Delete existing dummy data first
DELETE FROM public.contact_requests;
DELETE FROM public.verification_requests;
DELETE FROM public.services WHERE service_name LIKE '%Test%' OR service_name LIKE '%Sample%' OR service_name ILIKE '%plumbing%' OR service_name ILIKE '%electrical%';

-- Insert 6 real categories
INSERT INTO public.categories (name, description, icon) VALUES
('Plumbing', 'Professional plumbing services including repairs, installations, and maintenance', 'wrench'),
('Tech Repair', 'Computer, phone, and electronics repair services', 'smartphone'),
('Tailoring', 'Custom clothing alterations and tailoring services', 'scissors'),
('Cleaning', 'Professional house and office cleaning services', 'spray-bottle'),
('Gardening', 'Landscaping, garden design, and maintenance services', 'leaf'),
('Electrical', 'Licensed electrical work and installations', 'zap')
ON CONFLICT (name) DO NOTHING;