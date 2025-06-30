
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Star, Verified, ArrowLeft, Calendar, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

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

    // Show contact info since user has access
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
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-800 relative">
                {mainService.image_url && (
                  <img 
                    src={mainService.image_url} 
                    alt={mainService.service_name}
                    className="w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                  <div className="p-6 text-white">
                    <div className="flex items-center mb-2">
                      <h1 className="text-3xl font-bold mr-3">{provider.user?.name}</h1>
                      {provider.user?.is_verified && (
                        <div className="bg-blue-600 rounded-full p-1">
                          <Verified className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-blue-100 text-lg">{mainService.service_name}</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">About</h3>
                    <p className="text-gray-600 mb-4">
                      {mainService.description || "Professional service provider with years of experience delivering quality work."}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-700">
                        <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                        <span>{mainService.location || "Location not specified"}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Star className="w-4 h-4 mr-2 text-yellow-500 fill-current" />
                        <span>4.8 rating (25 reviews)</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-green-600" />
                        <span>Available for bookings</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                    {canAccessContactInfo ? (
                      <div className="space-y-2">
                        {contactInfo.phone && (
                          <div className="flex items-center text-gray-700">
                            <Phone className="w-4 h-4 mr-2 text-blue-600" />
                            <span>{contactInfo.phone}</span>
                          </div>
                        )}
                        {contactInfo.email && (
                          <div className="flex items-center text-gray-700">
                            <Mail className="w-4 h-4 mr-2 text-blue-600" />
                            <span>{contactInfo.email}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center text-gray-500 mb-2">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>••• ••• ••••</span>
                        </div>
                        <div className="flex items-center text-gray-500 mb-3">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>••••••@••••.com</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Verify your account and subscribe to view contact details
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button 
                    onClick={handleContactClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {canAccessContactInfo ? 'Contact Now' : 'Unlock Contact Info'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Services Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Services Offered</h3>
                <div className="space-y-3">
                  {provider.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{service.service_name}</h4>
                        <Badge variant="secondary" className="mt-1">
                          {service.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    {provider.user?.is_verified ? (
                      <>
                        <div className="bg-green-100 rounded-full p-1 mr-3">
                          <Verified className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-green-600 font-medium">Verified Provider</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-100 rounded-full p-1 mr-3">
                          <Award className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-gray-600">Unverified</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {provider.user?.is_verified 
                      ? "This provider has been verified and meets our quality standards."
                      : "This provider has not yet completed verification."}
                  </p>
                </div>
              </CardContent>
            </Card>
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
