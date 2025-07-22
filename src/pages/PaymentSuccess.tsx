import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [plan, setPlan] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const txRef = urlParams.get('tx_ref');
      const transactionId = urlParams.get('transaction_id');

      if (status === 'successful' && txRef && transactionId) {
        try {
          // Verify payment with backend
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: {
              transaction_id: transactionId,
              tx_ref: txRef
            }
          });

          if (error) throw error;

          if (data.success) {
            setSuccess(true);
            setPlan(data.plan);
            await refreshProfile();
            
            toast({
              title: "Payment successful!",
              description: "Your subscription has been activated.",
            });
          } else {
            throw new Error(data.error || 'Payment verification failed');
          }
        } catch (error: any) {
          console.error('Payment verification error:', error);
          setSuccess(false);
          toast({
            title: "Payment verification failed",
            description: error.message || "Please contact support if payment was deducted.",
            variant: "destructive"
          });
        }
      } else {
        setSuccess(false);
        toast({
          title: "Payment failed",
          description: "Your payment was not completed successfully.",
          variant: "destructive"
        });
      }
      
      setVerifying(false);
    };

    verifyPayment();
  }, [user, refreshProfile, toast]);

  const goToDashboard = () => {
    window.location.href = '/dashboard?success=subscription';
  };

  const goToPricing = () => {
    window.location.href = '/pricing';
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {success ? (
              <Check className="w-8 h-8 text-green-600" />
            ) : (
              <X className="w-8 h-8 text-red-600" />
            )}
          </div>
          <CardTitle className={`text-2xl ${success ? 'text-green-600' : 'text-red-600'}`}>
            {success ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {success ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800 capitalize">{plan} Plan</span>
                </div>
                <p className="text-green-700 text-sm">
                  Your subscription has been activated successfully! You now have access to all premium features.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button onClick={goToDashboard} className="w-full">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                  Back to Home
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm mb-2">
                  Your payment could not be processed successfully.
                </p>
                <p className="text-red-600 text-xs">
                  If money was deducted from your account, please contact our support team with your transaction reference.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button onClick={goToPricing} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;