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
  const servicesPerPage = 4;

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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">My Services</h2>
            <p className="text-muted-foreground">Manage and track your service offerings</p>
          </div>
          <Button 
            onClick={() => handleServiceModalOpen()}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg"
            size="lg"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create Service
          </Button>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-6">
          <div className="bg-brand-success text-white px-4 py-2 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">{activeServices} Active</span>
            </div>
          </div>
          <div className="bg-primary-light text-white px-4 py-2 rounded-lg shadow-sm">
            <span className="font-semibold">{services.length - activeServices} Inactive</span>
          </div>
          <div className="bg-primary text-white px-4 py-2 rounded-lg shadow-sm">
            <span className="font-semibold">{services.length} Total</span>
          </div>
        </div>
      </div>

      {/* Search Box */}
      {services.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Search services by name, category, description, or location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-11 h-12 bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/40 text-base"
          />
        </div>
      )}

      {/* Content */}
      {services.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/50">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto">
              <Star className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">No services yet</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
            Create your first service to start connecting with clients and showcase your expertise.
          </p>
          <Button 
            onClick={() => handleServiceModalOpen()}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg"
            size="lg"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create Your First Service
          </Button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/50">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full flex items-center justify-center mx-auto">
              <Search className="h-10 w-10 text-orange-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">No services found</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
            No services match your search criteria. Try adjusting your search terms.
          </p>
        </div>
      ) : (
        <>
          {/* Services Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {currentServices.map((service) => (
              <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-background to-muted/10 border border-border/50 hover:border-primary/30 overflow-hidden">
                <CardContent className="p-0">
                  {/* Service Image/Header */}
                  <div className={`relative h-32 border-b border-border/50 ${
                    service.image_url 
                      ? 'bg-cover bg-center' 
                      : 'bg-primary'
                  }`}
                  style={service.image_url ? { backgroundImage: `url(${service.image_url})` } : {}}>
                    {service.image_url && (
                      <div className="absolute inset-0 bg-black/50"></div>
                    )}
                    <div className="relative p-4 h-full flex items-center">
                      <div className="flex-1">
                        <h3 className={`font-bold text-xl transition-colors line-clamp-1 ${
                          service.image_url 
                            ? 'text-white group-hover:text-gray-200' 
                            : 'text-white group-hover:text-gray-200'
                        }`}>
                          {service.service_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline"
                            className="bg-transparent border-white text-white hover:bg-white hover:text-primary transition-all"
                          >
                            {service.category}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={service.is_active 
                              ? "bg-brand-success/30 border-brand-success text-white font-semibold shadow-sm hover:bg-brand-success hover:text-white animate-pulse transition-all" 
                              : "bg-primary-light/30 border-primary-light text-white font-semibold shadow-sm hover:bg-primary-light hover:text-white transition-all"
                            }
                          >
                            {service.is_active ? "● Active" : "○ Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 opacity-100 group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleServiceModalOpen(service)}
                          className="bg-white/10 backdrop-blur-sm text-white hover:bg-primary hover:text-white transition-all duration-200 h-8 w-8 p-0 shadow-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(service.id)}
                          className="bg-white/10 backdrop-blur-sm text-white hover:bg-destructive hover:text-white transition-all duration-200 h-8 w-8 p-0 shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Service Content */}
                  <div className="p-6">
                    {service.description && (
                      <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      {service.location && (
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium">{service.location}</span>
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        <span className="font-medium">Created</span> {new Date(service.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-gradient-to-r from-background to-muted/20 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground font-bold">{startIndex + 1}</span> to <span className="text-foreground font-bold">{Math.min(endIndex, filteredServices.length)}</span> of <span className="text-foreground font-bold">{filteredServices.length}</span> services
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="hover:bg-primary hover:text-white transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="bg-primary text-white px-3 py-1 rounded-md text-sm font-medium">
                  {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="hover:bg-primary hover:text-white transition-all duration-200"
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