import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Shield } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailVerified: () => void;
}

export const EmailVerificationModal = ({ isOpen, onClose, onEmailVerified }: EmailVerificationModalProps) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Send OTP using Supabase auth
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin,
          data: {
            verification_type: 'email_add'
          }
        }
      });

      if (error) throw error;

      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      // Update user profile with verified email
      const { error: updateError } = await supabase.rpc('update_user_profile', {
        user_name: null,
        user_phone: null,
        user_address: null
      });

      // Update the email in auth metadata
      const { error: updateEmailError } = await supabase.auth.updateUser({
        email: email
      });

      if (updateError || updateEmailError) {
        console.warn('Email update warning:', updateError || updateEmailError);
      }

      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified and added to your account.",
      });

      onEmailVerified();
      onClose();
      resetModal();
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setEmail('');
    setOtp('');
    setStep('email');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Add & Verify Email
          </DialogTitle>
        </DialogHeader>
        
        {step === 'email' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSendOTP}
                disabled={loading || !email}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                Send Verification Code
              </Button>
              <Button 
                onClick={handleClose} 
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit verification code to <strong>{email}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP 
                  value={otp} 
                  onChange={setOtp}
                  maxLength={6}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="flex-1"
              >
                Verify Email
              </Button>
              <Button 
                onClick={() => setStep('email')} 
                variant="outline"
              >
                Back
              </Button>
            </div>
            
            <Button 
              onClick={handleSendOTP}
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              disabled={loading}
            >
              Resend Code
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};