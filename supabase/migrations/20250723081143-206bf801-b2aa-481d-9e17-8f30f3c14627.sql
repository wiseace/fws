-- Reset all users to free plan and fix payment_attempts RLS
UPDATE public.users 
SET 
  subscription_plan = 'free',
  subscription_status = 'free',
  subscription_expiry = NULL
WHERE subscription_plan != 'free';

-- Fix payment_attempts RLS policy to allow user insertions
DROP POLICY IF EXISTS "Users can insert their own payment attempts" ON public.payment_attempts;

CREATE POLICY "Users can insert their own payment attempts" 
ON public.payment_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);