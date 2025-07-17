import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const { user, profile } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && profile) {
      checkOnboardingStatus();
    }
  }, [user, profile]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      // Get completed onboarding steps
      let { data: onboardingData, error: onboardingError } = await supabase
        .from('user_onboarding')
        .select('step_name, completed')
        .eq('user_id', user.id);

      if (onboardingError) throw onboardingError;

      console.log('Onboarding data for user:', user.id, onboardingData);

      // If no onboarding data exists for providers, create it
      if (profile?.user_type === 'provider' && (!onboardingData || onboardingData.length === 0)) {
        console.log('No onboarding data found for provider, creating initial steps...');
        await createInitialOnboardingSteps();
        // Retry fetching after creation
        const { data: newData } = await supabase
          .from('user_onboarding')
          .select('step_name, completed')
          .eq('user_id', user.id);
        onboardingData = newData || [];
      }

      const completed = new Set(
        onboardingData
          ?.filter(item => item.completed)
          .map(item => item.step_name) || []
      );

      setCompletedSteps(completed);

      // Determine if wizard should be shown
      const shouldShowWizard = await shouldShowOnboardingWizard(completed);
      console.log('Should show wizard:', shouldShowWizard, 'Completed steps:', Array.from(completed));
      setShowWizard(shouldShowWizard);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const createInitialOnboardingSteps = async () => {
    if (!user || !profile) return;

    const steps = profile.user_type === 'provider' 
      ? ['profile_completion', 'verification_submission', 'first_service_creation', 'subscription_setup']
      : ['profile_completion', 'browse_services', 'subscription_setup'];

    try {
      const { error } = await supabase
        .from('user_onboarding')
        .insert(
          steps.map(step => ({
            user_id: user.id,
            step_name: step,
            completed: false
          }))
        );

      if (error) throw error;
      console.log('Created initial onboarding steps for:', profile.user_type);
    } catch (error) {
      console.error('Error creating initial onboarding steps:', error);
    }
  };

  const shouldShowOnboardingWizard = async (completed: Set<string>): Promise<boolean> => {
    if (!profile) return false;

    // Don't show if user has dismissed wizard recently (check localStorage)
    const dismissedKey = `onboarding_dismissed_${user?.id}`;
    const dismissed = localStorage.getItem(dismissedKey);
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    if (dismissedTime > oneDayAgo) {
      return false;
    }

    // Define required steps based on user type
    const requiredSteps = profile.user_type === 'provider' 
      ? ['profile_completion', 'verification_submission', 'first_service_creation']
      : ['profile_completion'];

    // Show wizard if any required step is incomplete
    return requiredSteps.some(step => !completed.has(step));
  };

  const dismissWizard = () => {
    setShowWizard(false);
    
    // Store dismissal time to avoid showing again too soon
    if (user) {
      const dismissedKey = `onboarding_dismissed_${user.id}`;
      localStorage.setItem(dismissedKey, Date.now().toString());
    }
  };

  const showWizardManually = () => {
    setShowWizard(true);
  };

  return {
    showWizard,
    completedSteps,
    dismissWizard,
    showWizardManually,
    refreshOnboardingStatus: checkOnboardingStatus
  };
};