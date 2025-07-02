import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionGateProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export const SubscriptionGate = ({ isOpen, onClose, feature }: SubscriptionGateProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const handleSimulateSubscription = async (plan: 'monthly' | 'semi_annual' | 'yearly') => {
    setSimulatingPayment(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      // This would normally be handled by a payment processor
      // For demo purposes, we'll just update the user's subscription status
      try {
        // In a real app, this would be handled by a secure backend/webhook
        toast({
          title: "Subscription activated!",
          description: `You now have access to ${feature}. This is a demo subscription.`,
        });
        
        // Refresh user profile to get updated subscription status
        await refreshProfile();
        onClose();
      } catch (error) {
        toast({
          title: "Subscription failed",
          description: "Please try again later.",
          variant: "destructive"
        });
      } finally {
        setSimulatingPayment(false);
      }
    }, 2000);
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$19',
      period: 'per month',
      features: [
        'Access to contact information',
        'Unlimited service browsing',
        'Priority customer support',
        'Advanced search filters'
      ]
    },
    {
      id: 'semi_annual',
      name: 'Semi-Annual',
      price: '$99',
      period: 'per 6 months',
      savings: 'Save 13%',
      features: [
        'All Monthly features',
        'Profile verification priority',
        'Enhanced visibility',
        'Analytics dashboard'
      ]
    },
    {
      id: 'yearly',
      name: 'Annual',
      price: '$179',
      period: 'per year',
      savings: 'Save 22%',
      popular: true,
      features: [
        'All Semi-Annual features',
        'Premium badge',
        'Featured listings',
        'Dedicated account manager'
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Upgrade to Access {feature}
          </DialogTitle>
          <div className="text-center text-gray-600 mt-2">
            <Lock className="w-6 h-6 mx-auto mb-2" />
            Choose a subscription plan to unlock premium features
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                  <div className="text-sm text-gray-600">{plan.period}</div>
                  {plan.savings && (
                    <Badge variant="secondary" className="text-green-600">
                      {plan.savings}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSimulateSubscription(plan.id as any)}
                  disabled={simulatingPayment}
                >
                  {simulatingPayment ? 'Processing...' : `Subscribe to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This is a demo application. No real payments will be processed.</p>
          <p>Cancel anytime. All plans include a 30-day money-back guarantee.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};