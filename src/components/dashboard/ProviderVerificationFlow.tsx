import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText,
  User,
  Phone
} from 'lucide-react';

interface VerificationRequest {
  id: string;
  full_name: string;
  phone_number: string;
  additional_info: string | null;
  status: string;
  created_at: string;
  review_notes: string | null;
}

export const ProviderVerificationFlow = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: profile?.name || '',
    phone_number: profile?.phone || '',
    additional_info: ''
  });

  useEffect(() => {
    if (user && profile?.user_type === 'provider') {
      fetchVerificationRequest();
    }
  }, [user, profile]);

  const fetchVerificationRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setVerificationRequest(data);
        setFormData({
          full_name: data.full_name,
          phone_number: data.phone_number,
          additional_info: data.additional_info || ''
        });
      }
    } catch (error) {
      console.error('Error fetching verification request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const verificationData = {
        user_id: user?.id,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        additional_info: formData.additional_info || null,
        status: 'pending' as const,
        submitted_at: new Date().toISOString()
      };

      if (verificationRequest) {
        // Update existing request
        const { error } = await supabase
          .from('verification_requests')
          .update(verificationData)
          .eq('id', verificationRequest.id);

        if (error) throw error;
      } else {
        // Create new request
        const { error } = await supabase
          .from('verification_requests')
          .insert([verificationData]);

        if (error) throw error;
      }

      // Mark onboarding step as complete
      await supabase.rpc('complete_onboarding_step', { input_step_name: 'verification_submission' });

      // Create notification
      await supabase
        .from('user_notifications')
        .insert([{
          user_id: user?.id,
          title: 'Verification Submitted',
          message: 'Your verification request has been submitted and is under review.',
          type: 'info'
        }]);

      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted successfully. We'll review it within 24-48 hours."
      });

      await fetchVerificationRequest();
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading verification status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (profile?.verification_status === 'verified') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-6 w-6" />
            Verification Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                Congratulations! Your provider account has been verified. You can now create services and receive contact information from potential clients.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-green-700">Verified Name</Label>
                <p className="font-medium">{verificationRequest?.full_name}</p>
              </div>
              <div>
                <Label className="text-green-700">Verified Phone</Label>
                <p className="font-medium">{verificationRequest?.phone_number}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Provider Verification
        </CardTitle>
        {verificationRequest && (
          <div className="flex items-center gap-2">
            {getStatusIcon(verificationRequest.status)}
            <Badge variant={getStatusColor(verificationRequest.status) as any}>
              {verificationRequest.status}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {verificationRequest?.status === 'pending' ? (
          <div className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your verification request is under review. We'll notify you once it's processed (usually within 24-48 hours).
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div>
                <Label>Submitted Name</Label>
                <p className="text-sm text-muted-foreground">{verificationRequest.full_name}</p>
              </div>
              <div>
                <Label>Submitted Phone</Label>
                <p className="text-sm text-muted-foreground">{verificationRequest.phone_number}</p>
              </div>
              {verificationRequest.additional_info && (
                <div>
                  <Label>Additional Information</Label>
                  <p className="text-sm text-muted-foreground">{verificationRequest.additional_info}</p>
                </div>
              )}
            </div>
          </div>
        ) : verificationRequest?.status === 'rejected' ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your verification request was rejected. Please review the feedback below and resubmit.
              </AlertDescription>
            </Alert>
            
            {verificationRequest.review_notes && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <Label className="text-red-800">Review Notes</Label>
                <p className="text-sm text-red-700 mt-1">{verificationRequest.review_notes}</p>
              </div>
            )}

            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="additional_info">Additional Information</Label>
                <Textarea
                  id="additional_info"
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  placeholder="Any additional information about your services or qualifications..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Resubmitting...' : 'Resubmit Verification'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Complete your verification to start offering services and receive client contact information. This helps build trust with potential clients.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Identity Verification</h4>
                  <p className="text-sm text-blue-700">Verify your identity with real information</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">Service Credentials</h4>
                  <p className="text-sm text-green-700">Share your qualifications and experience</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your legal full name as it appears on your ID
                </p>
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll use this to verify your identity and contact you if needed
                </p>
              </div>

              <div>
                <Label htmlFor="additional_info">Tell Us About Your Services</Label>
                <Textarea
                  id="additional_info"
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  placeholder="Describe your experience, qualifications, certifications, or any other relevant information about the services you plan to offer..."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Help us understand your background and the quality of services you provide
                </p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};