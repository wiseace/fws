-- First ensure we have the required currencies
INSERT INTO public.currencies (code, name, symbol, is_active) VALUES
('USD', 'US Dollar', '$', true),
('GBP', 'British Pound', '£', true),
('EUR', 'Euro', '€', true)
ON CONFLICT (code) DO NOTHING;

-- Add user_type column to subscription_pricing table to separate plans for providers and seekers
ALTER TABLE public.subscription_pricing 
ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'provider';

-- Update existing pricing to be for providers (default)
UPDATE public.subscription_pricing 
SET user_type = 'provider' 
WHERE user_type IS NULL;

-- Make user_type NOT NULL after setting defaults
ALTER TABLE public.subscription_pricing 
ALTER COLUMN user_type SET NOT NULL;

-- Drop existing constraint if it exists
ALTER TABLE public.subscription_pricing 
DROP CONSTRAINT IF EXISTS subscription_pricing_plan_currency_code_key;

-- Add new unique constraint including user_type
ALTER TABLE public.subscription_pricing 
ADD CONSTRAINT unique_plan_currency_usertype UNIQUE (plan, currency_code, user_type);

-- Insert default seeker pricing (lower prices than providers)
INSERT INTO public.subscription_pricing (plan, currency_code, price, user_type) VALUES
('monthly', 'NGN', 5000, 'seeker'),
('semi_annual', 'NGN', 25000, 'seeker'),
('yearly', 'NGN', 45000, 'seeker'),
('monthly', 'USD', 12, 'seeker'),
('semi_annual', 'USD', 60, 'seeker'),
('yearly', 'USD', 108, 'seeker'),
('monthly', 'GBP', 10, 'seeker'),
('semi_annual', 'GBP', 50, 'seeker'),
('yearly', 'GBP', 90, 'seeker'),
('monthly', 'EUR', 11, 'seeker'),
('semi_annual', 'EUR', 55, 'seeker'),
('yearly', 'EUR', 99, 'seeker')
ON CONFLICT (plan, currency_code, user_type) DO NOTHING;