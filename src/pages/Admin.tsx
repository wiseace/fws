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
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    console.log('Admin useEffect - profile:', profile);
    if (profile?.user_type === 'admin') {
      console.log('Loading admin data...');
      fetchAllData();
    }
  }, [profile]);

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
    console.log('Fetching verification requests...');
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false });
      
      console.log('Verification requests response:', { data, error });
      
      if (error) {
        console.error('Error fetching verification requests:', error);
        throw error;
      }
      if (data) {
        console.log('Setting verification requests:', data);
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
    const { data, error } = await supabase.rpc('get_admin_stats');
    if (error) throw error;
    if (data) setStats(data);
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

          {/* Quick Info Card */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 mb-2">Admin Panel Overview</h2>
                  <p className="text-blue-700">
                    This is the <strong>Admin Panel</strong> - used for system administration, user management, and verification processing. 
                    The <strong>User Dashboard</strong> is for personal service management and profile settings.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/admin/categories'} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <span className="mr-2">📁</span>
                  Manage Categories
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{stats.total_users}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Verified Users</p>
                      <p className="text-2xl font-bold">{stats.verified_users}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Pending Verifications</p>
                      <p className="text-2xl font-bold">{stats.pending_verifications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Eye className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Services</p>
                      <p className="text-2xl font-bold">{stats.total_services}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="verifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="verifications">Verifications</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="contacts">Contact Requests</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            <TabsContent value="verifications">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {verificationRequests.length === 0 ? (
                      <p className="text-gray-600">No verification requests found.</p>
                    ) : (
                      verificationRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{request.full_name}</h3>
                              <p className="text-sm text-gray-600">{(request as any).user?.email}</p>
                              <p className="text-sm text-gray-600">Phone: {request.phone_number}</p>
                              <Badge className={
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'verified' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {request.status}
                              </Badge>
                              {request.additional_info && (
                                <p className="text-sm mt-2">{request.additional_info}</p>
                              )}
                            </div>
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleVerificationAction(request.id, 'verified')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleVerificationAction(request.id, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
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