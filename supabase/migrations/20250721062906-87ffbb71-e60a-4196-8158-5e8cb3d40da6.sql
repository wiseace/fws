-- Create payment attempts table for tracking
CREATE TABLE public.payment_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tx_ref text NOT NULL UNIQUE,
  transaction_id text,
  plan text NOT NULL,
  currency text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_link text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment attempts"
ON public.payment_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment attempts"
ON public.payment_attempts FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());