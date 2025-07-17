import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingWizard } from '@/components/dashboard/OnboardingWizard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Service, Category } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProviderVerificationFlow } from '@/components/dashboard/ProviderVerificationFlow';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, User, Settings, CreditCard, Loader2, HelpCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, signOut, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { showWizard, dismissWizard, showWizardManually } = useOnboarding();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      initializeDashboard();
    }
  }, [user, authLoading]);

  // Separate effect for real-time listeners
  useEffect(() => {
    if (!user?.id) return;

    // Listen for changes to user's services
    const servicesChannel = supabase
      .channel(`user-services-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('User services changed, refreshing...');
          fetchUserServices();
        }
      )
      .subscribe();

    return () => {
      servicesChannel.unsubscribe();
    };
  }, [user?.id]);

  const initializeDashboard = async () => {
    try {
      await Promise.all([
        fetchUserServices(),
        fetchCategories(),
        refreshProfile()
      ]);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setDataLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUserServices = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const typedServices = data.map(service => ({
          ...service,
          contact_info: service.contact_info as { phone?: string; email?: string; }
        })) as Service[];
        setServices(typedServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const resetForm = () => {
    setServiceName('');
    setCategory('');
    setDescription('');
    setPhone('');
    setEmail('');
    setLocation('');
    setImageUrl('');
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !serviceName || !category) return;

    const serviceData = {
      service_name: serviceName,
      category,
      description,
      contact_info: { phone, email },
      location,
      image_url: imageUrl
    };

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
          
        if (error) throw error;
        
        toast({
          title: "Service updated successfully!",
          description: "Your service has been updated."
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert([{ ...serviceData, user_id: user.id }]);
          
        if (error) throw error;
        
        toast({
          title: "Service added successfully!",
          description: "Your service is now live."
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchUserServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setServiceName(service.service_name);
    setCategory(service.category);
    setDescription(service.description || '');
    setPhone(service.contact_info.phone || '');
    setEmail(service.contact_info.email || '');
    setLocation(service.location || '');
    setImageUrl(service.image_url || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
        
      if (error) throw error;
      
      toast({
        title: "Service deleted",
        description: "Your service has been removed."
      });
      
      fetchUserServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (authLoading || dataLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header editMode={false} onToggleEdit={() => {}} />
          <div className="flex justify-center items-center py-32">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Help Button for Manual Wizard Access */}
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={showWizardManually}
            className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
            title="Show onboarding guide"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </div>

        {/* Onboarding Wizard */}
        <OnboardingWizard
          isVisible={showWizard}
          onClose={dismissWizard}
        />

        <Header editMode={false} onToggleEdit={() => {}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your profile and services</p>
          </div>

          <Tabs defaultValue="services" className="space-y-6">
            <TabsList>
              <TabsTrigger value="services">My Services</TabsTrigger>
              {profile?.user_type === 'provider' && (
                <TabsTrigger value="verification">Verification</TabsTrigger>
              )}
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Services</CardTitle>
                  {profile?.user_type === 'provider' && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => {
                            if (profile?.verification_status !== 'verified') {
                              toast({
                                title: "Verification Required",
                                description: "Please complete your verification before creating services.",
                                variant: "destructive"
                              });
                              return;
                            }
                            resetForm();
                          }} 
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Service
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingService ? 'Edit Service' : 'Add New Service'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="service-name">Service Name *</Label>
                              <Input
                                id="service-name"
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="category">Category *</Label>
                              <Select value={category} onValueChange={setCategory} required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="phone">Phone</Label>
                              <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="image-url">Image URL</Label>
                            <Input
                              id="image-url"
                              type="url"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                              {editingService ? 'Update' : 'Add'} Service
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {profile?.user_type === 'seeker' ? (
                    <p className="text-gray-600">
                      Service seekers can browse and contact providers. 
                      <Button variant="link" className="p-0 ml-2" onClick={() => window.location.href = '/browse'}>
                        Browse Services
                      </Button>
                    </p>
                  ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.map((service) => (
                        <Card key={service.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{service.service_name}</h3>
                              <div className="flex space-x-1">
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(service)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(service.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                            {service.location && (
                              <p className="text-xs text-gray-500">{service.location}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      No services yet. Add your first service to get started!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {profile?.user_type === 'provider' && (
              <TabsContent value="verification">
                <ProviderVerificationFlow />
              </TabsContent>
            )}

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-lg">{profile?.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-lg">{profile?.email}</p>
                  </div>
                  <div>
                    <Label>User Type</Label>
                    <Badge variant="outline" className="ml-2">
                      {profile?.user_type === 'provider' ? 'Service Provider' : 'Service Seeker'}
                    </Badge>
                  </div>
                  <div>
                    <Label>Verification Status</Label>
                    <Badge variant={profile?.is_verified ? "default" : "secondary"} className="ml-2">
                      {profile?.is_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  <Button variant="outline" onClick={signOut}>
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Subscription Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Current Plan</Label>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {profile?.subscription_status}
                    </Badge>
                  </div>
                  {profile?.subscription_expiry && (
                    <div>
                      <Label>Expires</Label>
                      <p className="text-lg">
                        {new Date(profile.subscription_expiry).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button onClick={() => window.location.href = '/pricing'} className="w-full bg-blue-600 hover:bg-blue-700">
                      Upgrade Subscription
                    </Button>
                    {!profile?.is_verified && (
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.href = '/dashboard?tab=verification'}
                        className="w-full"
                      >
                        Get Verified
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
