import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RichDashboard } from '@/components/dashboard/RichDashboard';
import { ProviderVerificationFlow } from '@/components/dashboard/ProviderVerificationFlow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Service, ContactRequest } from '@/types/database';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Calendar, 
  Star,
  Users,
  Settings,
  CreditCard,
  Mail,
  Phone
} from 'lucide-react';

export const NewDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    try {
      if (profile?.user_type === 'provider') {
        await Promise.all([
          fetchServices(),
          fetchContactRequests()
        ]);
      } else if (profile?.user_type === 'seeker') {
        await fetchContactRequests();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      return;
    }

    if (data) {
      setServices(data as Service[]);
    }
  };

  const fetchContactRequests = async () => {
    if (profile?.user_type === 'provider') {
      const { data, error } = await supabase
        .from('contact_requests')
        .select(`
          *,
          seeker:users!seeker_id(name, email),
          service:services(service_name)
        `)
        .eq('provider_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact requests:', error);
        return;
      }

      if (data) {
        setContactRequests(data as any);
      }
    } else if (profile?.user_type === 'seeker') {
      const { data, error } = await supabase
        .from('contact_requests')
        .select(`
          *,
          provider:users!provider_id(name, email),
          service:services(service_name)
        `)
        .eq('seeker_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact requests:', error);
        return;
      }

      if (data) {
        setContactRequests(data as any);
      }
    }
  };

  const handleServiceAction = (action: string, serviceId?: string) => {
    switch (action) {
      case 'add':
        window.location.href = '/dashboard?tab=services&action=add';
        break;
      case 'edit':
        window.location.href = `/dashboard?tab=services&action=edit&id=${serviceId}`;
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this service?')) {
          deleteService(serviceId!);
        }
        break;
    }
  };

  const deleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Service Deleted",
      description: "Your service has been successfully deleted"
    });

    fetchServices();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
          <Header editMode={false} onToggleEdit={() => {}} />
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <Header editMode={false} onToggleEdit={() => {}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Rich Dashboard Overview */}
          <RichDashboard />

          {/* Tabbed Content */}
          <div className="mt-8">
            <Tabs defaultValue={profile?.user_type === 'provider' ? 'services' : 'requests'}>
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                {profile?.user_type === 'provider' ? (
                  <>
                    <TabsTrigger value="services">My Services</TabsTrigger>
                    <TabsTrigger value="requests">Client Requests</TabsTrigger>
                    <TabsTrigger value="verification">Verification</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="requests">My Requests</TabsTrigger>
                    <TabsTrigger value="browse">Browse Services</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="subscription">Subscription</TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* Provider Services Tab */}
              {profile?.user_type === 'provider' && (
                <TabsContent value="services" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-primary" />
                          My Services ({services.length})
                        </CardTitle>
                        <Button onClick={() => handleServiceAction('add')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {services.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {services.map((service) => (
                            <Card key={service.id} className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">{service.service_name}</h3>
                                    <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleServiceAction('edit', service.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleServiceAction('delete', service.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {service.description}
                                </p>
                                
                                {service.location && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <MapPin className="h-4 w-4" />
                                    {service.location}
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <Badge variant={service.is_active ? 'default' : 'secondary'}>
                                    {service.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    Created {new Date(service.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No services yet</h3>
                          <p className="text-muted-foreground mb-6">
                            Create your first service to start connecting with clients
                          </p>
                          <Button onClick={() => handleServiceAction('add')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Service
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Verification Tab */}
              {profile?.user_type === 'provider' && (
                <TabsContent value="verification" className="mt-6">
                  <ProviderVerificationFlow />
                </TabsContent>
              )}

              {/* Contact Requests Tab */}
              <TabsContent value="requests" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {profile?.user_type === 'provider' ? 'Client Requests' : 'My Requests'} ({contactRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contactRequests.length > 0 ? (
                      <div className="space-y-4">
                        {contactRequests.map((request) => (
                          <Card key={request.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-semibold">
                                    {profile?.user_type === 'provider' 
                                      ? (request as any).seeker?.name 
                                      : (request as any).provider?.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Service: {(request as any).service?.service_name}
                                  </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                  {new Date(request.created_at!).toLocaleDateString()}
                                </div>
                              </div>
                              
                              {request.message && (
                                <div className="mb-4">
                                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{request.message}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {profile?.user_type === 'provider' 
                                    ? (request as any).seeker?.email 
                                    : (request as any).provider?.email}
                                </div>
                                {request.contact_method && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {request.contact_method}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                        <p className="text-muted-foreground">
                          {profile?.user_type === 'provider' 
                            ? 'Client requests will appear here when they contact you'
                            : 'Your service requests will appear here'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-lg font-medium">{profile?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-lg">{profile?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">User Type</label>
                        <Badge variant="outline" className="mt-1">
                          {profile?.user_type === 'provider' ? 'Service Provider' : 'Service Seeker'}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Verification Status</label>
                        <div className="mt-1">
                          <Badge variant={
                            profile?.verification_status === 'verified' ? 'default' :
                            profile?.verification_status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {profile?.verification_status || 'Not Started'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-lg">{profile?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                        <p className="text-lg">{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t space-y-4">
                      <Button variant="outline" onClick={signOut}>
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscription Tab for Seekers */}
              {profile?.user_type === 'seeker' && (
                <TabsContent value="subscription" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Subscription & Billing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-lg px-3 py-1 capitalize">
                              {profile?.subscription_plan || 'Free'}
                            </Badge>
                          </div>
                        </div>
                        
                        {profile?.subscription_expiry && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Expires</label>
                            <p className="text-lg">{new Date(profile.subscription_expiry).toLocaleDateString()}</p>
                          </div>
                        )}
                        
                        <div className="pt-6 border-t">
                          <Button onClick={() => window.location.href = '/pricing'}>
                            <Star className="h-4 w-4 mr-2" />
                            Upgrade Plan
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Browse Services Tab for Seekers */}
              {profile?.user_type === 'seeker' && (
                <TabsContent value="browse" className="mt-6">
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Discover Amazing Services</h3>
                      <p className="text-muted-foreground mb-6">
                        Browse thousands of verified service providers in your area
                      </p>
                      <Button size="lg" onClick={() => window.location.href = '/browse'}>
                        <Eye className="h-4 w-4 mr-2" />
                        Browse All Services
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
        
        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};