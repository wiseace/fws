import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingWizard } from '@/components/dashboard/OnboardingWizard';
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
  Phone,
  HelpCircle
} from 'lucide-react';

export const NewDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { showWizard, dismissWizard, showWizardManually, onboardingProgress, refreshOnboardingStatus } = useOnboarding();
  const [services, setServices] = useState<Service[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile]);

  // Refresh onboarding status when services change
  useEffect(() => {
    if (services.length > 0) {
      refreshOnboardingStatus();
    }
  }, [services, refreshOnboardingStatus]);

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
        {/* Onboarding Wizard */}
        <OnboardingWizard
          isVisible={showWizard}
          onClose={dismissWizard}
        />

        <Header editMode={false} onToggleEdit={() => {}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
          {/* Rich Dashboard Overview */}
          <RichDashboard />

        </div>
        
        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};