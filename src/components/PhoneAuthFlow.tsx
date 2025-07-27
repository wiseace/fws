import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, CheckCircle, Eye, EyeOff } from 'lucide-react';

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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'signup' && (!name || password.length < 6)) {
      toast({
        title: "Missing information",
        description: "Please enter your name and a password (minimum 6 characters)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // For signin, try to authenticate first
      if (mode === 'signin') {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: `phone_${phoneNumber.replace('+', '')}@phoneauth.local`,
          password: password
        });

        if (authError) {
          throw new Error('Invalid phone number or password');
        }

        if (authData.user) {
          toast({
            title: "Success",
            description: "Signed in successfully!",
          });
          onSuccess(authData.user);
          return;
        }
      }

      // For signup, check if user already exists
      if (mode === 'signup') {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('phone', phoneNumber)
          .single();
        
        if (existingUser) {
          throw new Error('An account with this phone number already exists. Please sign in instead.');
        }
      }

      // Send verification code for signup
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
      // Verify the code first
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: phoneNumber,
          action: 'verify_code',
          code: verificationCode
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Verification failed');
      }

      // Create user account with password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `phone_${phoneNumber.replace('+', '')}@phoneauth.local`,
        password: password,
        options: {
          data: {
            name: name,
            phone: phoneNumber,
            user_type: userType,
            phone_verified: true
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw new Error(authError.message || 'Failed to create account');
      }

      if (authData.user) {
        // Poll for user creation and redirect
        let attempts = 0;
        const maxAttempts = 10;
        
        const pollForUser = async () => {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          if (userData) {
            toast({
              title: "Success",
              description: "Account created successfully!",
            });
            onSuccess(authData.user);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForUser, 500);
          } else {
            throw new Error('Account created but profile setup failed. Please try signing in.');
          }
        };
        
        await pollForUser();
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
              : 'Enter your phone number and password to sign in'
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
                  disabled={loading}
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
                    disabled={loading}
                  >
                    Service Seeker
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'provider' ? 'default' : 'outline'}
                    onClick={() => setUserType('provider')}
                    className="flex-1"
                    disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? "Create a password (min 6 characters)" : "Enter your password"}
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleSendCode} 
            className="w-full" 
            disabled={loading || !phoneNumber || !password || (mode === 'signup' && !name)}
          >
            {loading ? "Processing..." : (mode === 'signup' ? "Create Account" : "Sign In")}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => onModeChange(mode === 'signup' ? 'signin' : 'signup')}
              className="text-sm"
              disabled={loading}
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
          {loading ? 'Verifying...' : 'Verify Code & Complete Registration'}
        </Button>

        <div className="text-center space-y-2">
          <Button
            variant="link"
            onClick={handleResendCode}
            disabled={countdown > 0 || loading}
            className="text-sm"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </Button>
          
          <Button
            variant="link"
            onClick={() => setStep('phone')}
            className="text-sm block w-full"
            disabled={loading}
          >
            ← Change Phone Number
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};