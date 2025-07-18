-- Fix the complete_onboarding_step function to properly handle ambiguous column reference
CREATE OR REPLACE FUNCTION public.complete_onboarding_step(step_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.user_onboarding (user_id, step_name, completed, completed_at)
    VALUES (auth.uid(), step_name, TRUE, now())
    ON CONFLICT (user_id, step_name) 
    DO UPDATE SET 
        completed = TRUE, 
        completed_at = now(),
        updated_at = now();
END;
$function$;