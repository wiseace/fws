import { useState, useEffect } from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompactAdminTableControls } from '@/components/admin/CompactAdminTableControls';
import { UserVerificationModal } from '@/components/admin/UserVerificationModal';

import { User as UserType, VerificationRequest, Service } from '@/types/database';
import { Users, CheckCircle, XCircle, Eye, Trash2, Shield, UserCheck, User, LayoutDashboard, RefreshCw, Settings, MessageSquare } from 'lucide-react';
import { AdminMessagesManager } from '@/components/admin/AdminMessagesManager';
import { Loader2 } from 'lucide-react';

const Admin = () => {
  const { user, profile, updateUserRole, deleteUser } = useSecureAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('verifications');
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Pagination states for each tab
  const [displayedVerifications, setDisplayedVerifications] = useState<VerificationRequest[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<UserType[]>([]);
  const [displayedServices, setDisplayedServices] = useState<Service[]>([]);
  const [verificationPagination, setVerificationPagination] = useState<any>({});
  const [usersPagination, setUsersPagination] = useState<any>({});
  const [servicesPagination, setServicesPagination] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  useEffect(() => {
    console.log('Admin useEffect - profile:', profile);
    console.log('Admin useEffect - user:', user);
    if (profile?.user_type === 'admin') {
      console.log('Loading admin data...');
      // Clear existing state to avoid stale data
      setVerificationRequests([]);
      setUsers([]);
      
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

    return () => {
      usersChannel.unsubscribe();
      verificationChannel.unsubscribe();
      servicesChannel.unsubscribe();
    };
  }, [profile?.user_type]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchVerificationRequests(),
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
      const result = await updateUserRole(userId, newRole, 'Role updated via admin panel');
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update role');
      }
      
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
    const reason = prompt('Please provide a reason for deleting this user:');
    if (!reason || reason.trim() === '') {
      toast({
        title: "Error",
        description: "A reason is required for user deletion.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This will permanently remove the user and ALL their related data (services, verification requests).')) return;
    
    try {
      const result = await deleteUser(userId, reason.trim());
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete user');
      }
      
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
            </div>
          )}

          {/* Modern Tabs Interface */}
          <div className="px-6 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex items-center justify-center">
                <TabsList className="grid grid-cols-4 w-full max-w-3xl bg-muted/30 p-1 rounded-full h-12">
                  <TabsTrigger value="verifications" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Verifications</TabsTrigger>
                  <TabsTrigger value="users" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Users</TabsTrigger>
                  <TabsTrigger value="services" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Services</TabsTrigger>
                  <TabsTrigger value="messages" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Messages</TabsTrigger>
                  <TabsTrigger value="categories" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm font-medium transition-all">Categories</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="verifications" className="space-y-4 animate-fade-in">
                <div className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <h2 className="text-lg font-semibold">Verification Requests</h2>
                        <p className="text-xs text-muted-foreground">Review and approve user verification submissions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {verificationRequests.filter(r => r.status === 'pending').length} pending
                      </Badge>
                      <Button 
                        onClick={fetchVerificationRequests}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <CompactAdminTableControls
                    data={verificationRequests}
                    searchFields={['full_name', 'phone_number', 'additional_info']}
                    filterOptions={[
                      {
                        field: 'status',
                        label: 'Status',
                        values: [
                          { value: 'pending', label: 'Pending' },
                          { value: 'verified', label: 'Verified' },
                          { value: 'rejected', label: 'Rejected' }
                        ]
                      }
                    ]}
                    sortOptions={[
                      { field: 'submitted_at', label: 'Submitted Date' },
                      { field: 'full_name', label: 'Name' },
                      { field: 'status', label: 'Status' }
                    ]}
                    itemsPerPage={10}
                    onDataChange={(data, pagination) => {
                      setDisplayedVerifications(data);
                      setVerificationPagination(pagination);
                    }}
                  />

                  <div className="space-y-2 mt-4">
                    {displayedVerifications.length === 0 ? (
                      <div className="text-center py-8 bg-muted/30 rounded-lg">
                        <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No verification requests found</p>
                      </div>
                    ) : (
                      displayedVerifications.map((request) => (
                        <div key={request.id} className="bg-muted/20 rounded-lg p-3 border border-border/50 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-foreground truncate">{request.full_name}</h3>
                                  <Badge variant={
                                    request.status === 'pending' ? 'secondary' 
                                    : request.status === 'verified' ? 'default'
                                    : 'destructive'
                                  } className="text-xs h-4 px-2">
                                    {request.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>📧 {(request as any).user?.email}</span>
                                  <span>📱 {request.phone_number}</span>
                                  <span>📅 {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {request.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleVerificationAction(request.id, 'verified')}
                                  className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleVerificationAction(request.id, 'rejected')}
                                  className="h-7 px-2"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {request.additional_info && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-foreground">
                              <span className="font-medium">Note:</span> {request.additional_info}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4 animate-fade-in">
                <div className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <h2 className="text-lg font-semibold">User Management</h2>
                        <p className="text-xs text-muted-foreground">Manage user roles, permissions, and accounts</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {users.length} total users
                    </Badge>
                  </div>

                  <CompactAdminTableControls
                    data={users}
                    searchFields={['name', 'email', 'phone']}
                    filterOptions={[
                      {
                        field: 'user_type',
                        label: 'Role',
                        values: [
                          { value: 'admin', label: 'Admin' },
                          { value: 'provider', label: 'Provider' },
                          { value: 'seeker', label: 'Seeker' }
                        ]
                      },
                      {
                        field: 'verification_status',
                        label: 'Verification',
                        values: [
                          { value: 'verified', label: 'Verified' },
                          { value: 'not_verified', label: 'Not Verified' },
                          { value: 'pending', label: 'Pending' }
                        ]
                      },
                      {
                        field: 'subscription_plan',
                        label: 'Subscription',
                        values: [
                          { value: 'free', label: 'Free' },
                          { value: 'monthly', label: 'Monthly' },
                          { value: 'yearly', label: 'Yearly' }
                        ]
                      }
                    ]}
                    sortOptions={[
                      { field: 'created_at', label: 'Join Date' },
                      { field: 'name', label: 'Name' },
                      { field: 'user_type', label: 'Role' },
                      { field: 'last_active', label: 'Last Active' }
                    ]}
                    itemsPerPage={15}
                    onDataChange={(data, pagination) => {
                      setDisplayedUsers(data);
                      setUsersPagination(pagination);
                    }}
                  />

                  <div className="space-y-2 mt-4">
                    {displayedUsers.map((user) => (
                      <div key={user.id} className="bg-muted/20 rounded-lg p-3 border border-border/50 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-foreground truncate">{user.name}</h3>
                                <div className="flex gap-1">
                                  <Badge variant={
                                    user.user_type === 'admin' ? 'destructive'
                                    : user.user_type === 'provider' ? 'default' 
                                    : 'secondary'
                                  } className="text-xs h-4 px-2">
                                    {user.user_type}
                                  </Badge>
                                  <Badge variant={user.is_verified ? 'default' : 'secondary'} className="text-xs h-4 px-2">
                                    {user.is_verified ? 'verified' : 'unverified'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>📧 {user.email}</span>
                                {user.phone && <span>📱 {user.phone}</span>}
                                <span>📅 {new Date(user.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                            <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsVerificationModalOpen(true);
                              }}
                              className="h-7 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Manage
                            </Button>
                            
                            <select
                              value={user.user_type}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                              className="border border-border rounded px-2 py-1 text-xs bg-background min-w-[80px]"
                              disabled={user.email === 'hi@ariyo.dev'}
                            >
                              <option value="seeker">Seeker</option>
                              <option value="provider">Provider</option>
                              <option value="admin">Admin</option>
                            </select>
                            
                            {user.email === 'hi@ariyo.dev' ? (
                              <Badge variant="outline" className="text-xs">Protected</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                                className="h-7 px-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>


              <TabsContent value="services" className="space-y-4 animate-fade-in">
                <div className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      <div>
                        <h2 className="text-lg font-semibold">All Services</h2>
                        <p className="text-xs text-muted-foreground">Overview of all platform services and providers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {services.length} total
                      </Badge>
                      <Badge variant="default" className="text-xs">
                        {services.filter(s => s.is_active).length} active
                      </Badge>
                    </div>
                  </div>

                  <CompactAdminTableControls
                    data={services}
                    searchFields={['service_name', 'description', 'category', 'location']}
                    filterOptions={[
                      {
                        field: 'is_active',
                        label: 'Status',
                        values: [
                          { value: 'true', label: 'Active' },
                          { value: 'false', label: 'Inactive' }
                        ]
                      },
                      {
                        field: 'category',
                        label: 'Category',
                        values: Array.from(new Set(services.map(s => s.category))).map(cat => ({ 
                          value: cat, 
                          label: cat 
                        }))
                      }
                    ]}
                    sortOptions={[
                      { field: 'created_at', label: 'Created Date' },
                      { field: 'service_name', label: 'Service Name' },
                      { field: 'category', label: 'Category' },
                      { field: 'is_active', label: 'Status' }
                    ]}
                    itemsPerPage={12}
                    onDataChange={(data, pagination) => {
                      setDisplayedServices(data);
                      setServicesPagination(pagination);
                    }}
                  />

                  <div className="space-y-2 mt-4">
                    {displayedServices.length === 0 ? (
                      <div className="text-center py-8 bg-muted/30 rounded-lg">
                        <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No services found</p>
                      </div>
                    ) : (
                      displayedServices.map((service) => (
                        <div key={service.id} className="bg-muted/20 rounded-lg p-3 border border-border/50 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                <span className="text-sm">🛠️</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-foreground truncate">{service.service_name}</h3>
                                  <Badge variant={service.is_active ? 'default' : 'destructive'} className="text-xs h-4 px-2">
                                    {service.is_active ? 'active' : 'inactive'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs h-4 px-2">
                                    {service.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>👤 {(service as any).user?.name}</span>
                                  <span>📍 {service.location || 'Not specified'}</span>
                                  <span>📅 {new Date(service.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {service.description && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-foreground">
                              <span className="font-medium">Description:</span> {service.description}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4 animate-fade-in">
                <AdminMessagesManager />
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

        {/* User Verification Modal */}
        <UserVerificationModal
          user={selectedUser}
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setIsVerificationModalOpen(false);
            setSelectedUser(null);
          }}
          onUserUpdated={() => {
            fetchAllData();
          }}
        />

        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};

export default Admin;