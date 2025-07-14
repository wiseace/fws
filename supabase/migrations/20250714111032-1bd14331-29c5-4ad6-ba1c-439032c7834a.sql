-- Ensure consistency between is_verified and verification_status fields
-- Update is_verified to match verification_status
UPDATE public.users 
SET is_verified = (verification_status = 'verified')
WHERE is_verified != (verification_status = 'verified');

-- Create a trigger function to keep is_verified and verification_status in sync
CREATE OR REPLACE FUNCTION public.sync_verification_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set is_verified based on verification_status
  NEW.is_verified := (NEW.verification_status = 'verified');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync the fields on updates
DROP TRIGGER IF EXISTS sync_verification_trigger ON public.users;
CREATE TRIGGER sync_verification_trigger
  BEFORE UPDATE OF verification_status ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_verification_fields();

-- Update the update_verification_status function to ensure proper sync
CREATE OR REPLACE FUNCTION public.update_verification_status(request_id uuid, new_status verification_status, notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Check admin permission
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin') THEN
        RAISE EXCEPTION 'Only admins can update verification status';
    END IF;
    
    -- Update verification request
    UPDATE public.verification_requests 
    SET 
        status = new_status,
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        review_notes = notes,
        updated_at = now()
    WHERE id = request_id;
    
    -- Update user verification status (trigger will automatically sync is_verified)
    UPDATE public.users 
    SET 
        verification_status = new_status,
        updated_at = now()
    WHERE id = (SELECT user_id FROM public.verification_requests WHERE id = request_id);
    
    -- Create notification for the user
    INSERT INTO public.user_notifications (
        user_id, 
        title, 
        message, 
        type
    )
    SELECT 
        user_id,
        CASE 
            WHEN new_status = 'verified' THEN 'Verification Approved!'
            WHEN new_status = 'rejected' THEN 'Verification Rejected'
            ELSE 'Verification Status Updated'
        END,
        CASE 
            WHEN new_status = 'verified' THEN 'Congratulations! Your account has been verified. You can now create services and access all features.'
            WHEN new_status = 'rejected' THEN 'Your verification request has been rejected. Please review the feedback and resubmit if needed.'
            ELSE 'Your verification status has been updated to: ' || new_status::text
        END,
        CASE 
            WHEN new_status = 'verified' THEN 'success'
            WHEN new_status = 'rejected' THEN 'error'
            ELSE 'info'
        END
    FROM public.verification_requests 
    WHERE id = request_id;
END;
$function$;