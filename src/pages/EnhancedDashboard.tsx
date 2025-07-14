import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Service, Category, ContactRequest, User } from '@/types/database';
import { 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Award,
  LayoutDashboard,
  Shield
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EnhancedDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Service form state
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    service_name: '',
    category: '',
    description: '',
    location: '',
    contact_info: { phone: '', email: '' }
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserServices(),
        fetchCategories(),
        fetchContactRequests(),
        fetchUserStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserServices = async () => {
    if (profile?.user_type !== 'provider') return;
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (data) setServices(data as Service[]);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    if (data) setCategories(data);
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
      
      if (error) throw error;
      if (data) setContactRequests(data as any);
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
      
      if (error) throw error;
      if (data) setContactRequests(data as any);
    }
  };

  const fetchUserStats = async () => {
    if (profile?.user_type === 'provider') {
      const { data: serviceCount } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id);
      
      const { data: activeServices } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id)
        .eq('is_active', true);
      
      const { data: contactCount } = await supabase
        .from('contact_requests')
        .select('id', { count: 'exact' })
        .eq('provider_id', user?.id);
      
      setStats({
        totalServices: serviceCount?.length || 0,
        activeServices: activeServices?.length || 0,
        contactRequests: contactCount?.length || 0
      });
    } else if (profile?.user_type === 'seeker') {
      const { data: contactCount } = await supabase
        .from('contact_requests')
        .select('id', { count: 'exact' })
        .eq('seeker_id', user?.id);
      
      setStats({
        contactRequests: contactCount?.length || 0
      });
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        service_name: serviceForm.service_name,
        category: serviceForm.category,
        description: serviceForm.description || null,
        location: serviceForm.location || null,
        contact_info: serviceForm.contact_info as any,
        user_id: user?.id
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Service updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Service created successfully"
        });
      }
      
      setServiceForm({
        service_name: '',
        category: '',
        description: '',
        location: '',
        contact_info: { phone: '', email: '' }
      });
      setEditingService(null);
      setIsServiceFormOpen(false);
      fetchUserServices();
      fetchUserStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      service_name: service.service_name,
      category: service.category,
      description: service.description || '',
      location: service.location || '',
      contact_info: (service.contact_info as any) || { phone: '', email: '' }
    });
    setIsServiceFormOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Service deleted successfully"
      });
      
      fetchUserServices();
      fetchUserStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Service ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      
      fetchUserServices();
      fetchUserStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <Header editMode={false} onToggleEdit={() => {}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <LayoutDashboard className="h-10 w-10 text-primary" />
                  User Dashboard
                </h1>
                <h2 className="text-2xl text-gray-700 mb-1">Welcome back, {profile?.name}! 👋</h2>
                <p className="text-gray-600 text-lg">
                  {profile?.user_type === 'provider' 
                    ? "Manage your services and connect with clients" 
                    : "Discover amazing services and connect with providers"}
                </p>
              </div>
              {profile?.user_type === 'admin' && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/admin'}
                  className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {profile?.user_type === 'provider' ? (
                <>
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Services</p>
                          <p className="text-3xl font-bold">{stats.totalServices}</p>
                        </div>
                        <div className="bg-blue-400 p-3 rounded-full">
                          <Star className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Active Services</p>
                          <p className="text-3xl font-bold">{stats.activeServices}</p>
                        </div>
                        <div className="bg-green-400 p-3 rounded-full">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Contact Requests</p>
                          <p className="text-3xl font-bold">{stats.contactRequests}</p>
                        </div>
                        <div className="bg-purple-400 p-3 rounded-full">
                          <Users className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100">Verification Status</p>
                          <p className="text-lg font-bold">
                            {profile?.verification_status === 'verified' ? 'Verified' : 'Pending'}
                          </p>
                        </div>
                        <div className="bg-orange-400 p-3 rounded-full">
                          <Award className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Service Requests</p>
                          <p className="text-3xl font-bold">{stats.contactRequests}</p>
                        </div>
                        <div className="bg-blue-400 p-3 rounded-full">
                          <TrendingUp className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Subscription</p>
                          <p className="text-lg font-bold capitalize">{profile?.subscription_plan}</p>
                        </div>
                        <div className="bg-green-400 p-3 rounded-full">
                          <Star className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          <Tabs defaultValue={profile?.user_type === 'provider' ? 'services' : 'requests'} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              {profile?.user_type === 'provider' ? (
                <>
                  <TabsTrigger value="services">My Services</TabsTrigger>
                  <TabsTrigger value="requests">Client Requests</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="requests">My Requests</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                </>
              )}
            </TabsList>

            {profile?.user_type === 'provider' && (
              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        <Star className="w-5 h-5 mr-2" />
                        My Services
                      </CardTitle>
                      
                      <Dialog open={isServiceFormOpen} onOpenChange={setIsServiceFormOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Service
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {editingService ? 'Edit Service' : 'Create New Service'}
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleServiceSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="service_name">Service Name *</Label>
                              <Input
                                id="service_name"
                                value={serviceForm.service_name}
                                onChange={(e) => setServiceForm({ ...serviceForm, service_name: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="category">Category *</Label>
                              <Select 
                                value={serviceForm.category} 
                                onValueChange={(value) => setServiceForm({ ...serviceForm, category: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.name}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={serviceForm.description}
                                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="location">Location</Label>
                              <Input
                                id="location"
                                value={serviceForm.location}
                                onChange={(e) => setServiceForm({ ...serviceForm, location: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                  id="phone"
                                  value={serviceForm.contact_info.phone}
                                  onChange={(e) => setServiceForm({ 
                                    ...serviceForm, 
                                    contact_info: { ...serviceForm.contact_info, phone: e.target.value }
                                  })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={serviceForm.contact_info.email}
                                  onChange={(e) => setServiceForm({ 
                                    ...serviceForm, 
                                    contact_info: { ...serviceForm.contact_info, email: e.target.value }
                                  })}
                                />
                              </div>
                            </div>
                            <div className="flex space-x-2 pt-4">
                              <Button type="submit" className="flex-1">
                                {editingService ? 'Update Service' : 'Create Service'}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsServiceFormOpen(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {services.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No services yet</h3>
                          <p className="mt-1 text-sm text-gray-500">Get started by creating your first service.</p>
                        </div>
                      ) : (
                        services.map((service) => (
                          <Card key={service.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-lg font-semibold">{service.service_name}</h3>
                                    <Badge variant={service.is_active ? "default" : "secondary"}>
                                      {service.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Badge variant="outline">{service.category}</Badge>
                                  </div>
                                  {service.description && (
                                    <p className="text-gray-600 mb-3">{service.description}</p>
                                  )}
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    {service.location && (
                                      <span className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        {service.location}
                                      </span>
                                    )}
                                    <span className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      Created {new Date(service.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {(service.contact_info?.phone || service.contact_info?.email) && (
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                                      {service.contact_info?.phone && (
                                        <span className="flex items-center">
                                          <Phone className="w-4 h-4 mr-1" />
                                          {service.contact_info.phone}
                                        </span>
                                      )}
                                      {service.contact_info?.email && (
                                        <span className="flex items-center">
                                          <Mail className="w-4 h-4 mr-1" />
                                          {service.contact_info.email}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleServiceStatus(service.id, service.is_active)}
                                  >
                                    {service.is_active ? 'Deactivate' : 'Activate'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditService(service)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteService(service.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {profile?.user_type === 'provider' ? 'Client Requests' : 'My Service Requests'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contactRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No requests yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {profile?.user_type === 'provider' 
                            ? 'Clients will contact you through your services.' 
                            : 'Start browsing services to make contact requests.'}
                        </p>
                      </div>
                    ) : (
                      contactRequests.map((request) => (
                        <Card key={request.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg mb-2">
                                  {profile?.user_type === 'provider' 
                                    ? `Request from ${(request as any).seeker?.name || 'Unknown'}` 
                                    : `Request to ${(request as any).provider?.name || 'Unknown'}`}
                                </h3>
                                <p className="text-gray-600 mb-2">
                                  Service: {(request as any).service?.service_name}
                                </p>
                                <p className="text-sm text-gray-500 mb-2">
                                  Contact Method: {request.contact_method}
                                </p>
                                {request.message && (
                                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">
                                    "{request.message}"
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {profile?.user_type === 'seeker' && (
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label>Name</Label>
                          <p className="text-lg font-medium">{profile?.name}</p>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p className="text-lg">{profile?.email}</p>
                        </div>
                        <div>
                          <Label>User Type</Label>
                          <Badge className="capitalize">{profile?.user_type}</Badge>
                        </div>
                        <div>
                          <Label>Subscription Plan</Label>
                          <Badge variant="outline" className="capitalize">{profile?.subscription_plan}</Badge>
                        </div>
                        <div>
                          <Label>Member Since</Label>
                          <p>{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label>Contact Access</Label>
                          <Badge variant={profile?.can_access_contact ? "default" : "secondary"}>
                            {profile?.can_access_contact ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t">
                        <div className="flex space-x-4">
                          <Button onClick={() => window.location.href = '/browse'} className="bg-blue-600 hover:bg-blue-700">
                            Browse Services
                          </Button>
                          <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
                            Upgrade Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};

export default EnhancedDashboard;