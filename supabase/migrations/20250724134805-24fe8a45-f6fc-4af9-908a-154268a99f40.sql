-- Create phone_verifications table for temporary phone verification storage
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index on phone to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_verifications_phone ON public.phone_verifications(phone);

-- Enable RLS
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow the function to access this table
CREATE POLICY "Service role can manage phone verifications" 
ON public.phone_verifications 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);