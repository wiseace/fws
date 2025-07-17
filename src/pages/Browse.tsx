
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/database';
import { ModernServiceCard } from '@/components/ModernServiceCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchWithGeolocation } from '@/components/SearchWithGeolocation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const SERVICES_PER_PAGE = 9;

const Browse = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState<{
    search?: string;
    category?: string;
    location?: string;
    userLocation?: { lat: number; lng: number };
    minPrice?: number;
    maxPrice?: number;
    availabilityOnly?: boolean;
  }>({});

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchFilters]);

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select(`
        *,
        user:users(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (data) {
      const typedServices = data.map(service => ({
        ...service,
        contact_info: service.contact_info as { phone?: string; email?: string; }
      })) as Service[];
      setServices(typedServices);
    }
    setLoading(false);
  };

  const filterServices = () => {
    let filtered = [...services];

    if (searchFilters.search) {
      filtered = filtered.filter(service =>
        service.service_name.toLowerCase().includes(searchFilters.search!.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchFilters.search!.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchFilters.search!.toLowerCase())
      );
    }

    if (searchFilters.category) {
      filtered = filtered.filter(service => service.category === searchFilters.category);
    }

    if (searchFilters.location && searchFilters.location !== 'Current Location') {
      filtered = filtered.filter(service =>
        service.location?.toLowerCase().includes(searchFilters.location!.toLowerCase()) ||
        service.user?.service_location?.toLowerCase().includes(searchFilters.location!.toLowerCase()) ||
        service.user?.city_or_state?.toLowerCase().includes(searchFilters.location!.toLowerCase())
      );
    }

    if (searchFilters.minPrice) {
      filtered = filtered.filter(service => 
        (service.price_range_min && service.price_range_min >= searchFilters.minPrice!) ||
        (service.user?.price_range_min && service.user.price_range_min >= searchFilters.minPrice!)
      );
    }

    if (searchFilters.maxPrice) {
      filtered = filtered.filter(service => 
        (service.price_range_max && service.price_range_max <= searchFilters.maxPrice!) ||
        (service.user?.price_range_max && service.user.price_range_max <= searchFilters.maxPrice!)
      );
    }

    if (searchFilters.availabilityOnly) {
      filtered = filtered.filter(service => 
        service.user?.availability_status === 'available'
      );
    }

    setFilteredServices(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (filters: typeof searchFilters) => {
    console.log('Enhanced search filters:', filters);
    setSearchFilters(filters);
  };

  const handleClearFilters = () => {
    setSearchFilters({});
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredServices.length / SERVICES_PER_PAGE);
  const startIndex = (currentPage - 1) * SERVICES_PER_PAGE;
  const endIndex = startIndex + SERVICES_PER_PAGE;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const hasActiveFilters = Object.values(searchFilters).some(value => 
    value && value !== 'Current Location'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      {/* Hero Section with Enhanced Search */}
      <section className="pt-32 pb-16 bg-gradient-hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Find Professional Services
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Connect with verified service providers using our smart search
            </p>
          </div>
          
          {/* Enhanced Search Component */}
          <SearchWithGeolocation onSearch={handleSearch} className="max-w-4xl mx-auto" />
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Results Header */}
          {hasActiveFilters && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Search Results {filteredServices.length > 0 && `(${filteredServices.length} found)`}
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                {searchFilters.search && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Search: "{searchFilters.search}"
                  </Badge>
                )}
                {searchFilters.category && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Category: {searchFilters.category}
                  </Badge>
                )}
                {searchFilters.location && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Location: {searchFilters.location}
                  </Badge>
                )}
                {searchFilters.minPrice && searchFilters.maxPrice && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    ₦{searchFilters.minPrice.toLocaleString()} - ₦{searchFilters.maxPrice.toLocaleString()}
                  </Badge>
                )}
                {searchFilters.availabilityOnly && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Available Now
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="ml-2"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Finding services for you...</p>
            </div>
          ) : paginatedServices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
                {paginatedServices.map((service) => (
                  <ModernServiceCard
                    key={service.id}
                    service={service}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters 
                    ? "No services found matching your service and location. Try changing your search." 
                    : "We couldn't find any services. Try using the search above to find what you need."
                  }
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <p>Try searching for:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline">"AC repair Ajah"</Badge>
                    <Badge variant="outline">"Wedding makeup in Lagos"</Badge>
                    <Badge variant="outline">"Math tutor near me"</Badge>
                  </div>
                </div>
                <Button 
                  onClick={handleClearFilters}
                  className="rounded-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer editMode={false} />
    </div>
  );
};

export default Browse;
