-- Add RLS policies for categories table
-- Allow anyone to view categories (needed for providers to see available categories)
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- Allow admins to manage categories (insert, update, delete)
CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());