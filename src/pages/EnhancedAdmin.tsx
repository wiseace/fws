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
import { AdminTableControls } from '@/components/admin/AdminTableControls';

import { User as UserType, VerificationRequest, ContactRequest, Service } from '@/types/database';
import { Users, CheckCircle, XCircle, Eye, Trash2, Shield, UserCheck, User, LayoutDashboard } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const EnhancedAdmin = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('verifications');
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Pagination states for each tab
  const [displayedUsers, setDisplayedUsers] = useState<UserType[]>([]);
  const [displayedVerifications, setDisplayedVerifications] = useState<VerificationRequest[]>([]);
  const [displayedContacts, setDisplayedContacts] = useState<ContactRequest[]>([]);
  const [displayedServices, setDisplayedServices] = useState<Service[]>([]);

  useEffect(() => {
    console.log('Enhanced Admin useEffect - profile:', profile);
    console.log('Enhanced Admin useEffect - user:', user);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
          {/* Modern Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-xl">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="heading-1">Enhanced Admin Dashboard</h1>
                <p className="body-text text-muted-foreground mt-1">
                  System Management & Analytics Center with Advanced Controls
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
                className="rounded-lg"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors duration-200" 
                onClick={() => setActiveTab('users')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-primary rounded-xl">
                      <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Users</p>
                      <p className="text-2xl font-bold text-foreground">{stats.total_users}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                onClick={() => setActiveTab('users')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-green-600 rounded-xl">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Verified Users</p>
                      <p className="text-2xl font-bold text-foreground">{stats.verified_users}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                onClick={() => setActiveTab('verifications')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-orange-600 rounded-xl">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Pending Verifications</p>
                      <p className="text-2xl font-bold text-foreground">{stats.pending_verifications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                onClick={() => setActiveTab('services')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-purple-600 rounded-xl">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Services</p>
                      <p className="text-2xl font-bold text-foreground">{stats.total_services}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                onClick={() => setActiveTab('contacts')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-teal-600 rounded-xl">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Contact Requests</p>
                      <p className="text-2xl font-bold text-foreground">{stats.total_contacts}</p>
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

              <TabsContent value="verifications" className="space-y-6 animate-fade-in">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary rounded-xl">
                        <Shield className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">Verification Requests</h2>
                        <p className="text-sm text-muted-foreground">Review and approve user verification submissions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">{verificationRequests.length} pending</span>
                      </div>
                      <Button 
                        onClick={fetchVerificationRequests}
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                      >
                        🔄 Refresh
                      </Button>
                    </div>
                  </div>

                  <AdminTableControls
                    data={verificationRequests}
                    searchPlaceholder="Search verifications by name or email..."
                    searchFields={['full_name', 'phone_number', 'additional_info']}
                    filterOptions={[
                      {
                        label: 'Status',
                        field: 'status',
                        options: [
                          { label: 'Pending', value: 'pending', count: verificationRequests.filter(r => r.status === 'pending').length },
                          { label: 'Verified', value: 'verified', count: verificationRequests.filter(r => r.status === 'verified').length },
                          { label: 'Rejected', value: 'rejected', count: verificationRequests.filter(r => r.status === 'rejected').length }
                        ]
                      }
                    ]}
                    sortOptions={[
                      { label: 'Submitted Date', value: 'submitted_at' },
                      { label: 'Name', value: 'full_name' },
                      { label: 'Status', value: 'status' }
                    ]}
                    itemsPerPage={5}
                    onDataChange={(data) => setDisplayedVerifications(data)}
                  />

                  <div className="space-y-4 mt-6">
                    {displayedVerifications.length === 0 ? (
                      <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                        <div className="p-4 bg-muted rounded-xl w-fit mx-auto mb-4">
                          <Shield className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Verification Requests</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                          Verification requests will appear here when users submit their documents for review.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {displayedVerifications.map((request) => (
                          <div key={request.id} className="bg-card rounded-xl border border-border hover:bg-muted/30 transition-colors duration-200">
                            <div className="p-4">
                              <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                                        <User className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <h3 className="text-base font-semibold text-foreground">{request.full_name}</h3>
                                        <p className="text-sm text-muted-foreground">{(request as any).user?.email}</p>
                                      </div>
                                    </div>
                                    <Badge variant={
                                      request.status === 'pending' ? 'secondary' 
                                      : request.status === 'verified' ? 'default'
                                      : 'destructive'
                                    } className="rounded-lg">
                                      {request.status?.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">📱</span>
                                        <span className="text-xs font-medium text-muted-foreground">Phone Number</span>
                                      </div>
                                      <p className="text-sm font-medium text-foreground">{request.phone_number}</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">📅</span>
                                        <span className="text-xs font-medium text-muted-foreground">Submitted Date</span>
                                      </div>
                                      <p className="text-sm font-medium text-foreground">
                                        {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        }) : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {request.additional_info && (
                                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">💬</span>
                                        <span className="text-xs font-medium text-muted-foreground">Additional Information</span>
                                      </div>
                                      <p className="text-sm text-foreground leading-relaxed">{request.additional_info}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {request.status === 'pending' && (
                                  <div className="flex flex-col gap-2 lg:w-40">
                                    <Button
                                      size="sm"
                                      onClick={() => handleVerificationAction(request.id, 'verified')}
                                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleVerificationAction(request.id, 'rejected')}
                                      className="rounded-lg"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
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

              <TabsContent value="users" className="space-y-6 animate-fade-in">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary rounded-xl">
                        <Users className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">User Management</h2>
                        <p className="text-sm text-muted-foreground">Manage user roles, permissions, and accounts</p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">{users.length} total users</span>
                    </div>
                  </div>

                  <AdminTableControls
                    data={users}
                    searchPlaceholder="Search users by name or email..."
                    searchFields={['name', 'email']}
                    filterOptions={[
                      {
                        label: 'User Type',
                        field: 'user_type',
                        options: [
                          { label: 'Admin', value: 'admin', count: users.filter(u => u.user_type === 'admin').length },
                          { label: 'Provider', value: 'provider', count: users.filter(u => u.user_type === 'provider').length },
                          { label: 'Seeker', value: 'seeker', count: users.filter(u => u.user_type === 'seeker').length }
                        ]
                      },
                      {
                        label: 'Verification Status',
                        field: 'is_verified',
                        options: [
                          { label: 'Verified', value: 'true', count: users.filter(u => u.is_verified).length },
                          { label: 'Unverified', value: 'false', count: users.filter(u => !u.is_verified).length }
                        ]
                      },
                      {
                        label: 'Subscription',
                        field: 'subscription_plan',
                        options: [
                          { label: 'Free', value: 'free', count: users.filter(u => u.subscription_plan === 'free').length },
                          { label: 'Premium', value: 'monthly', count: users.filter(u => u.subscription_plan !== 'free').length }
                        ]
                      }
                    ]}
                    sortOptions={[
                      { label: 'Created Date', value: 'created_at' },
                      { label: 'Name', value: 'name' },
                      { label: 'Email', value: 'email' },
                      { label: 'User Type', value: 'user_type' }
                    ]}
                    itemsPerPage={10}
                    onDataChange={(data) => setDisplayedUsers(data)}
                  />

                  <div className="grid gap-4 mt-6">
                    {displayedUsers.map((user) => (
                      <div key={user.id} className="bg-card rounded-xl border border-border hover:bg-muted/30 transition-colors duration-200">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                                <User className="h-6 w-6 text-muted-foreground" />
                              </div>
                              
                              <div className="flex-1 space-y-2">
                                <div>
                                  <h3 className="text-base font-semibold text-foreground">{user.name}</h3>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant={
                                    user.user_type === 'admin' ? 'destructive'
                                    : user.user_type === 'provider' ? 'default' 
                                    : 'secondary'
                                  } className="rounded-lg text-xs">
                                    {user.user_type === 'admin' ? '👑 Admin' : user.user_type === 'provider' ? '🏢 Provider' : '👤 Seeker'}
                                  </Badge>
                                  
                                  <Badge variant={user.is_verified ? 'default' : 'secondary'} className="rounded-lg text-xs">
                                    {user.is_verified ? '✅ Verified' : '⏳ Unverified'}
                                  </Badge>
                                  
                                  <Badge variant={user.subscription_plan === 'free' ? 'secondary' : 'default'} className="rounded-lg text-xs">
                                    {user.subscription_plan === 'free' ? '🆓 Free' : '💎 Premium'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Role</label>
                                <select
                                  value={user.user_type}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                  className="border border-border rounded-lg px-2 py-1 text-xs bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors min-w-[100px]"
                                  disabled={user.email === 'hi@ariyo.dev'}
                                >
                                  <option value="seeker">👤 Seeker</option>
                                  <option value="provider">🏢 Provider</option>
                                  <option value="admin">👑 Admin</option>
                                </select>
                              </div>
                              
                              {user.email === 'hi@ariyo.dev' ? (
                                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-lg border border-border">
                                  <Shield className="w-3 h-3" />
                                  <span className="text-xs font-medium">Protected</span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
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

              <TabsContent value="contacts" className="space-y-6 animate-fade-in">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary rounded-xl">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">Contact Requests</h2>
                        <p className="text-sm text-muted-foreground">Monitor service contact activity and user engagement</p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">{contactRequests.length} total contacts</span>
                    </div>
                  </div>

                  <AdminTableControls
                    data={contactRequests}
                    searchPlaceholder="Search contacts by seeker, provider, or service..."
                    searchFields={['message', 'contact_method']}
                    filterOptions={[
                      {
                        label: 'Contact Method',
                        field: 'contact_method',
                        options: [
                          { label: 'Email', value: 'email', count: contactRequests.filter(c => c.contact_method === 'email').length },
                          { label: 'Phone', value: 'phone', count: contactRequests.filter(c => c.contact_method === 'phone').length }
                        ]
                      }
                    ]}
                    sortOptions={[
                      { label: 'Created Date', value: 'created_at' },
                      { label: 'Contact Method', value: 'contact_method' }
                    ]}
                    itemsPerPage={8}
                    onDataChange={(data) => setDisplayedContacts(data)}
                  />

                  <div className="space-y-4 mt-6">
                    {displayedContacts.length === 0 ? (
                      <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                        <div className="p-4 bg-muted rounded-xl w-fit mx-auto mb-4">
                          <User className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Contact Requests</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Contact requests will appear here when users reach out to providers for services.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {displayedContacts.map((request) => (
                          <div key={request.id} className="bg-card rounded-xl border border-border hover:bg-muted/30 transition-colors duration-200">
                            <div className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                                  <span className="text-lg">💬</span>
                                </div>
                                
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h3 className="text-base font-semibold text-foreground mb-1">
                                        <span className="text-blue-600">{(request as any).seeker?.name}</span>
                                        <span className="text-muted-foreground mx-1">→</span>
                                        <span className="text-green-600">{(request as any).provider?.name}</span>
                                      </h3>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="rounded-lg text-xs">
                                          🔧 {(request as any).service?.service_name}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-lg text-xs">
                                          📧 {request.contact_method}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(request.created_at).toLocaleDateString('en-US', { 
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(request.created_at).toLocaleTimeString('en-US', { 
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {request.message && (
                                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm">💭</span>
                                        <span className="text-xs font-medium text-muted-foreground">Message</span>
                                      </div>
                                      <p className="text-sm text-foreground leading-relaxed">{request.message}</p>
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

              <TabsContent value="services" className="space-y-6 animate-fade-in">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary rounded-xl">
                        <Eye className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">All Services</h2>
                        <p className="text-sm text-muted-foreground">Overview of all platform services and providers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">{services.length} total</span>
                      </div>
                      <div className="px-3 py-1.5 bg-green-100 rounded-lg">
                        <span className="text-sm font-medium text-green-700">{services.filter(s => s.is_active).length} active</span>
                      </div>
                    </div>
                  </div>

                  <AdminTableControls
                    data={services}
                    searchPlaceholder="Search services by name, category, or provider..."
                    searchFields={['service_name', 'category', 'description', 'location']}
                    filterOptions={[
                      {
                        label: 'Status',
                        field: 'is_active',
                        options: [
                          { label: 'Active', value: 'true', count: services.filter(s => s.is_active).length },
                          { label: 'Inactive', value: 'false', count: services.filter(s => !s.is_active).length }
                        ]
                      },
                      {
                        label: 'Category',
                        field: 'category',
                        options: Array.from(new Set(services.map(s => s.category))).map(cat => ({
                          label: cat,
                          value: cat,
                          count: services.filter(s => s.category === cat).length
                        }))
                      }
                    ]}
                    sortOptions={[
                      { label: 'Created Date', value: 'created_at' },
                      { label: 'Service Name', value: 'service_name' },
                      { label: 'Category', value: 'category' },
                      { label: 'Status', value: 'is_active' }
                    ]}
                    itemsPerPage={6}
                    onDataChange={(data) => setDisplayedServices(data)}
                  />

                  <div className="grid gap-4 mt-6">
                    {displayedServices.map((service) => (
                      <div key={service.id} className="bg-card rounded-xl border border-border hover:bg-muted/30 transition-colors duration-200">
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                              <span className="text-lg">🛠️</span>
                            </div>
                            
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-base font-semibold text-foreground mb-1">{service.service_name}</h3>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">👤</span>
                                    <span className="text-sm text-muted-foreground">Provider:</span>
                                    <span className="text-sm font-medium text-foreground">{(service as any).user?.name}</span>
                                  </div>
                                </div>
                                
                                <Badge variant={service.is_active ? 'default' : 'destructive'} className="rounded-lg text-xs">
                                  {service.is_active ? '🟢 Active' : '🔴 Inactive'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="p-2 bg-muted/50 rounded-lg border border-border">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-sm">📂</span>
                                    <span className="text-xs font-medium text-muted-foreground">Category</span>
                                  </div>
                                  <p className="text-xs font-medium text-foreground">{service.category}</p>
                                </div>
                                
                                <div className="p-2 bg-muted/50 rounded-lg border border-border">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-sm">📍</span>
                                    <span className="text-xs font-medium text-muted-foreground">Location</span>
                                  </div>
                                  <p className="text-xs font-medium text-foreground">{service.location || 'Not specified'}</p>
                                </div>
                                
                                <div className="p-2 bg-muted/50 rounded-lg border border-border">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-sm">📅</span>
                                    <span className="text-xs font-medium text-muted-foreground">Created</span>
                                  </div>
                                  <p className="text-xs font-medium text-foreground">
                                    {new Date(service.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              
                              {service.description && (
                                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm">📝</span>
                                    <span className="text-xs font-medium text-muted-foreground">Description</span>
                                  </div>
                                  <p className="text-sm text-foreground leading-relaxed">{service.description}</p>
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

              <TabsContent value="categories" className="space-y-6 animate-fade-in">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary rounded-xl">
                        <span className="text-primary-foreground text-lg">📁</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">Categories Management</h2>
                        <p className="text-sm text-muted-foreground">Organize and manage service categories</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                    <div className="p-6 bg-muted rounded-xl w-fit mx-auto mb-6">
                      <span className="text-4xl">📂</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Categories Management Center</h3>
                    <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto">
                      Access the dedicated categories management page to create, edit, and organize service categories with icons and descriptions.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <Button 
                        onClick={() => window.location.href = '/admin/categories'}
                        className="rounded-lg"
                      >
                        <span className="mr-2">📁</span>
                        Manage Categories
                      </Button>
                      
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-border">
                        <span className="text-lg">⚡</span>
                        <span className="text-xs font-medium">Quick Access</span>
                      </div>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl mb-2">➕</div>
                        <h4 className="font-semibold text-foreground mb-1">Create Categories</h4>
                        <p className="text-xs text-muted-foreground">Add new service categories with custom icons</p>
                      </div>
                      
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl mb-2">✏️</div>
                        <h4 className="font-semibold text-foreground mb-1">Edit Categories</h4>
                        <p className="text-xs text-muted-foreground">Modify existing categories and descriptions</p>
                      </div>
                      
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl mb-2">🗂️</div>
                        <h4 className="font-semibold text-foreground mb-1">Organize</h4>
                        <p className="text-xs text-muted-foreground">Structure and arrange category hierarchy</p>
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

export default EnhancedAdmin;