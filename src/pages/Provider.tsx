
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Service, User } from '@/types/database';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Phone, Mail, Lock, Star, Verified, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Provider = () => {
  const { id } = useParams<{ id: string }>();
  const { canAccessContactInfo, user } = useAuth();
  const { toast } = useToast();
  const [provider, setProvider] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProviderData();
    }
  }, [id]);

  const fetchProviderData = async () => {
    try {
      // Fetch provider profile
      const { data: providerData, error: providerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('user_type', 'provider')
        .single();

      if (providerError) {
        console.error('Error fetching provider:', providerError);
        toast({
          title: "Error",
          description: "Provider not found",
          variant: "destructive"
        });
        return;
      }

      // Fetch provider's services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', id)
        .eq('is_active', true);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      setProvider(providerData);
      if (servicesData) {
        const typedServices = servicesData.map(service => ({
          ...service,
          contact_info: service.contact_info as { phone?: string; email?: string; }
        })) as Service[];
        setServices(typedServices);
      }
    } catch (error) {
      console.error('Error in fetchProviderData:', error);
      toast({
        title: "Error",
        description: "Failed to load provider information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = () => {
    if (!user) {
      toast({
        title: "Sign up required",
        description: "Please sign up to contact providers",
        variant: "destructive"
      });
      window.location.href = '/auth';
      return;
    }

    if (!canAccessContactInfo) {
      toast({
        title: "Subscription required",
        description: "Verify your account and subscribe to view contact information",
        variant: "destructive"
      });
      window.location.href = '/dashboard';
      return;
    }

    toast({
      title: "Contact information available",
      description: "You can now see the provider's contact details",
    });
  };

  const getContactButtonText = () => {
    if (!user) {
      return 'Sign Up to Contact';
    }
    return canAccessContactInfo ? 'Contact Now' : 'Subscribe to Contact';
  };

  const getContactLockMessage = () => {
    if (!user) {
      return 'Sign up and subscribe to view contact details';
    }
    return 'Verify your account and subscribe to view contact details';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header editMode={false} onToggleEdit={() => {}} />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header editMode={false} onToggleEdit={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider not found</h1>
          <Button onClick={() => window.location.href = '/providers'}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Providers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
        {/* Back Button */}
        <Button 
          variant="outline" 
          className="mb-6"
          onClick={() => window.location.href = '/providers'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Providers
        </Button>

        {/* Provider Profile Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                {provider.profile_image_url ? (
                  <img 
                    src={provider.profile_image_url} 
                    alt={provider.name} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-600">
                    {provider.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                  {provider.is_verified && (
                    <div className="bg-blue-600 rounded-full p-1">
                      <Verified className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                
                <Badge variant="secondary" className="mb-4">
                  Service Provider
                </Badge>
                
                <div className="flex items-center text-yellow-400 mb-4">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-gray-600 ml-2">5.0 (24 reviews)</span>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  {canAccessContactInfo ? (
                    <>
                      {provider.email && (
                        <div className="flex items-center text-gray-700">
                          <Mail className="w-5 h-5 mr-3 text-blue-600" />
                          <span>{provider.email}</span>
                        </div>
                      )}
                      {provider.phone && (
                        <div className="flex items-center text-gray-700">
                          <Phone className="w-5 h-5 mr-3 text-blue-600" />
                          <span>{provider.phone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-2">Contact Information Locked</h3>
                      <p className="text-gray-600 mb-4">
                        {getContactLockMessage()}
                      </p>
                      <Button onClick={handleContactClick} className="bg-blue-600 hover:bg-blue-700">
                        {getContactButtonText()}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Offered</h2>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{service.service_name}</h3>
                    <Badge variant="secondary" className="mb-3">{service.category}</Badge>
                    
                    {service.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{service.description}</p>
                    )}
                    
                    {service.location && (
                      <div className="flex items-center text-gray-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="text-sm">{service.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">No services listed yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer editMode={false} />
    </div>
  );
};

export default Provider;
