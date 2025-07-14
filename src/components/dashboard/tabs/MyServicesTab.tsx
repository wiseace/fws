import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceModal } from '@/components/ServiceModal';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Star, Edit, Trash2, MapPin } from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  category: string;
  description: string | null;
  location: string | null;
  is_active: boolean;
  contact_info: { phone?: string; email?: string; };
  created_at: string;
  user_id: string;
  updated_at: string;
  image_url?: string | null;
}

export const MyServicesTab = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
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
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceModalOpen = (service?: Service) => {
    if (profile?.verification_status !== 'verified') {
      toast({
        title: "Verification Required",
        description: "You need to complete verification to create services. Please submit your verification documents first.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingService(service || null);
    setIsServiceModalOpen(true);
  };

  const handleServiceCreated = () => {
    fetchServices();
    setIsServiceModalOpen(false);
    setEditingService(null);
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
      
      fetchServices();
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
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeServices = services.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">My Services ({services.length})</h2>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full text-sm font-medium">
              {activeServices} Active
            </div>
            <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              {services.length - activeServices} Inactive
            </div>
          </div>
        </div>
        <Button 
          onClick={() => handleServiceModalOpen()}
          className="bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          ADD SERVICE
        </Button>
      </div>

      {/* Content */}
      {services.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg">
          <div className="mb-4">
            <Star className="h-16 w-16 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first service to start connecting with clients and showcase your expertise.
          </p>
          <Button 
            onClick={() => handleServiceModalOpen()}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            CREATE YOUR FIRST SERVICE
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{service.service_name}</h3>
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleServiceModalOpen(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Badge 
                  variant={service.is_active ? "default" : "secondary"} 
                  className="mb-3"
                >
                  {service.category}
                </Badge>
                
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {service.description}
                  </p>
                )}
                
                {service.location && (
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <MapPin className="h-3 w-3 mr-1" />
                    {service.location}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <Badge variant={service.is_active ? "default" : "secondary"}>
                    {service.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span>
                    {new Date(service.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        onServiceCreated={handleServiceCreated}
        service={editingService}
      />
    </div>
  );
};