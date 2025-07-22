import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, Mail, Clock, CheckCircle } from 'lucide-react';

interface PhoneAuthFlowProps {
  onSuccess: (user: any) => void;
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export const PhoneAuthFlow: React.FC<PhoneAuthFlowProps> = ({
  onSuccess,
  mode,
  onModeChange
}) => {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'seeker' | 'provider'>('seeker');
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'signup' && !name) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // For signup, create auth user first
      if (mode === 'signup') {
        const temporaryEmail = `${phoneNumber.replace(/\D/g, '')}@phone.temp`;
        
        // Create auth user first
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: temporaryEmail,
          password: crypto.randomUUID(), // Random password since we use phone auth
          options: {
            data: {
              name,
              user_type: userType,
              phone: phoneNumber
            }
          }
        });

        if (authError && !authError.message.includes('already registered')) {
          throw authError;
        }

        // If user already exists, just get their data
        if (authError?.message.includes('already registered')) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phoneNumber)
            .single();
          
          if (!existingUser) {
            throw new Error('User exists but not found in database');
          }
        }
      }

      // Send verification code
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: phoneNumber,
          action: 'send_verification'
        }
      });

      if (error) throw error;

      if (data.success) {
        setStep('verify');
        setCountdown(60);
        toast({
          title: "Code sent",
          description: "Check your phone for the verification code",
        });
      } else {
        throw new Error(data.error || 'Failed to send code');
      }
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verify the code
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: phoneNumber,
          action: 'verify_code',
          code: verificationCode
        }
      });

      if (error) throw error;

      if (data.success) {
        // Get the verified user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('phone', phoneNumber)
          .single();

        if (userError) throw userError;

        toast({
          title: "Success",
          description: mode === 'signup' ? "Account created successfully!" : "Signed in successfully!",
        });

        onSuccess(userData);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: phoneNumber,
          action: 'send_verification'
        }
      });

      if (error) throw error;

      if (data.success) {
        setCountdown(60);
        toast({
          title: "Code resent",
          description: "A new verification code has been sent",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to resend verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">
            {mode === 'signup' ? 'Create Account' : 'Sign In'} with Phone
          </CardTitle>
          <CardDescription>
            {mode === 'signup' 
              ? 'Enter your details to create a new account'
              : 'Enter your phone number to sign in'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={userType === 'seeker' ? 'default' : 'outline'}
                    onClick={() => setUserType('seeker')}
                    className="flex-1"
                  >
                    Service Seeker
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'provider' ? 'default' : 'outline'}
                    onClick={() => setUserType('provider')}
                    className="flex-1"
                  >
                    Service Provider
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <CustomPhoneInput
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value || '')}
              placeholder="Enter your phone number"
              className="w-full"
            />
          </div>

          <Button 
            onClick={handleSendCode} 
            disabled={loading || !phoneNumber}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => onModeChange(mode === 'signup' ? 'signin' : 'signup')}
              className="text-sm"
            >
              {mode === 'signup' 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Verify Your Phone</CardTitle>
        <CardDescription>
          We sent a 6-digit code to {phoneNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Verification Code</Label>
          <InputOTP
            maxLength={6}
            value={verificationCode}
            onChange={(value) => setVerificationCode(value)}
          >
            <InputOTPGroup className="gap-2 justify-center">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          onClick={handleVerifyCode} 
          disabled={loading || verificationCode.length !== 6}
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="text-center space-y-2">
          <Button
            variant="link"
            onClick={handleResendCode}
            disabled={countdown > 0 || loading}
            className="text-sm"
          >
            {countdown > 0 ? (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Resend in {countdown}s
              </span>
            ) : (
              'Resend Code'
            )}
          </Button>
          
          <Button
            variant="link"
            onClick={() => setStep('phone')}
            className="text-sm block w-full"
          >
            ← Change Phone Number
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};