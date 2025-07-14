-- Create a comprehensive user deletion function that cleans up all related data
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
    
    -- Finally delete the user
    DELETE FROM public.users 
    WHERE id = target_user_id;
    
    -- Log the deletion (optional)
    RAISE NOTICE 'User % and all related data have been deleted', target_user_id;
END;
$$;