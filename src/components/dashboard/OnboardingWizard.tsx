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
            // Navigate to profile tab in dashboard
            window.location.hash = 'profile';
            markStepCompleted('profile_completion');
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
            window.location.hash = 'verification';
            markStepCompleted('verification_submission');
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
            window.location.hash = 'services';
            markStepCompleted('first_service_creation');
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
            window.location.hash = 'profile';
            markStepCompleted('profile_completion');
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

  const handleStepAction = (step: OnboardingStep) => {
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
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Wizard Panel */}
      <div 
        className={`absolute right-0 top-0 h-full w-[420px] bg-white border-l shadow-2xl transform transition-transform duration-500 ease-out pointer-events-auto ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome aboard! 🎉</h2>
              <p className="text-sm text-gray-600 mt-1">
                Let's get you set up in just a few steps
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-primary">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Step Highlight */}
          {currentStepData && !completedSteps.has(currentStepData.id) && (
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse-glow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <currentStepData.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{currentStepData.title}</h3>
                      <Badge variant="default" className="text-xs">Next</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{currentStepData.description}</p>
                    <Button 
                      onClick={() => handleStepAction(currentStepData)}
                      className="w-full bg-gradient-primary hover:opacity-90"
                    >
                      {currentStepData.action}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Steps Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-4">Your Journey</h3>
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = index === currentStep && !isCompleted;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isCurrent ? 'bg-primary/5 border border-primary/20' : 
                    isCompleted ? 'bg-green-50 border border-green-200' : 
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 transition-colors duration-300 ${
                    isCompleted ? 'text-green-600' : 
                    isCurrent ? 'text-primary' : 'text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <step.icon className={`h-4 w-4 ${
                        isCompleted ? 'text-green-600' : 
                        isCurrent ? 'text-primary' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium text-sm ${
                        isCompleted ? 'text-green-800' : 
                        isCurrent ? 'text-primary' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </span>
                      {isCompleted && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Done
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
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
                <div className="mb-3">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                </div>
                <h3 className="font-bold text-green-800 mb-2">Congratulations! 🎉</h3>
                <p className="text-sm text-green-700 mb-4">
                  You've completed all onboarding steps. You're ready to {profile?.user_type === 'provider' ? 'start receiving clients' : 'find amazing services'}!
                </p>
                <Button 
                  onClick={onClose}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Need help? Contact our support team anytime.
          </p>
        </div>
      </div>
    </div>
  );
};