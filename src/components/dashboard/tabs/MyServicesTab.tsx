import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ServiceModal } from '@/components/ServiceModal';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Star, Edit, Trash2, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 5;

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
        setFilteredServices(typedServices);
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
    
    if (!query.trim()) {
      setFilteredServices(services);
      return;
    }

    const filtered = services.filter(service =>
      service.service_name.toLowerCase().includes(query.toLowerCase()) ||
      service.category.toLowerCase().includes(query.toLowerCase()) ||
      service.description?.toLowerCase().includes(query.toLowerCase()) ||
      service.location?.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredServices(filtered);
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
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  const startIndex = (currentPage - 1) * servicesPerPage;
  const endIndex = startIndex + servicesPerPage;
  const currentServices = filteredServices.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats and Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full text-sm font-medium">
            {activeServices} Active
          </div>
          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
            {services.length - activeServices} Inactive
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

      {/* Search Box */}
      {services.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search services by name, category, description, or location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

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
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg">
          <div className="mb-4">
            <Search className="h-16 w-16 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            No services match your search criteria. Try adjusting your search terms.
          </p>
        </div>
      ) : (
        <>
          {/* Services List */}
          <div className="space-y-4">
            {currentServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{service.service_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={service.is_active ? "default" : "secondary"}>
                              {service.category}
                            </Badge>
                            <Badge variant={service.is_active ? "default" : "secondary"}>
                              {service.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleServiceModalOpen(service)}
                            className="hover:bg-primary hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDelete(service.id)}
                            className="hover:bg-destructive hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {service.location && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {service.location}
                          </div>
                        )}
                        <span>
                          Created: {new Date(service.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredServices.length)} of {filteredServices.length} services
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
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