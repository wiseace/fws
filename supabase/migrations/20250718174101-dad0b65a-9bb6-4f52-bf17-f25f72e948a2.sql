-- Create admin_user_messages table for communication between admin and users
CREATE TABLE public.admin_user_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general', -- 'verification_issue', 'general', 'unverification'
  is_from_admin BOOLEAN NOT NULL DEFAULT true,
  read_by_recipient BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for admin_user_messages
ALTER TABLE public.admin_user_messages ENABLE ROW LEVEL SECURITY;

-- Policies for admin_user_messages
CREATE POLICY "Users can view their own messages" 
ON public.admin_user_messages 
FOR SELECT 
USING (auth.uid() = user_id OR (auth.uid() = admin_id AND is_current_user_admin()));

CREATE POLICY "Users can reply to their messages" 
ON public.admin_user_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_from_admin = false);

CREATE POLICY "Admins can send and view all messages" 
ON public.admin_user_messages 
FOR ALL 
USING (is_current_user_admin());

-- Create function to unverify user with message
CREATE OR REPLACE FUNCTION public.admin_unverify_user(
  target_user_id UUID,
  admin_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Critical security check: Only allow current admins
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate reason is provided
  IF admin_reason IS NULL OR TRIM(admin_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required for unverification';
  END IF;

  -- Update user verification status
  UPDATE public.users 
  SET 
    verification_status = 'not_verified',
    is_verified = false,
    updated_at = now()
  WHERE id = target_user_id;

  -- Create admin message for the user
  INSERT INTO public.admin_user_messages (
    admin_id,
    user_id,
    message,
    message_type,
    is_from_admin
  ) VALUES (
    auth.uid(),
    target_user_id,
    admin_reason,
    'unverification',
    true
  );

  -- Create notification for the user
  INSERT INTO public.user_notifications (
    user_id, 
    title, 
    message, 
    type
  ) VALUES (
    target_user_id,
    'Account Unverified',
    'Your account verification has been revoked. Please check your messages for details and take necessary action.',
    'error'
  );

  -- Log the admin action
  INSERT INTO public.user_notifications (
    user_id, 
    title, 
    message, 
    type
  ) VALUES (
    auth.uid(),
    'User Unverification Executed',
    'Unverified user ID: ' || target_user_id::text || '. Reason: ' || admin_reason,
    'info'
  );
END;
$$;

-- Function to get user messages for dashboard
CREATE OR REPLACE FUNCTION public.get_user_admin_messages()
RETURNS TABLE(
  id UUID,
  admin_id UUID,
  message TEXT,
  message_type TEXT,
  is_from_admin BOOLEAN,
  read_by_recipient BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  admin_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.admin_id,
    m.message,
    m.message_type,
    m.is_from_admin,
    m.read_by_recipient,
    m.created_at,
    u.name as admin_name
  FROM public.admin_user_messages m
  LEFT JOIN public.users u ON m.admin_id = u.id
  WHERE m.user_id = auth.uid()
  ORDER BY m.created_at DESC;
END;
$$;

-- Function to send user reply to admin
CREATE OR REPLACE FUNCTION public.send_admin_reply(
  reply_message TEXT,
  reply_type TEXT DEFAULT 'general'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate message
  IF reply_message IS NULL OR TRIM(reply_message) = '' THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  -- Get an admin user (first admin found)
  SELECT id INTO admin_user_id 
  FROM public.users 
  WHERE user_type = 'admin' 
  LIMIT 1;

  IF admin_user_id IS NULL THEN
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
    admin_user_id,
    auth.uid(),
    reply_message,
    reply_type,
    false
  );

  -- Create notification for admins
  INSERT INTO public.user_notifications (
    user_id, 
    title, 
    message, 
    type
  ) VALUES (
    admin_user_id,
    'New User Message',
    'A user has sent a message. Please check the admin messages section.',
    'info'
  );
END;
$$;

-- Function to mark admin messages as read
CREATE OR REPLACE FUNCTION public.mark_admin_message_read(message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update message as read (user can only mark their own messages as read)
  UPDATE public.admin_user_messages 
  SET read_by_recipient = true, updated_at = now()
  WHERE id = message_id 
  AND (user_id = auth.uid() OR (admin_id = auth.uid() AND is_current_user_admin()));
END;
$$;