-- Update get_admin_stats function to include contact requests
CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.users),
        'verified_users', (SELECT COUNT(*) FROM public.users WHERE verification_status = 'verified'),
        'pending_verifications', (SELECT COUNT(*) FROM public.verification_requests WHERE status = 'pending'),
        'active_subscriptions', (SELECT COUNT(*) FROM public.users WHERE subscription_plan != 'free'),
        'total_services', (SELECT COUNT(*) FROM public.services),
        'total_categories', (SELECT COUNT(*) FROM public.categories),
        'total_contacts', (SELECT COUNT(*) FROM public.contact_requests)
    );
$function$;