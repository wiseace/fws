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

    console.log('Starting onboarding check for user:', user.id, 'Profile:', profile);

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

      // Auto-complete steps based on current conditions
      await autoCompleteSteps(completed);

      // Refresh completed steps after auto-completion
      const { data: updatedOnboardingData } = await supabase
        .from('user_onboarding')
        .select('step_name, completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (updatedOnboardingData) {
        const updatedCompleted = new Set(
          updatedOnboardingData.map(item => item.step_name)
        );
        setCompletedSteps(updatedCompleted);
        
        // Determine if wizard should be shown with updated completion status
        const shouldShowWizard = await shouldShowOnboardingWizard(updatedCompleted);
        console.log('Should show wizard:', shouldShowWizard, 'Completed steps:', Array.from(updatedCompleted));
        setShowWizard(shouldShowWizard);
      } else {
        setCompletedSteps(completed);
        
        // Determine if wizard should be shown
        const shouldShowWizard = await shouldShowOnboardingWizard(completed);
        console.log('Should show wizard:', shouldShowWizard, 'Completed steps:', Array.from(completed));
        setShowWizard(shouldShowWizard);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const autoCompleteSteps = async (currentCompleted: Set<string>) => {
    if (!user || !profile) return;

    const stepsToComplete: string[] = [];

    // Check profile completion - if name, phone, and email are present
    // Note: email comes from user.email (auth), not profile.email
    if (!currentCompleted.has('profile_completion')) {
      console.log('Checking profile completion:', {
        name: profile.name,
        phone: profile.phone,
        userEmail: user.email,
        profileEmail: profile.email,
        hasAllFields: !!(profile.name && profile.phone && user.email)
      });
      if (profile.name && profile.phone && user.email) {
        console.log('Profile completion criteria met, marking step for completion');
        stepsToComplete.push('profile_completion');
      }
    }

    // Check verification submission - if verification request exists
    if (!currentCompleted.has('verification_submission') && profile.user_type === 'provider') {
      const { data: verificationData } = await supabase
        .from('verification_requests')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (verificationData && verificationData.length > 0) {
        stepsToComplete.push('verification_submission');
      }
    }

    // Check first service creation - if user has at least one service
    if (!currentCompleted.has('first_service_creation') && profile.user_type === 'provider') {
      const { data: servicesData } = await supabase
        .from('services')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (servicesData && servicesData.length > 0) {
        stepsToComplete.push('first_service_creation');
      }
    }

    // Check subscription setup - if user has a non-free subscription
    if (!currentCompleted.has('subscription_setup')) {
      if (profile.subscription_plan && profile.subscription_plan !== 'free') {
        stepsToComplete.push('subscription_setup');
      }
    }

    // Check browse services for seekers - mark as complete after they visit browse page
    if (!currentCompleted.has('browse_services') && profile.user_type === 'seeker') {
      // This will be handled by the browse page itself
    }

    // Complete the steps in the database
    for (const stepName of stepsToComplete) {
      try {
        await supabase.rpc('complete_onboarding_step', { step_name: stepName });
        currentCompleted.add(stepName);
        console.log(`Auto-completed step: ${stepName}`);
      } catch (error) {
        console.error(`Error auto-completing step ${stepName}:`, error);
      }
    }

    // Update local state immediately with the new completed steps
    if (stepsToComplete.length > 0) {
      console.log('Updating completed steps state:', Array.from(currentCompleted));
      setCompletedSteps(new Set(currentCompleted));
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

  const shouldShowOnboardingWizard = async (completed: Set<string>, isManualTrigger = false): Promise<boolean> => {
    if (!profile) return false;

    // If manually triggered, always show (override dismissal logic)
    if (isManualTrigger) return true;

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
    // Clear dismissal timestamp when manually showing wizard
    if (user) {
      const dismissedKey = `onboarding_dismissed_${user.id}`;
      localStorage.removeItem(dismissedKey);
    }
    setShowWizard(true);
  };

  const getOnboardingProgress = () => {
    if (!profile) return 0;
    
    const requiredSteps = profile.user_type === 'provider' 
      ? ['profile_completion', 'verification_submission', 'first_service_creation', 'subscription_setup']
      : ['profile_completion', 'browse_services', 'subscription_setup'];
    
    return (completedSteps.size / requiredSteps.length) * 100;
  };

  const completeStep = async (stepName: string) => {
    if (!user) return;
    
    try {
      await supabase.rpc('complete_onboarding_step', { step_name: stepName });
      setCompletedSteps(prev => new Set(prev).add(stepName));
      console.log(`Manually completed step: ${stepName}`);
    } catch (error) {
      console.error(`Error completing step ${stepName}:`, error);
    }
  };

  return {
    showWizard,
    completedSteps,
    dismissWizard,
    showWizardManually,
    refreshOnboardingStatus: checkOnboardingStatus,
    onboardingProgress: getOnboardingProgress(),
    completeStep
  };
};