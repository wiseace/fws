-- Create onboarding steps tracking table
CREATE TABLE IF NOT EXISTS public.user_onboarding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, step_name)
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_onboarding
CREATE POLICY "Users can view their own onboarding progress" 
ON public.user_onboarding 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" 
ON public.user_onboarding 
FOR ALL
USING (auth.uid() = user_id);

-- Create notifications table for dashboard alerts
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.user_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.user_notifications 
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to handle new provider onboarding
CREATE OR REPLACE FUNCTION public.init_provider_onboarding()
RETURNS TRIGGER AS $$
BEGIN
    -- Only initialize for providers
    IF NEW.user_type = 'provider' THEN
        -- Insert onboarding steps
        INSERT INTO public.user_onboarding (user_id, step_name) VALUES 
            (NEW.id, 'profile_completion'),
            (NEW.id, 'verification_submission'),
            (NEW.id, 'first_service_creation'),
            (NEW.id, 'profile_optimization');
        
        -- Create welcome notification
        INSERT INTO public.user_notifications (user_id, title, message, type) VALUES 
            (NEW.id, 'Welcome to Findwhosabi!', 'Complete your profile and verification to start offering services.', 'info');
    ELSIF NEW.user_type = 'seeker' THEN
        -- Create welcome notification for seekers
        INSERT INTO public.user_notifications (user_id, title, message, type) VALUES 
            (NEW.id, 'Welcome to Findwhosabi!', 'Start browsing amazing services in your area.', 'info');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user onboarding
DROP TRIGGER IF EXISTS on_user_created_onboarding ON public.users;
CREATE TRIGGER on_user_created_onboarding
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.init_provider_onboarding();

-- Function to mark onboarding step as complete
CREATE OR REPLACE FUNCTION public.complete_onboarding_step(step_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_onboarding (user_id, step_name, completed, completed_at)
    VALUES (auth.uid(), step_name, TRUE, now())
    ON CONFLICT (user_id, step_name) 
    DO UPDATE SET 
        completed = TRUE, 
        completed_at = now(),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add realtime for notifications and onboarding
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_onboarding;