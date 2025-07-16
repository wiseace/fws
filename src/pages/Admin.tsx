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
      <div className="min-h-screen bg-background">
        <Header editMode={false} onToggleEdit={() => {}} />
        
        {/* Contained Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Modern Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-md">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="heading-1">Admin Dashboard</h1>
                <p className="body-text text-muted-foreground mt-1">
                  System Management & Analytics Center
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/admin/categories'}
                className="flex items-center gap-2"
              >
                <span className="text-sm">📁</span>
                Categories
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                User Dashboard
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Refreshing data...",
                    description: "Fetching latest admin data"
                  });
                  fetchAllData();
                }}
                className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-md"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              <Card 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105" 
                onClick={() => setActiveTab('users')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-md">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="caption-text font-medium text-blue-700 mb-2">Total Users</p>
                      <p className="text-[2rem] font-bold text-blue-900">{stats.total_users}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => setActiveTab('users')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-md">
                      <UserCheck className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="caption-text font-medium text-green-700 mb-2">Verified Users</p>
                      <p className="text-[2rem] font-bold text-green-900">{stats.verified_users}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => setActiveTab('verifications')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-md">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="caption-text font-medium text-orange-700 mb-2">Pending Verifications</p>
                      <p className="text-[2rem] font-bold text-orange-900">{stats.pending_verifications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => setActiveTab('services')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-md">
                      <Eye className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="caption-text font-medium text-purple-700 mb-2">Total Services</p>
                      <p className="text-[2rem] font-bold text-purple-900">{stats.total_services}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => setActiveTab('contacts')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-md">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="caption-text font-medium text-teal-700 mb-2">Contact Requests</p>
                      <p className="text-[2rem] font-bold text-teal-900">{stats.total_contacts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modern Tabs Interface */}
          <div className="px-6 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex items-center justify-center">
                <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-muted/30 p-1 rounded-full h-12">
                  <TabsTrigger value="verifications" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Verifications</TabsTrigger>
                  <TabsTrigger value="users" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Users</TabsTrigger>
                  <TabsTrigger value="contacts" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Contacts</TabsTrigger>
                  <TabsTrigger value="services" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Services</TabsTrigger>
                  <TabsTrigger value="categories" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Categories</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="verifications" className="space-y-6">
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-3xl p-8 shadow-xl border border-amber-200">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">Verification Requests</h2>
                        <p className="text-gray-600 mt-1">Review and approve user verification submissions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-white rounded-xl shadow-md border border-amber-200">
                        <span className="text-sm font-semibold text-gray-700">{verificationRequests.length} pending</span>
                      </div>
                      <Button 
                        onClick={fetchVerificationRequests}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6"
                      >
                        🔄 Refresh
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {verificationRequests.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-amber-100">
                        <div className="p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full w-fit mx-auto mb-6">
                          <Shield className="h-16 w-16 text-amber-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Verification Requests</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-8">
                          Verification requests will appear here when users submit their documents for review.
                        </p>
                        <Button 
                          onClick={fetchVerificationRequests}
                          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 py-3"
                        >
                          🔄 Check for New Requests
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {verificationRequests.map((request) => (
                          <div key={request.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100 overflow-hidden group">
                            <div className="p-6">
                              <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 space-y-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
                                        <User className="h-8 w-8 text-amber-600" />
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-bold text-gray-900">{request.full_name}</h3>
                                        <p className="text-gray-600">{(request as any).user?.email}</p>
                                      </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-md ${
                                      request.status === 'pending' 
                                        ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border border-amber-200' 
                                        : request.status === 'verified' 
                                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                        : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                    }`}>
                                      {request.status?.toUpperCase()}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">📱</span>
                                        <span className="text-sm font-semibold text-gray-700">Phone Number</span>
                                      </div>
                                      <p className="text-gray-900 font-medium">{request.phone_number}</p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">📅</span>
                                        <span className="text-sm font-semibold text-gray-700">Submitted Date</span>
                                      </div>
                                      <p className="text-gray-900 font-medium">
                                        {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        }) : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {request.additional_info && (
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">💬</span>
                                        <span className="text-sm font-semibold text-blue-800">Additional Information</span>
                                      </div>
                                      <p className="text-gray-800 leading-relaxed">{request.additional_info}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {request.status === 'pending' && (
                                  <div className="flex flex-col gap-3 lg:w-48">
                                    <Button
                                      size="lg"
                                      onClick={() => handleVerificationAction(request.id, 'verified')}
                                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold"
                                    >
                                      <CheckCircle className="w-5 h-5 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="lg"
                                      onClick={() => handleVerificationAction(request.id, 'rejected')}
                                      className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold"
                                    >
                                      <XCircle className="w-5 h-5 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 shadow-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
                        <p className="text-gray-600 mt-1">Manage user roles, permissions, and accounts</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-xl shadow-md border border-blue-200">
                      <span className="text-sm font-semibold text-gray-700">{users.length} total users</span>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {users.map((user) => (
                      <div key={user.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 overflow-hidden group">
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 flex-1">
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                                <User className="h-10 w-10 text-blue-600" />
                              </div>
                              
                              <div className="flex-1 space-y-4">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                                  <p className="text-gray-600">{user.email}</p>
                                </div>
                                
                                <div className="flex flex-wrap gap-3">
                                  <div className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-md ${
                                    user.user_type === 'admin' 
                                      ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                      : user.user_type === 'provider'
                                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
                                      : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                                  }`}>
                                    {user.user_type === 'admin' ? '👑 Admin' : user.user_type === 'provider' ? '🏢 Provider' : '👤 Seeker'}
                                  </div>
                                  
                                  <div className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-md ${
                                    user.is_verified 
                                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                      : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
                                  }`}>
                                    {user.is_verified ? '✅ Verified' : '⏳ Unverified'}
                                  </div>
                                  
                                  <div className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-md ${
                                    user.subscription_plan === 'free'
                                      ? 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
                                      : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {user.subscription_plan === 'free' ? '🆓 Free' : '💎 Premium'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col gap-3">
                                <label className="text-sm font-semibold text-gray-700">Role</label>
                                <select
                                  value={user.user_type}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                  className="border-2 border-blue-200 rounded-xl px-4 py-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-md min-w-[120px]"
                                  disabled={user.email === 'hi@ariyo.dev'}
                                >
                                  <option value="seeker">👤 Seeker</option>
                                  <option value="provider">🏢 Provider</option>
                                  <option value="admin">👑 Admin</option>
                                </select>
                              </div>
                              
                              {user.email === 'hi@ariyo.dev' ? (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 rounded-xl border border-amber-200 shadow-md">
                                  <Shield className="w-4 h-4" />
                                  <span className="text-sm font-semibold">Protected</span>
                                </div>
                              ) : (
                                <Button
                                  size="lg"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-8 shadow-xl border border-green-200">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">Contact Requests</h2>
                        <p className="text-gray-600 mt-1">Monitor service contact activity and user engagement</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-xl shadow-md border border-green-200">
                      <span className="text-sm font-semibold text-gray-700">{contactRequests.length} total contacts</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {contactRequests.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-green-100">
                        <div className="p-6 bg-gradient-to-br from-green-100 to-teal-100 rounded-full w-fit mx-auto mb-6">
                          <User className="h-16 w-16 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Contact Requests</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          Contact requests will appear here when users reach out to providers for services.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {contactRequests.map((request) => (
                          <div key={request.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 overflow-hidden group">
                            <div className="p-6">
                              <div className="flex items-start gap-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl flex items-center justify-center">
                                  <span className="text-2xl">💬</span>
                                </div>
                                
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        <span className="text-blue-600">{(request as any).seeker?.name}</span>
                                        <span className="text-gray-400 mx-2">→</span>
                                        <span className="text-green-600">{(request as any).provider?.name}</span>
                                      </h3>
                                      <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-lg border border-blue-200 text-sm font-semibold">
                                          🔧 {(request as any).service?.service_name}
                                        </div>
                                        <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-lg border border-purple-200 text-sm font-semibold">
                                          📧 {request.contact_method}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="text-right">
                                      <p className="text-sm text-gray-600 font-medium">
                                        {new Date(request.created_at).toLocaleDateString('en-US', { 
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(request.created_at).toLocaleTimeString('en-US', { 
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {request.message && (
                                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">💭</span>
                                        <span className="text-sm font-semibold text-gray-700">Message</span>
                                      </div>
                                      <p className="text-gray-800 leading-relaxed">{request.message}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 rounded-3xl p-8 shadow-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                        <Eye className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">All Services</h2>
                        <p className="text-gray-600 mt-1">Overview of all platform services and providers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-white rounded-xl shadow-md border border-purple-200">
                        <span className="text-sm font-semibold text-gray-700">{services.length} total services</span>
                      </div>
                      <div className="px-4 py-2 bg-white rounded-xl shadow-md border border-green-200">
                        <span className="text-sm font-semibold text-green-700">{services.filter(s => s.is_active).length} active</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {services.map((service) => (
                      <div key={service.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 overflow-hidden group">
                        <div className="p-6">
                          <div className="flex items-start gap-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                              <span className="text-3xl">🛠️</span>
                            </div>
                            
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.service_name}</h3>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">👤</span>
                                    <span className="text-gray-600 text-lg">Provider: </span>
                                    <span className="font-semibold text-purple-700">{(service as any).user?.name}</span>
                                  </div>
                                </div>
                                
                                <div className={`px-6 py-3 rounded-xl font-bold text-lg shadow-md ${
                                  service.is_active 
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                    : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                }`}>
                                  {service.is_active ? '🟢 Active' : '🔴 Inactive'}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📂</span>
                                    <span className="text-sm font-semibold text-gray-700">Category</span>
                                  </div>
                                  <p className="text-gray-900 font-medium">{service.category}</p>
                                </div>
                                
                                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📍</span>
                                    <span className="text-sm font-semibold text-gray-700">Location</span>
                                  </div>
                                  <p className="text-gray-900 font-medium">{service.location || 'Not specified'}</p>
                                </div>
                                
                                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📅</span>
                                    <span className="text-sm font-semibold text-gray-700">Created</span>
                                  </div>
                                  <p className="text-gray-900 font-medium">
                                    {new Date(service.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              
                              {service.description && (
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📝</span>
                                    <span className="text-sm font-semibold text-blue-800">Description</span>
                                  </div>
                                  <p className="text-gray-800 leading-relaxed">{service.description}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 rounded-3xl p-8 shadow-xl border border-rose-200">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-rose-500 to-orange-600 rounded-2xl shadow-lg">
                        <span className="text-white text-2xl">📁</span>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">Categories Management</h2>
                        <p className="text-gray-600 mt-1">Organize and manage service categories</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-rose-100">
                    <div className="p-8 bg-gradient-to-br from-rose-100 to-orange-100 rounded-full w-fit mx-auto mb-8">
                      <span className="text-6xl">📂</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Categories Management Center</h3>
                    <p className="text-gray-600 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                      Access the dedicated categories management page to create, edit, and organize service categories with icons and descriptions.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <Button 
                        onClick={() => window.location.href = '/admin/categories'}
                        className="bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 py-4 text-lg font-semibold"
                      >
                        <span className="mr-2 text-xl">📁</span>
                        Manage Categories
                      </Button>
                      
                      <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border border-gray-300">
                        <span className="text-2xl">⚡</span>
                        <span className="text-sm font-semibold text-gray-700">Quick Access</span>
                      </div>
                    </div>
                    
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="text-3xl mb-3">➕</div>
                        <h4 className="font-bold text-gray-900 mb-2">Create Categories</h4>
                        <p className="text-gray-600 text-sm">Add new service categories with custom icons</p>
                      </div>
                      
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="text-3xl mb-3">✏️</div>
                        <h4 className="font-bold text-gray-900 mb-2">Edit Categories</h4>
                        <p className="text-gray-600 text-sm">Modify existing categories and descriptions</p>
                      </div>
                      
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                        <div className="text-3xl mb-3">🗂️</div>
                        <h4 className="font-bold text-gray-900 mb-2">Organize</h4>
                        <p className="text-gray-600 text-sm">Structure and arrange category hierarchy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

        </div>

        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};

export default Admin;