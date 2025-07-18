-- Fix the send_admin_reply function to work with existing conversations
CREATE OR REPLACE FUNCTION public.send_admin_reply(reply_message text, reply_type text DEFAULT 'general'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_admin_id UUID;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate message
  IF reply_message IS NULL OR TRIM(reply_message) = '' THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  -- Find an admin that this user has previously communicated with, or get any admin
  SELECT DISTINCT admin_id INTO target_admin_id
  FROM public.admin_user_messages 
  WHERE user_id = auth.uid() 
  AND is_from_admin = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no previous conversation, get any admin
  IF target_admin_id IS NULL THEN
    SELECT id INTO target_admin_id 
    FROM public.users 
    WHERE user_type = 'admin' 
    LIMIT 1;
  END IF;

  IF target_admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin found to send message to';
  END IF;

  -- Insert user reply
  INSERT INTO public.admin_user_messages (
    admin_id,
    user_id,
    message,
    message_type,
    is_from_admin
  ) VALUES (
    target_admin_id,
    auth.uid(),
    reply_message,
    reply_type,
    false
  );

  -- Create notification for the specific admin
  INSERT INTO public.user_notifications (
    user_id, 
    title, 
    message, 
    type
  ) VALUES (
    target_admin_id,
    'New User Message',
    'A user has sent a message. Please check the admin messages section.',
    'info'
  );
END;
$function$;