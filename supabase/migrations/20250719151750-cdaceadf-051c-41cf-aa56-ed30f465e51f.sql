-- Fix the get_user_admin_messages function to resolve SELECT DISTINCT ORDER BY issue
CREATE OR REPLACE FUNCTION public.get_user_admin_messages()
 RETURNS TABLE(id uuid, admin_id uuid, message text, message_type text, is_from_admin boolean, read_by_recipient boolean, created_at timestamp with time zone, admin_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    COALESCE(u.name, 'Admin') as admin_name
  FROM public.admin_user_messages m
  LEFT JOIN public.users u ON m.admin_id = u.id
  WHERE m.user_id = auth.uid()
  ORDER BY m.created_at DESC;
END;
$function$;