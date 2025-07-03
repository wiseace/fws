-- Add some default categories for the service providers to use
INSERT INTO public.categories (name, description, icon) VALUES
('Home Services', 'Services for home maintenance, repair, and improvement', 'home'),
('Technology', 'IT services, web development, and technical support', 'laptop'),
('Education', 'Tutoring, training, and educational services', 'book'),
('Health & Wellness', 'Health, fitness, and wellness services', 'heart'),
('Professional Services', 'Legal, financial, and business consulting', 'briefcase'),
('Creative Services', 'Design, photography, and creative work', 'palette'),
('Transportation', 'Moving, delivery, and transportation services', 'truck'),
('Events & Entertainment', 'Event planning, entertainment, and catering', 'calendar'),
('Beauty & Personal Care', 'Beauty, grooming, and personal care services', 'scissors'),
('Automotive', 'Car repair, maintenance, and automotive services', 'car')
ON CONFLICT (name) DO NOTHING;