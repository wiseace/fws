import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { NotificationModal } from '@/components/NotificationModal';
import { ServiceModal } from '@/components/ServiceModal';
import { 
  LayoutDashboard, 
  Star, 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp, 
  Award, 
  AlertCircle,
  MapPin,
  Calendar,
  Settings,
  Bell,
  ArrowRight,
  PlusCircle,
  Eye,
  Search,
  BookOpen,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { MyServicesTab } from './tabs/MyServicesTab';
import { ClientRequestsTab } from './tabs/ClientRequestsTab';
import { VerificationTab } from './tabs/VerificationTab';
import { ProfileTab } from './tabs/ProfileTab';
import { SubscriptionCountdown } from '@/components/SubscriptionCountdown';

interface DashboardStats {
  totalServices?: number;
  activeServices?: number;
  contactRequests?: number;
  profileCompletion?: number;
  verificationStatus?: string;
  subscriptionPlan?: string;
  totalViews?: number;
  thisWeekRequests?: number;
}

interface OnboardingStep {
  id: string;
  step_name: string;
  completed: boolean;
  completed_at: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export const RichDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({});
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchOnboardingSteps(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (profile?.user_type === 'provider') {
      const { data: services } = await supabase
        .from('services')
        .select('id, is_active')
        .eq('user_id', user?.id);

      const { data: contacts } = await supabase
        .from('contact_requests')
        .select('id, created_at')
        .eq('provider_id', user?.id);

      const totalServices = services?.length || 0;
      const activeServices = services?.filter(s => s.is_active).length || 0;
      const contactRequests = contacts?.length || 0;
      
      // Calculate this week's requests
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thisWeekRequests = contacts?.filter(c => c.created_at > oneWeekAgo).length || 0;

      setStats({
        totalServices,
        activeServices,
        contactRequests,
        thisWeekRequests,
        verificationStatus: profile?.verification_status,
        subscriptionPlan: profile?.subscription_plan,
        profileCompletion: calculateProfileCompletion()
      });
    } else if (profile?.user_type === 'seeker') {
      const { data: contacts } = await supabase
        .from('contact_requests')
        .select('id')
        .eq('seeker_id', user?.id);

      setStats({
        contactRequests: contacts?.length || 0,
        subscriptionPlan: profile?.subscription_plan,
        profileCompletion: calculateProfileCompletion()
      });
    }
  };

  const calculateProfileCompletion = () => {
    let completion = 0;
    if (profile?.name) completion += 20;
    if (profile?.email) completion += 20;
    if (profile?.phone) completion += 20;
    if (profile?.verification_status === 'verified') completion += 40;
    return completion;
  };

  const fetchOnboardingSteps = async () => {
    if (profile?.user_type === 'provider') {
      const { data } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at');

      if (data) setOnboardingSteps(data);
    }
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      const typedData = data.map(notification => ({
        ...notification,
        type: notification.type as 'info' | 'success' | 'warning' | 'error'
      }));
      setNotifications(typedData);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsNotificationModalOpen(true);
  };

  const checkAndShowVerificationToast = (action: string) => {
    if (profile?.verification_status !== 'verified') {
      toast({
        title: "Verification Required",
        description: `You need to complete verification to ${action}. Please submit your verification documents first.`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleServiceModalOpen = () => {
    if (checkAndShowVerificationToast('create services')) {
      setIsServiceModalOpen(true);
    }
  };

  const handleServiceCreated = () => {
    fetchDashboardData(); // Refresh the dashboard data
    markOnboardingStepComplete('first_service_creation');
  };

  const markOnboardingStepComplete = async (stepName: string) => {
    try {
      const { error } = await supabase.rpc('complete_onboarding_step', {
        input_step_name: stepName
      });
      
      if (error) {
        console.error('Error completing onboarding step:', error);
      } else {
        // Refresh onboarding data
        fetchOnboardingSteps();
      }
    } catch (error) {
      console.error('Error completing onboarding step:', error);
    }
  };

  const handleOnboardingStepClick = (stepName: string, completed: boolean) => {
    if (completed) return; // Don't do anything if already completed
    
    switch (stepName) {
      case 'profile_completion':
        setActiveTab('profile');
        scrollToSection('profile-tab');
        break;
      case 'verification_submission':
        setActiveTab('verification');
        scrollToSection('verification-tab');
        break;
      case 'first_service_creation':
        handleServiceModalOpen();
        break;
      case 'profile_optimization':
        setActiveTab('profile');
        scrollToSection('profile-tab');
        break;
      default:
        break;
    }
  };

  const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100); // Small delay to ensure tab content is rendered
  };

  const getStepIcon = (stepName: string, completed: boolean) => {
    const iconClass = completed ? 'text-green-600' : 'text-gray-400';
    switch (stepName) {
      case 'profile_completion': return <Settings className={`h-4 w-4 ${iconClass}`} />;
      case 'verification_submission': return <Shield className={`h-4 w-4 ${iconClass}`} />;
      case 'first_service_creation': return <PlusCircle className={`h-4 w-4 ${iconClass}`} />;
      case 'profile_optimization': return <Target className={`h-4 w-4 ${iconClass}`} />;
      default: return <CheckCircle className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const getStepTitle = (stepName: string) => {
    switch (stepName) {
      case 'profile_completion': return 'Complete Your Profile';
      case 'verification_submission': return 'Submit Verification';
      case 'first_service_creation': return 'Create Your First Service';
      case 'profile_optimization': return 'Optimize Your Profile';
      default: return stepName.replace('_', ' ');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  <LayoutDashboard className="h-8 w-8 text-white" />
                </div>
                {getGreeting()}, {profile?.name}!
              </h1>
              <p className="text-xl text-muted-foreground">
                {profile?.user_type === 'provider' 
                  ? "Manage your services and grow your business" 
                  : "Discover amazing services and connect with providers"}
              </p>
            </div>
            <div className="flex items-center gap-4">
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {profile?.user_type === 'provider' ? (
            <>
              <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-foreground/80 text-sm font-medium">Total Services</p>
                      <p className="text-3xl font-bold">{stats.totalServices || 0}</p>
                    </div>
                    <Star className="h-8 w-8 text-primary-foreground/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-success text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Active Services</p>
                      <p className="text-3xl font-bold">{stats.activeServices || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary-light text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">This Week</p>
                      <p className="text-3xl font-bold">{stats.thisWeekRequests || 0}</p>
                      <p className="text-xs text-white/70">New Requests</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Profile</p>
                      <p className="text-2xl font-bold">{stats.profileCompletion}%</p>
                      <p className="text-xs text-white/70">Complete</p>
                    </div>
                    <Award className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-foreground/80 text-sm font-medium">Service Requests</p>
                      <p className="text-3xl font-bold">{stats.contactRequests || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary-foreground/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-success text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Subscription</p>
                      <p className="text-xl font-bold capitalize">{stats.subscriptionPlan || 'Free'}</p>
                    </div>
                    <Star className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary-light text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Explore</p>
                      <p className="text-lg font-bold">Browse Services</p>
                    </div>
                    <Search className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Profile</p>
                      <p className="text-2xl font-bold">{stats.profileCompletion}%</p>
                      <p className="text-xs text-white/70">Complete</p>
                    </div>
                    <Award className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Expanded */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profile?.user_type === 'provider' ? (
                    <>
                       <Button 
                         variant="outline" 
                         className="h-20 flex-col gap-2 hover:bg-primary hover:text-white"
                         onClick={handleServiceModalOpen}
                       >
                         <PlusCircle className="h-6 w-6" />
                         ADD SERVICE
                       </Button>
                       <Button 
                         variant="outline" 
                         className="h-20 flex-col gap-2 hover:bg-primary hover:text-white"
                         onClick={() => {
                           setActiveTab('profile');
                           scrollToSection('profile-tab');
                         }}
                       >
                         <Settings className="h-6 w-6" />
                         EDIT PROFILE
                       </Button>
                       <Button 
                         variant="outline" 
                         className="h-20 flex-col gap-2 hover:bg-primary hover:text-white"
                         onClick={() => {
                           setActiveTab('requests');
                           scrollToSection('requests-tab');
                         }}
                       >
                         <Eye className="h-6 w-6" />
                         VIEW REQUESTS
                       </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2 hover:bg-primary hover:text-white"
                          onClick={() => window.location.href = '/browse'}
                        >
                          <Search className="h-6 w-6" />
                          BROWSE
                        </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 hover:bg-primary hover:text-white"
                        onClick={() => window.location.href = '/browse'}
                      >
                        <Search className="h-6 w-6" />
                        Browse Services
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 hover:bg-primary hover:text-white"
                        onClick={() => window.location.href = '/dashboard'}
                      >
                        <Eye className="h-6 w-6" />
                        My Requests
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 hover:bg-primary hover:text-white"
                        onClick={() => window.location.href = '/pricing'}
                      >
                        <Star className="h-6 w-6" />
                        Upgrade
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 hover:bg-primary hover:text-white"
                        onClick={() => window.location.href = '/dashboard'}
                      >
                        <Settings className="h-6 w-6" />
                        Profile
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rich Tabbed Experience for Providers */}
            {profile?.user_type === 'provider' && (
              <Card className="shadow-lg border-0 bg-background">
                <CardHeader className="bg-primary text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Provider Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   {/* Tabbed Interface */}
                   <div className="space-y-6">
                      {/* Tab Navigation */}
                       <div className="mb-6">
                         <div className="flex items-center justify-center">
                           <div className="inline-flex items-center bg-muted/30 p-1 rounded-full">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className={`px-4 py-2 rounded-full font-medium transition-all ${
                                activeTab === 'services' 
                                  ? 'bg-foreground text-background shadow-sm' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => setActiveTab('services')}
                            >
                              My Services ({stats.totalServices || 0})
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className={`px-4 py-2 rounded-full font-medium transition-all ${
                                activeTab === 'requests' 
                                  ? 'bg-foreground text-background shadow-sm' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => setActiveTab('requests')}
                            >
                              Client Requests
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className={`px-4 py-2 rounded-full font-medium transition-all ${
                                activeTab === 'verification' 
                                  ? 'bg-foreground text-background shadow-sm' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => setActiveTab('verification')}
                            >
                              Verification
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className={`px-4 py-2 rounded-full font-medium transition-all ${
                                activeTab === 'profile' 
                                  ? 'bg-foreground text-background shadow-sm' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => setActiveTab('profile')}
                            >
                              Profile
                            </Button>
                           </div>
                         </div>
                       </div>

                       {/* Tab Content */}
                       <div className="min-h-[300px]">
                         {activeTab === 'services' && <div id="services-tab" className="animate-fade-in"><MyServicesTab /></div>}
                         {activeTab === 'requests' && <div id="requests-tab" className="animate-fade-in"><ClientRequestsTab /></div>}
                         {activeTab === 'verification' && <div id="verification-tab" className="animate-fade-in"><VerificationTab /></div>}
                         {activeTab === 'profile' && <div id="profile-tab" className="animate-fade-in"><ProfileTab /></div>}
                       </div>

                  </div>
                </CardContent>
              </Card>
            )}
          </div>

            {/* Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Notifications */}
            <Card className="shadow-lg border-0 bg-background">
              <CardHeader className="bg-primary-light text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-white text-primary">
                      {notifications.filter(n => !n.read).length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          !notification.read 
                            ? 'bg-primary/5 border-primary/20 shadow-sm' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1 rounded-full ${
                            notification.type === 'success' ? 'bg-green-100' :
                            notification.type === 'warning' ? 'bg-yellow-100' :
                            notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                            {notification.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                            {notification.type === 'info' && <Bell className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                      <p className="text-xs text-gray-400 mt-1">We'll notify you about important updates</p>
                    </div>
                  )}
                </div>
                {notifications.length > 3 && (
                  <div className="mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary-dark">
                      View All Notifications
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Countdown - Show for non-admin users */}
            {profile?.user_type !== 'admin' && (
              <div className="transform hover:scale-105 transition-transform duration-200">
                <SubscriptionCountdown profile={profile} />
              </div>
            )}



          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onMarkAsRead={markNotificationAsRead}
      />

      {/* Service Modal */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onServiceCreated={handleServiceCreated}
      />
    </div>
  );
};