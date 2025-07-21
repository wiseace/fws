-- Add phone number authentication support
ALTER TABLE public.users 
ADD COLUMN phone_verified boolean DEFAULT false,
ADD COLUMN phone_verification_code text,
ADD COLUMN phone_verification_expires timestamp with time zone,
ADD COLUMN preferred_currency text DEFAULT 'NGN';

-- Add currency support to subscription plans
CREATE TABLE public.currencies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  symbol text NOT NULL,
  exchange_rate_to_usd numeric DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert African currencies
INSERT INTO public.currencies (code, name, symbol, exchange_rate_to_usd, is_active) VALUES
('NGN', 'Nigerian Naira', '₦', 0.0012, true),
('GHS', 'Ghanaian Cedi', '₵', 0.082, true),
('KES', 'Kenyan Shilling', 'KSh', 0.0077, true),
('ZAR', 'South African Rand', 'R', 0.055, true),
('EGP', 'Egyptian Pound', '£', 0.020, true),
('MAD', 'Moroccan Dirham', 'DH', 0.099, true),
('TZS', 'Tanzanian Shilling', 'TSh', 0.00037, true),
('UGX', 'Ugandan Shilling', 'USh', 0.00027, true),
('ETB', 'Ethiopian Birr', 'Br', 0.0082, true),
('XAF', 'Central African CFA Franc', 'FCFA', 0.0016, true);

-- Add currency-specific pricing
CREATE TABLE public.subscription_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan text NOT NULL,
  currency_code text NOT NULL REFERENCES public.currencies(code),
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(plan, currency_code)
);

-- Insert pricing for different plans and currencies
INSERT INTO public.subscription_pricing (plan, currency_code, price) VALUES
-- Monthly plan pricing
('monthly', 'NGN', 15000),
('monthly', 'GHS', 120),
('monthly', 'KES', 1300),
('monthly', 'ZAR', 180),
('monthly', 'EGP', 500),
('monthly', 'MAD', 100),
('monthly', 'TZS', 27000),
('monthly', 'UGX', 37000),
('monthly', 'ETB', 120),
('monthly', 'XAF', 6000),

-- Semi-annual plan pricing (10% discount)
('semi_annual', 'NGN', 81000),
('semi_annual', 'GHS', 648),
('semi_annual', 'KES', 7020),
('semi_annual', 'ZAR', 972),
('semi_annual', 'EGP', 2700),
('semi_annual', 'MAD', 540),
('semi_annual', 'TZS', 145800),
('semi_annual', 'UGX', 199800),
('semi_annual', 'ETB', 648),
('semi_annual', 'XAF', 32400),

-- Yearly plan pricing (15% discount)
('yearly', 'NGN', 153000),
('yearly', 'GHS', 1224),
('yearly', 'KES', 13260),
('yearly', 'ZAR', 1836),
('yearly', 'EGP', 5100),
('yearly', 'MAD', 1020),
('yearly', 'TZS', 275400),
('yearly', 'UGX', 377400),
('yearly', 'ETB', 1224),
('yearly', 'XAF', 61200);

-- Enable RLS on new tables
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for currencies (public read)
CREATE POLICY "Anyone can view active currencies"
ON public.currencies FOR SELECT
USING (is_active = true);

-- Create policies for subscription pricing (public read)
CREATE POLICY "Anyone can view subscription pricing"
ON public.subscription_pricing FOR SELECT
USING (true);

-- Admin policies for currency management
CREATE POLICY "Admins can manage currencies"
ON public.currencies FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can manage pricing"
ON public.subscription_pricing FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Function to get pricing for a plan in user's preferred currency
CREATE OR REPLACE FUNCTION public.get_plan_price(plan_name text, currency_code text DEFAULT 'NGN')
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT price FROM public.subscription_pricing 
  WHERE plan = plan_name AND currency_code = get_plan_price.currency_code
  LIMIT 1;
$$;