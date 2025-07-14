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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Modern Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-md">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
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
                      <p className="text-sm font-medium text-blue-700 mb-2">Total Users</p>
                      <p className="text-4xl font-bold text-blue-900">{stats.total_users}</p>
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
                      <p className="text-sm font-medium text-green-700 mb-2">Verified Users</p>
                      <p className="text-4xl font-bold text-green-900">{stats.verified_users}</p>
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
                      <p className="text-sm font-medium text-orange-700 mb-2">Pending Verifications</p>
                      <p className="text-4xl font-bold text-orange-900">{stats.pending_verifications}</p>
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
                      <p className="text-sm font-medium text-purple-700 mb-2">Total Services</p>
                      <p className="text-4xl font-bold text-purple-900">{stats.total_services}</p>
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
                      <p className="text-sm font-medium text-teal-700 mb-2">Contact Requests</p>
                      <p className="text-4xl font-bold text-teal-900">{stats.total_contacts}</p>
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
                <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-muted/50 border shadow-sm">
                  <TabsTrigger value="verifications" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Verifications</TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Users</TabsTrigger>
                  <TabsTrigger value="contacts" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Contacts</TabsTrigger>
                  <TabsTrigger value="services" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Services</TabsTrigger>
                  <TabsTrigger value="categories" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Categories</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="verifications" className="space-y-6">
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
                  <CardHeader className="bg-gradient-to-r from-warning/10 to-warning/5 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-warning to-warning-dark rounded-lg">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="text-foreground">Verification Requests</span>
                          <p className="text-sm text-muted-foreground font-normal mt-1">
                            Review and approve user verification submissions
                          </p>
                        </div>
                      </CardTitle>
                      <Badge variant="outline" className="bg-background/80">
                        {verificationRequests.length} pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {verificationRequests.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-6">
                            <Shield className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-3">No verification requests</h3>
                          <p className="text-muted-foreground max-w-md mx-auto mb-6">
                            Verification requests will appear here when users submit their documents for review.
                          </p>
                          <Button 
                            onClick={fetchVerificationRequests}
                            variant="outline" 
                            className="gap-2"
                          >
                            🔄 Refresh Data
                          </Button>
                        </div>
                      ) : (
                        verificationRequests.map((request) => (
                          <Card key={request.id} className="group hover:shadow-md transition-all duration-300 border border-border/50 bg-background/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                                <div className="space-y-4 flex-1">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                      <h3 className="text-lg font-semibold text-foreground">{request.full_name}</h3>
                                      <p className="text-sm text-muted-foreground">{(request as any).user?.email}</p>
                                    </div>
                                    <Badge 
                                      className={
                                        request.status === 'pending' 
                                          ? 'bg-warning/20 text-warning-dark border-warning/30' 
                                          : request.status === 'verified' 
                                          ? 'bg-brand-success/20 text-brand-success-dark border-brand-success/30' 
                                          : 'bg-destructive/20 text-destructive-dark border-destructive/30'
                                      }
                                    >
                                      {request.status?.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div>
                                      <span className="text-sm font-medium text-foreground">Phone:</span>
                                      <span className="ml-2 text-sm text-muted-foreground">{request.phone_number}</span>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-foreground">Submitted:</span>
                                      <span className="ml-2 text-sm text-muted-foreground">
                                        {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {request.additional_info && (
                                    <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                                      <span className="text-sm font-medium text-foreground block mb-2">Additional Information:</span>
                                      <p className="text-sm text-muted-foreground leading-relaxed">{request.additional_info}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {request.status === 'pending' && (
                                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-col xl:flex-row">
                                    <Button
                                      size="sm"
                                      onClick={() => handleVerificationAction(request.id, 'verified')}
                                      className="bg-gradient-to-r from-brand-success to-brand-success-dark hover:from-brand-success-dark hover:to-brand-success text-white shadow-md hover:shadow-lg transition-all"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleVerificationAction(request.id, 'rejected')}
                                      className="shadow-md hover:shadow-lg transition-all"
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

              <TabsContent value="users" className="space-y-6">
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-primary to-primary-dark rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-foreground">User Management</span>
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          Manage user roles and permissions
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {users.map((user) => (
                        <Card key={user.id} className="group hover:shadow-md transition-all duration-300 border border-border/50 bg-background/80 backdrop-blur-sm">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3 flex-1">
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                    {user.user_type}
                                  </Badge>
                                  <Badge 
                                    className={
                                      user.is_verified 
                                        ? 'bg-brand-success/20 text-brand-success-dark border-brand-success/30' 
                                        : 'bg-muted text-muted-foreground border-border'
                                    }
                                  >
                                    {user.is_verified ? 'Verified' : 'Unverified'}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-secondary/20 text-secondary-dark border-secondary/30">
                                    {user.subscription_plan}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <select
                                  value={user.user_type}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                  disabled={user.email === 'hi@ariyo.dev'}
                                >
                                  <option value="seeker">Seeker</option>
                                  <option value="provider">Provider</option>
                                  <option value="admin">Admin</option>
                                </select>
                                {user.email === 'hi@ariyo.dev' ? (
                                  <div className="flex items-center gap-2 text-xs bg-warning/10 text-warning-dark px-3 py-2 rounded-lg border border-warning/30">
                                    <Shield className="w-3 h-3" />
                                    Protected
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="shadow-md hover:shadow-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-6">
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
                  <CardHeader className="bg-gradient-to-r from-primary-light/10 to-primary-light/5 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-primary-light to-primary rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-foreground">Contact Requests</span>
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          Monitor service contact activity
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {contactRequests.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-6">
                            <User className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-3">No contact requests</h3>
                          <p className="text-muted-foreground">Contact requests will appear here when users reach out to providers.</p>
                        </div>
                      ) : (
                        contactRequests.map((request) => (
                          <Card key={request.id} className="group hover:shadow-md transition-all duration-300 border border-border/50 bg-background/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                      {(request as any).seeker?.name} → {(request as any).provider?.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Service: <span className="font-medium">{(request as any).service?.service_name}</span>
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                    {request.contact_method}
                                  </Badge>
                                </div>
                                {request.message && (
                                  <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                                    <p className="text-sm text-foreground leading-relaxed">{request.message}</p>
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  {new Date(request.created_at).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
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

              <TabsContent value="services" className="space-y-6">
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
                  <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-secondary to-secondary-dark rounded-lg">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-foreground">All Services</span>
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          Overview of all platform services
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {services.map((service) => (
                        <Card key={service.id} className="group hover:shadow-md transition-all duration-300 border border-border/50 bg-background/80 backdrop-blur-sm">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3 flex-1">
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground">{service.service_name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Provider: <span className="font-medium">{(service as any).user?.name}</span>
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Category:</span>
                                    <span className="ml-2 font-medium text-foreground">{service.category}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Location:</span>
                                    <span className="ml-2 font-medium text-foreground">{service.location}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge 
                                className={
                                  service.is_active 
                                    ? 'bg-brand-success/20 text-brand-success-dark border-brand-success/30' 
                                    : 'bg-destructive/20 text-destructive-dark border-destructive/30'
                                }
                              >
                                {service.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
                  <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-secondary to-secondary-dark rounded-lg">
                        <span className="text-lg">📁</span>
                      </div>
                      <div>
                        <span className="text-foreground">Categories Management</span>
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          Manage service categories and icons
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="text-center py-16">
                      <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-6">
                        <span className="text-4xl">📁</span>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Categories Management</h3>
                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Access the dedicated categories management page to create, edit, and organize service categories.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/admin/categories'}
                        className="bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary text-white shadow-md hover:shadow-lg transition-all gap-2"
                      >
                        <span>📁</span>
                        Manage Categories
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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