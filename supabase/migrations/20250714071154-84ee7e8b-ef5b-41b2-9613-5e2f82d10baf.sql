-- Update the delete_user_and_related_data function to also delete from auth.users
CREATE OR REPLACE FUNCTION public.delete_user_and_related_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT is_current_user_admin() THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;
    
    -- Delete related data in the correct order to avoid foreign key conflicts
    
    -- Delete contact requests where user is either seeker or provider
    DELETE FROM public.contact_requests 
    WHERE seeker_id = target_user_id OR provider_id = target_user_id;
    
    -- Delete verification requests
    DELETE FROM public.verification_requests 
    WHERE user_id = target_user_id;
    
    -- Delete services owned by the user
    DELETE FROM public.services 
    WHERE user_id = target_user_id;
    
    -- Delete from public.users table
    DELETE FROM public.users 
    WHERE id = target_user_id;
    
    -- Delete from auth.users table (this prevents login)
    DELETE FROM auth.users 
    WHERE id = target_user_id;
    
    -- Log the deletion
    RAISE NOTICE 'User % and all related data have been deleted from both public and auth tables', target_user_id;
END;
$$;

-- Enable realtime for all relevant tables
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.verification_requests REPLICA IDENTITY FULL;
ALTER TABLE public.contact_requests REPLICA IDENTITY FULL;

-- Add only new tables to realtime publication (users is already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_requests;