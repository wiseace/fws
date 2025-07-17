import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, ArrowRight, User, Shield, CreditCard, Plus, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  completed: boolean;
  actionUrl?: string;
  actionHandler?: () => void;
}

interface OnboardingWizardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isVisible, onClose }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile) {
      initializeSteps();
      fetchCompletedSteps();
    }
  }, [profile]);

  const fetchCompletedSteps = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('step_name')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (error) throw error;

      const completed = new Set(data.map(item => item.step_name));
      setCompletedSteps(completed);
    } catch (error) {
      console.error('Error fetching completed steps:', error);
    }
  };

  const initializeSteps = () => {
    if (!profile) return;

    if (profile.user_type === 'provider') {
      setSteps([
        {
          id: 'profile_completion',
          title: 'Complete Your Profile',
          description: 'Add your personal information, skills, and location to attract clients.',
          icon: User,
          action: 'Complete Profile',
          completed: false,
          actionHandler: () => {
            // Close wizard first
            onClose();
            
            // Navigate to dashboard and then scroll to profile tab
            if (window.location.pathname !== '/dashboard') {
              window.location.href = '/dashboard';
              return;
            }
            
            setTimeout(() => {
              const profileTab = document.querySelector('[data-state="inactive"][data-value="profile"]') as HTMLElement;
              if (profileTab) {
                profileTab.click();
                setTimeout(() => {
                  const profileContent = document.querySelector('[data-state="active"] form, [data-state="active"] .profile-form');
                  if (profileContent) {
                    profileContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 300);
              }
            }, 200);
          }
        },
        {
          id: 'verification_submission',
          title: 'Get Verified',
          description: 'Submit your verification documents to build trust with potential clients.',
          icon: Shield,
          action: 'Start Verification',
          completed: false,
          actionHandler: () => {
            onClose();
            
            if (window.location.pathname !== '/dashboard') {
              window.location.href = '/dashboard';
              return;
            }
            
            setTimeout(() => {
              const verificationTab = document.querySelector('[data-state="inactive"][data-value="verification"]') as HTMLElement;
              if (verificationTab) {
                verificationTab.click();
                setTimeout(() => {
                  const verificationContent = document.querySelector('[data-state="active"] form, [data-state="active"] .verification-form');
                  if (verificationContent) {
                    verificationContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 300);
              }
            }, 200);
          }
        },
        {
          id: 'subscription_setup',
          title: 'Choose Your Plan',
          description: 'Subscribe to start receiving client contact requests and grow your business.',
          icon: CreditCard,
          action: 'View Plans',
          completed: false,
          actionUrl: '/pricing'
        },
        {
          id: 'first_service_creation',
          title: 'Create Your First Service',
          description: 'Showcase your expertise by creating detailed service listings.',
          icon: Plus,
          action: 'Create Service',
          completed: false,
          actionHandler: () => {
            onClose();
            
            if (window.location.pathname !== '/dashboard') {
              window.location.href = '/dashboard';
              return;
            }
            
            setTimeout(() => {
              const servicesTab = document.querySelector('[data-state="inactive"][data-value="services"]') as HTMLElement;
              if (servicesTab) {
                servicesTab.click();
                setTimeout(() => {
                  const servicesContent = document.querySelector('[data-state="active"] .services-grid, [data-state="active"] button[aria-label*="Add"], [data-state="active"] [class*="add"]');
                  if (servicesContent) {
                    servicesContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 300);
              }
            }, 200);
          }
        }
      ]);
    } else {
      // Seeker steps
      setSteps([
        {
          id: 'profile_completion',
          title: 'Complete Your Profile',
          description: 'Add your information to help providers understand your needs better.',
          icon: User,
          action: 'Complete Profile',
          completed: false,
          actionHandler: () => {
            onClose();
            
            if (window.location.pathname !== '/dashboard') {
              window.location.href = '/dashboard';
              return;
            }
            
            setTimeout(() => {
              const profileTab = document.querySelector('[data-state="inactive"][data-value="profile"]') as HTMLElement;
              if (profileTab) {
                profileTab.click();
                setTimeout(() => {
                  const profileContent = document.querySelector('[data-state="active"] form, [data-state="active"] .profile-form');
                  if (profileContent) {
                    profileContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 300);
              }
            }, 200);
          }
        },
        {
          id: 'browse_services',
          title: 'Explore Services',
          description: 'Browse our marketplace to discover talented professionals in your area.',
          icon: Search,
          action: 'Browse Services',
          completed: false,
          actionUrl: '/browse'
        },
        {
          id: 'subscription_setup',
          title: 'Unlock Premium Features',
          description: 'Subscribe to contact providers directly and access exclusive features.',
          icon: Star,
          action: 'View Plans',
          completed: false,
          actionUrl: '/pricing'
        }
      ]);
    }
  };

  const markStepCompleted = async (stepName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('complete_onboarding_step', {
        step_name: stepName
      });

      if (error) throw error;

      setCompletedSteps(prev => new Set(prev).add(stepName));
      
      toast({
        title: "Step completed!",
        description: "Great progress on your onboarding journey.",
      });
    } catch (error) {
      console.error('Error marking step completed:', error);
    }
  };

  const handleStepAction = (step: OnboardingStep, stepIndex: number) => {
    // Check if this step can be accessed (current step or previous steps completed)
    const canAccess = stepIndex === 0 || steps.slice(0, stepIndex).every(s => completedSteps.has(s.id));
    
    if (!canAccess) {
      toast({
        title: "Complete previous steps first",
        description: "Please complete the previous steps before proceeding.",
        variant: "destructive"
      });
      return;
    }

    if (step.actionHandler) {
      step.actionHandler();
    } else if (step.actionUrl) {
      window.location.href = step.actionUrl;
    }
  };

  const getProgress = () => {
    return (completedSteps.size / steps.length) * 100;
  };

  const getNextIncompleteStep = () => {
    return steps.findIndex(step => !completedSteps.has(step.id));
  };

  useEffect(() => {
    const nextStep = getNextIncompleteStep();
    if (nextStep !== -1) {
      setCurrentStep(nextStep);
    }
  }, [completedSteps, steps]);

  if (!isVisible || steps.length === 0) return null;

  const progress = getProgress();
  const currentStepData = steps[currentStep];

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none ${isVisible ? 'animate-fade-in' : 'animate-fade-out'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Wizard Panel - Compact callout style positioned safely */}
      <div 
        className={`absolute right-6 top-24 bottom-6 w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl transform transition-all duration-500 ease-out ${
          isVisible ? 'translate-x-0 scale-100 opacity-100 pointer-events-auto animate-slide-in-right' : 'translate-x-full scale-95 opacity-0 pointer-events-none animate-slide-out-right'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Welcome aboard! 🎉</h2>
              <p className="text-xs text-gray-600 mt-1">
                Let's get you set up in just a few steps
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-primary">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-6">
          {/* Current Step Highlight */}
          {currentStepData && !completedSteps.has(currentStepData.id) && (
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <currentStepData.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{currentStepData.title}</h3>
                      <Badge variant="default" className="text-xs px-1.5 py-0.5">Next</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{currentStepData.description}</p>
                    <Button 
                      onClick={() => handleStepAction(currentStepData, currentStep)}
                      className="w-full bg-gradient-primary hover:opacity-90 text-xs h-8"
                      size="sm"
                    >
                      {currentStepData.action}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Steps Overview */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Journey</h3>
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = index === currentStep && !isCompleted;
              const canAccess = index === 0 || steps.slice(0, index).every(s => completedSteps.has(s.id));
              const isDisabled = !canAccess && !isCompleted;
              
              return (
                 <div 
                  key={step.id}
                  onClick={() => canAccess && handleStepAction(step, index)}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 mb-2 ${
                    isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border border-gray-100' :
                    isCurrent ? 'bg-primary/5 border border-primary/20 hover:bg-primary/10 cursor-pointer hover:shadow-sm' : 
                    isCompleted ? 'bg-green-50 border border-green-200 cursor-pointer hover:shadow-sm' : 
                    'bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer hover:shadow-sm'
                  }`}
                >
                  <div className={`flex-shrink-0 transition-colors duration-300 ${
                    isCompleted ? 'text-green-600' : 
                    isCurrent ? 'text-primary' : 'text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <step.icon className={`h-3 w-3 flex-shrink-0 ${
                        isCompleted ? 'text-green-600' : 
                        isCurrent ? 'text-primary' : 'text-gray-400'
                      }`} />
                      <span className={`text-xs font-medium truncate ${
                        isCompleted ? 'text-green-800' : 
                        isCurrent ? 'text-primary' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </span>
                      {isCompleted && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-100 text-green-800 flex-shrink-0">
                          Done
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="text-[10px] px-1 py-0 flex-shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Message */}
          {progress === 100 && (
            <Card className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="mb-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                </div>
                <h3 className="text-sm font-bold text-green-800 mb-1">Congratulations! 🎉</h3>
                <p className="text-xs text-green-700 mb-3">
                  You've completed all onboarding steps. You're ready to {profile?.user_type === 'provider' ? 'start receiving clients' : 'find amazing services'}!
                </p>
                <Button 
                  onClick={onClose}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  size="sm"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500 text-center">
            Need help? Contact our support team anytime.
          </p>
        </div>
      </div>
    </div>
  );
};