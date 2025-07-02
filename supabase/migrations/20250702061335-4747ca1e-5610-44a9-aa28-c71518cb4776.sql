
-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('not_verified', 'pending', 'verified', 'rejected');

-- Create subscription plan enum  
CREATE TYPE subscription_plan AS ENUM ('free', 'monthly', 'semi_annual', 'yearly');

-- Update users table with new fields
ALTER TABLE public.users 
ADD COLUMN verification_status verification_status DEFAULT 'not_verified',
ADD COLUMN verification_documents JSONB DEFAULT '{}',
ADD COLUMN subscription_plan subscription_plan DEFAULT 'free',
ADD COLUMN can_access_contact BOOLEAN DEFAULT false;

-- Create verification_requests table
CREATE TABLE public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    id_document_url TEXT,
    skill_proof_url TEXT,
    additional_info TEXT,
    status verification_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(id),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contact_requests table
CREATE TABLE public.contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    message TEXT,
    contact_method TEXT CHECK (contact_method IN ('phone', 'email', 'message')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification_requests
CREATE POLICY "Users can view their own verification requests" ON public.verification_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own verification requests" ON public.verification_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all verification requests" ON public.verification_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
    );

CREATE POLICY "Admins can update verification requests" ON public.verification_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
    );

-- RLS policies for contact_requests
CREATE POLICY "Users can view their own contact requests" ON public.contact_requests
    FOR SELECT USING (seeker_id = auth.uid() OR provider_id = auth.uid());

CREATE POLICY "Verified subscribers can create contact requests" ON public.contact_requests
    FOR INSERT WITH CHECK (
        seeker_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND verification_status = 'verified' 
            AND subscription_plan != 'free'
        )
    );

-- Add sample categories
INSERT INTO public.categories (name, description, icon) VALUES
    ('Plumbing', 'Professional plumbing services', '🔧'),
    ('Electrical', 'Electrical installation and repair', '⚡'),
    ('Carpentry', 'Wood work and furniture making', '🔨'),
    ('Painting', 'Interior and exterior painting', '🎨'),
    ('Cleaning', 'House and office cleaning services', '🧹'),
    ('Gardening', 'Landscaping and garden maintenance', '🌱'),
    ('Tailoring', 'Custom clothing and alterations', '✂️'),
    ('Catering', 'Event catering and cooking services', '🍽️'),
    ('Photography', 'Event and portrait photography', '📸'),
    ('Tutoring', 'Academic and skill tutoring', '📚')
ON CONFLICT (name) DO NOTHING;

-- Functions
CREATE OR REPLACE FUNCTION public.can_access_contact_info(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND verification_status = 'verified'
        AND subscription_plan != 'free'
        AND (subscription_expiry IS NULL OR subscription_expiry > now())
      )
    END;
$$;

CREATE OR REPLACE FUNCTION public.update_verification_status(
    request_id uuid,
    new_status verification_status,
    notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin') THEN
        RAISE EXCEPTION 'Only admins can update verification status';
    END IF;
    
    UPDATE public.verification_requests 
    SET 
        status = new_status,
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        review_notes = notes,
        updated_at = now()
    WHERE id = request_id;
    
    UPDATE public.users 
    SET verification_status = new_status
    WHERE id = (SELECT user_id FROM public.verification_requests WHERE id = request_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.users),
        'verified_users', (SELECT COUNT(*) FROM public.users WHERE verification_status = 'verified'),
        'pending_verifications', (SELECT COUNT(*) FROM public.verification_requests WHERE status = 'pending'),
        'active_subscriptions', (SELECT COUNT(*) FROM public.users WHERE subscription_plan != 'free'),
        'total_services', (SELECT COUNT(*) FROM public.services),
        'total_categories', (SELECT COUNT(*) FROM public.categories)
    );
$$;
