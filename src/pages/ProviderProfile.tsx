
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProviderHeader } from '@/components/provider/ProviderHeader';
import { ProviderInfo } from '@/components/provider/ProviderInfo';
import { ProviderServices } from '@/components/provider/ProviderServices';
import { ProviderVerification } from '@/components/provider/ProviderVerification';

const ProviderProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, canAccessContactInfo } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);

  const { data: provider, isLoading, error } = useQuery({
    queryKey: ['provider', id],
    queryFn: async () => {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', id)
        .eq('is_active', true);

      if (servicesError) throw servicesError;
      
      if (!services || services.length === 0) {
        throw new Error('Provider not found');
      }

      return {
        user: services[0].user,
        services: services
      };
    },
    enabled: !!id
  });

  const handleContactClick = () => {
    if (!user) {
      toast.error('Please sign in to view contact information');
      window.location.href = '/auth';
      return;
    }

    if (!canAccessContactInfo) {
      setShowContactModal(true);
      return;
    }

    toast.success('Contact information revealed below');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Helper function to safely access contact info
  const getContactInfo = (contactInfo: any) => {
    if (!contactInfo || typeof contactInfo !== 'object') {
      return { phone: null, email: null };
    }
    return {
      phone: contactInfo.phone || null,
      email: contactInfo.email || null
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading provider profile...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <p className="text-gray-600 mb-6">The provider you're looking for doesn't exist or is not available.</p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const mainService = provider.services[0];
  const contactInfo = getContactInfo(mainService.contact_info);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button onClick={handleGoBack} variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <ProviderHeader user={provider.user} mainService={mainService} />
            <Card className="mt-0">
              <ProviderInfo 
                mainService={mainService}
                canAccessContactInfo={canAccessContactInfo}
                contactInfo={contactInfo}
                onContactClick={handleContactClick}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProviderServices services={provider.services} />
            <ProviderVerification user={provider.user} />
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Contact Information</DialogTitle>
            <DialogDescription>
              To view contact details, you need to verify your account and have an active subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What you get with a subscription:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Access to all provider contact information</li>
                <li>• Priority support</li>
                <li>• Advanced search filters</li>
                <li>• Save and organize your favorite providers</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowContactModal(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProfile;
