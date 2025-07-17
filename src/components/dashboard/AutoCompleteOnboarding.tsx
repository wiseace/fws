import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useLocation } from 'react-router-dom';

export const AutoCompleteOnboarding = () => {
  const { profile } = useAuth();
  const { completeStep, completedSteps } = useOnboarding();
  const location = useLocation();

  useEffect(() => {
    // Auto-complete browse_services step when seeker visits browse page
    if (
      profile?.user_type === 'seeker' && 
      location.pathname === '/browse' && 
      !completedSteps.has('browse_services')
    ) {
      const timer = setTimeout(() => {
        completeStep('browse_services');
      }, 5000); // Complete after 5 seconds on browse page

      return () => clearTimeout(timer);
    }
  }, [location.pathname, profile, completedSteps, completeStep]);

  return null; // This component doesn't render anything
};