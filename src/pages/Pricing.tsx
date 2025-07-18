import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Check, Star, Crown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Pricing = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscribedPlan, setSubscribedPlan] = useState<string>('');

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$9.99',
      period: '/month',
      description: 'Perfect for occasional use',
      features: [
        'Access to all service provider contacts',
        'Basic search and filtering',
        'Customer support',
        'Mobile app access'
      ],
      popular: false,
      duration: '1 month'
    },
    {
      id: 'semi_annual',
      name: 'Semi-Annual',
      price: '$49.99',
      period: '/6 months',
      description: 'Best value for regular users',
      features: [
        'Everything in Monthly',
        'Priority customer support',
        'Advanced search filters',
        'Save favorite providers',
        '2 months free'
      ],
      popular: true,
      duration: '6 months'
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '$89.99',
      period: '/year',
      description: 'Maximum savings for power users',
      features: [
        'Everything in Semi-Annual',
        'Premium customer support',
        'Exclusive provider recommendations',
        'Early access to new features',
        '4+ months free'
      ],
      popular: false,
      duration: '1 year'
    }
  ];

  // Check URL for success parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const plan = urlParams.get('plan');
    
    if (success === 'true' && plan) {
      setSubscribedPlan(plan);
      setShowSuccessModal(true);
      // Clean up URL
      window.history.replaceState({}, document.title, '/pricing');
    }
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive"
      });
      return;
    }

    setLoading(planId);

    try {
      // Calculate subscription expiry
      const now = new Date();
      let expiryDate: Date;
      
      switch(planId) {
        case 'monthly':
          expiryDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          break;
        case 'semi_annual':
          expiryDate = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
          break;
        case 'yearly':
          expiryDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
          break;
        default:
          throw new Error('Invalid plan');
      }

      // Update user subscription
      const { error } = await supabase
        .from('users')
        .update({
          subscription_plan: planId as any,
          subscription_status: planId as any,
          subscription_expiry: expiryDate.toISOString(),
          can_access_contact: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      const planName = plans.find(p => p.id === planId)?.name || planId;
      setSubscribedPlan(planName);
      setShowSuccessModal(true);

      // Refresh user profile
      await refreshProfile();

      // Redirect to dashboard after modal
      setTimeout(() => {
        window.location.href = '/dashboard?success=subscription';
      }, 3000);

    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading('');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    window.location.href = '/dashboard?success=subscription';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get verified and unlock access to professional service providers in your area. 
            All plans include full access to provider contact information.
          </p>
        </div>

        {/* Current Subscription Status */}
        {profile && (
          <div className="max-w-md mx-auto mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Current Plan</h3>
                <Badge variant="outline" className="text-lg px-4 py-2 capitalize">
                  {profile.subscription_plan || 'Free'}
                </Badge>
                {profile.subscription_expiry && (
                  <p className="text-sm text-gray-600 mt-2">
                    Expires: {new Date(profile.subscription_expiry).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2 flex items-center justify-center">
                  {plan.name}
                  {plan.id === 'yearly' && <Crown className="w-5 h-5 ml-2 text-yellow-500" />}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id || profile?.subscription_plan === plan.id}
                >
                  {loading === plan.id ? 'Processing...' : 
                   profile?.subscription_plan === plan.id ? 'Current Plan' : 
                   'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">What happens after I subscribe?</h3>
              <p className="text-gray-600">
                Once you subscribe, you'll gain immediate access to all service provider contact information, 
                advanced search features, and priority support.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access 
                until your current billing period ends.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Do I need to be verified?</h3>
              <p className="text-gray-600">
                Yes, to access provider contact information, you need both an active subscription 
                and a verified account. Visit your dashboard to start the verification process.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer editMode={false} />
      
      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                Subscription Successful!
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome to {subscribedPlan} Plan!</h3>
              <p className="text-gray-600 mb-4">
                You now have full access to all service provider contacts and premium features.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  <strong>What's next?</strong> You'll be redirected to your dashboard where you can start browsing and contacting providers.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSuccessModalClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;