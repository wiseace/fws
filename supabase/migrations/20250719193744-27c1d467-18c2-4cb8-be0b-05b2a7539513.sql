-- Add address field to the users table to store user addresses
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create an index for better performance when searching by address
CREATE INDEX IF NOT EXISTS idx_users_address ON public.users USING btree(address);