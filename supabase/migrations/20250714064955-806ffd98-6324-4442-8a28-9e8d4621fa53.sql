-- Add DELETE policy for admins on users table
CREATE POLICY "Admins can delete users" 
ON public.users 
FOR DELETE 
USING (is_current_user_admin());