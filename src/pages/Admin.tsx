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
import SystemExplanation from '@/components/SystemExplanation';
import { User as UserType, VerificationRequest, ContactRequest, Service } from '@/types/database';
import { Users, CheckCircle, XCircle, Eye, Trash2, Shield, UserCheck, User, LayoutDashboard } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const Admin = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('verifications');
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    console.log('Admin useEffect - profile:', profile);
    console.log('Admin useEffect - user:', user);
    if (profile?.user_type === 'admin') {
      console.log('Loading admin data...');
      // Clear existing state to avoid stale data
      setVerificationRequests([]);
      setUsers([]);
      setContactRequests([]);
      setServices([]);
      setStats(null);
      fetchAllData();
    }
  }, [profile, user]);

  // Separate effect for real-time listeners
  useEffect(() => {
    if (profile?.user_type !== 'admin') return;

    // Listen for changes to all admin-relevant tables
    const usersChannel = supabase
      .channel('admin-users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          console.log('Users changed, refreshing...');
          fetchUsers();
          fetchStats();
        }
      )
      .subscribe();

    const verificationChannel = supabase
      .channel('admin-verification-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_requests' },
        () => {
          console.log('Verification requests changed, refreshing...');
          fetchVerificationRequests();
          fetchStats();
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('admin-services-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          console.log('Services changed, refreshing...');
          fetchServices();
          fetchStats();
        }
      )
      .subscribe();

    const contactsChannel = supabase
      .channel('admin-contacts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_requests' },
        () => {
          console.log('Contact requests changed, refreshing...');
          fetchContactRequests();
        }
      )
      .subscribe();

    return () => {
      usersChannel.unsubscribe();
      verificationChannel.unsubscribe();
      servicesChannel.unsubscribe();
      contactsChannel.unsubscribe();
    };
  }, [profile?.user_type]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchVerificationRequests(),
        fetchContactRequests(),
        fetchServices(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (data) setUsers(data);
  };

  const fetchVerificationRequests = async () => {
    console.log('=== DEBUG VERIFICATION REQUESTS FETCH ===');
    console.log('Current user:', user?.email, user?.id);
    console.log('Current profile:', profile?.user_type);
    console.log('Is admin?:', profile?.user_type === 'admin');
    
    try {
      // First check debug function
      const { data: debugData, error: debugError } = await supabase.rpc('debug_admin_access');
      console.log('Debug admin access:', { debugData, debugError });
      
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          user:users!verification_requests_user_id_fkey(name, email, phone, user_type),
          reviewed_by_user:users!verification_requests_reviewed_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });
      
      console.log('Verification requests response:', { data, error });
      console.log('Response data length:', data?.length || 0);
      
      if (error) {
        console.error('Error fetching verification requests:', error);
        console.log('Error details:', error.message, error.details, error.hint);
        throw error;
      }
      if (data) {
        console.log('Setting verification requests:', data);
        console.log('Data count:', data.length);
        setVerificationRequests(data as any);
      }
    } catch (error) {
      console.error('Exception in fetchVerificationRequests:', error);
    }
  };

  const fetchContactRequests = async () => {
    const { data, error } = await supabase
      .from('contact_requests')
      .select(`
        *,
        seeker:users!seeker_id(name, email),
        provider:users!provider_id(name, email),
        service:services(service_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (data) setContactRequests(data as any);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        user:users(name, email, verification_status)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (data) setServices(data as any);
  };

  const fetchStats = async () => {
    console.log('Fetching admin stats...');
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      console.log('Admin stats response:', { data, error });
      if (error) throw error;
      if (data) setStats(data);
    } catch (error) {
      console.error('Exception in fetchStats:', error);
    }
  };

  const handleVerificationAction = async (requestId: string, status: 'verified' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase.rpc('update_verification_status', {
        request_id: requestId,
        new_status: status,
        notes: notes || null
      });
      
      if (error) throw error;
      
      toast({
        title: `Verification ${status}`,
        description: `Request has been ${status} successfully.`
      });
      
      fetchVerificationRequests();
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'provider' | 'seeker') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ user_type: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Role updated",
        description: `User role changed to ${newRole}.`
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will permanently remove the user and ALL their related data (services, verification requests, contact requests).')) return;
    
    try {
      const { error } = await supabase.rpc('delete_user_and_related_data', {
        target_user_id: userId
      });
      
      if (error) throw error;
      
      toast({
        title: "User deleted",
        description: "User and all related data have been permanently removed from the system."
      });
      
      fetchAllData(); // Refresh all data since we may have deleted from multiple tables
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!user || profile?.user_type !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-8">
            <CardContent>
              <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
              <p className="text-gray-600">You do not have admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header editMode={false} onToggleEdit={() => {}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Admin Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Admin Panel
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive system administration and management dashboard
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin/profile'}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Admin Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                User Dashboard
              </Button>
            </div>
          </div>

          {/* Rich Admin Panel Overview */}
          <div className="mb-8 space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-blue-200 shadow-sm">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-blue-900">Admin Panel Overview</h2>
                        <p className="text-blue-600 text-sm">System administration and management dashboard</p>
                      </div>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg border border-blue-100">
                      <p className="text-blue-800 leading-relaxed">
                        This is the <span className="font-semibold text-blue-900">Admin Panel</span> - used for system administration, user management, and verification processing. The <span className="font-semibold text-blue-900">User Dashboard</span> is for personal service management and profile settings.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-col xl:flex-row">
                    <Button 
                      onClick={() => window.location.href = '/admin/categories'} 
                      className="bg-green-600 hover:bg-green-700 shadow-sm min-w-[180px]"
                    >
                      <span className="mr-2">📁</span>
                      Manage Categories
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('Force refreshing admin data...');
                        toast({
                          title: "Refreshing data...",
                          description: "Fetching latest admin data"
                        });
                        fetchAllData();
                      }}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50 shadow-sm min-w-[180px]"
                    >
                      🔄 Force Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Stats Cards with Rich UI */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              <Card 
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => setActiveTab('users')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-500 rounded-xl">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700 mb-1">Total Users</p>
                        <p className="text-3xl font-bold text-blue-900">{stats.total_users}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveTab('users')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-500 rounded-xl">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">Verified Users</p>
                        <p className="text-3xl font-bold text-green-900">{stats.verified_users}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveTab('verifications')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-orange-500 rounded-xl">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-700 mb-1">Pending Verifications</p>
                        <p className="text-3xl font-bold text-orange-900">{stats.pending_verifications}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveTab('services')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-500 rounded-xl">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700 mb-1">Total Services</p>
                        <p className="text-3xl font-bold text-purple-900">{stats.total_services}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveTab('contacts')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-teal-500 rounded-xl">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-teal-700 mb-1">Contact Requests</p>
                        <p className="text-3xl font-bold text-teal-900">{stats.total_contacts}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="verifications">Verifications</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="contacts">Contact Requests</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="verifications">
              <Card className="shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-orange-600" />
                      Verification Requests
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      Debug: {verificationRequests.length} requests loaded | Admin: {profile?.user_type} | Auth: {user ? 'Yes' : 'No'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {verificationRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No verification requests found</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          Verification requests will appear here when users submit them. 
                          {!user && ' Please ensure you are logged in as an admin.'}
                          {user && profile?.user_type !== 'admin' && ' Please check your admin permissions.'}
                        </p>
                        <Button 
                          onClick={() => {
                            console.log('Debug verification fetch...');
                            fetchVerificationRequests();
                          }}
                          variant="outline" 
                          className="mt-4"
                        >
                          🔍 Debug Refresh
                        </Button>
                      </div>
                    ) : (
                      verificationRequests.map((request) => (
                        <Card key={request.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{request.full_name}</h3>
                                    <p className="text-sm text-gray-600">{(request as any).user?.email}</p>
                                  </div>
                                  <Badge className={
                                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    request.status === 'verified' ? 'bg-green-100 text-green-800 border-green-200' :
                                    'bg-red-100 text-red-800 border-red-200'
                                  }>
                                    {request.status?.toUpperCase()}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Phone:</span>
                                    <span className="ml-2 text-gray-600">{request.phone_number}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Submitted:</span>
                                    <span className="ml-2 text-gray-600">
                                      {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                
                                {request.additional_info && (
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium text-gray-700 block mb-1">Additional Information:</span>
                                    <p className="text-sm text-gray-600">{request.additional_info}</p>
                                  </div>
                                )}
                              </div>
                              
                              {request.status === 'pending' && (
                                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row">
                                  <Button
                                    size="sm"
                                    onClick={() => handleVerificationAction(request.id, 'verified')}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleVerificationAction(request.id, 'rejected')}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex space-x-2 mt-2">
                              <Badge variant="outline">{user.user_type}</Badge>
                              <Badge className={user.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {user.is_verified ? 'Verified' : 'Unverified'}
                              </Badge>
                              <Badge variant="secondary">{user.subscription_plan}</Badge>
                            </div>
                          </div>
                           <div className="flex space-x-2">
                            <select
                              value={user.user_type}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                              className="border rounded px-2 py-1 text-sm"
                              disabled={user.email === 'hi@ariyo.dev'}
                            >
                              <option value="seeker">Seeker</option>
                              <option value="provider">Provider</option>
                              <option value="admin">Admin</option>
                            </select>
                            {user.email === 'hi@ariyo.dev' ? (
                              <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border">
                                <Shield className="w-3 h-3 mr-1" />
                                Protected
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contactRequests.length === 0 ? (
                      <p className="text-gray-600">No contact requests found.</p>
                    ) : (
                      contactRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">
                                {(request as any).seeker?.name} → {(request as any).provider?.name}
                              </h3>
                              <p className="text-sm text-gray-600">Service: {(request as any).service?.service_name}</p>
                              <p className="text-sm text-gray-600">Method: {request.contact_method}</p>
                              {request.message && (
                                <p className="text-sm mt-2">{request.message}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>All Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{service.service_name}</h3>
                            <p className="text-sm text-gray-600">Provider: {(service as any).user?.name}</p>
                            <p className="text-sm text-gray-600">Category: {service.category}</p>
                            <p className="text-sm text-gray-600">Location: {service.location}</p>
                            <Badge className={service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <CardTitle>Categories Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Manage service categories from the dedicated categories page.</p>
                    <Button onClick={() => window.location.href = '/admin/categories'}>
                      <span className="mr-2">📁</span>
                      Go to Categories Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* System Explanation Section */}
          <div className="mt-12">
            <SystemExplanation />
          </div>
        </div>

        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};

export default Admin;