-- Fix currency and pricing issues
-- First, ensure only NGN currency exists and is active
UPDATE currencies SET is_active = false WHERE code != 'NGN';

-- Make sure NGN currency exists and is properly configured
INSERT INTO currencies (code, name, symbol, is_active, exchange_rate_to_usd)
VALUES ('NGN', 'Nigerian Naira', '₦', true, 1.0)
ON CONFLICT (code) DO UPDATE SET 
  is_active = true,
  name = 'Nigerian Naira',
  symbol = '₦';

-- Remove all pricing plans that are not NGN
DELETE FROM subscription_pricing WHERE currency_code != 'NGN';

-- Ensure we have proper NGN pricing for both provider and seeker
INSERT INTO subscription_pricing (plan, user_type, currency_code, price)
VALUES 
  ('monthly', 'provider', 'NGN', 5000),
  ('semi_annual', 'provider', 'NGN', 25000),
  ('yearly', 'provider', 'NGN', 45000),
  ('monthly', 'seeker', 'NGN', 2000),
  ('semi_annual', 'seeker', 'NGN', 10000),
  ('yearly', 'seeker', 'NGN', 18000)
ON CONFLICT (plan, user_type, currency_code) DO UPDATE SET
  price = EXCLUDED.price;

-- Update all users to use NGN as preferred currency
UPDATE users SET preferred_currency = 'NGN' WHERE preferred_currency != 'NGN' OR preferred_currency IS NULL;