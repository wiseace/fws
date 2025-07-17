import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/database';
import { ModernServiceCard } from '@/components/ModernServiceCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PROVIDERS_PER_PAGE = 12;

const Providers = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [locationFilter, setLocationFilter] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchServicesAndCategories();
  }, []);

  useEffect(() => {
    filterAndSortServices();
  }, [services, searchTerm, selectedCategory, sortBy, locationFilter]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      generateSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, services]);

  const fetchServicesAndCategories = async () => {
    setLoading(true);
    
    // Fetch unique providers instead of individual services
    const { data: servicesData } = await supabase
      .from('services')
      .select(`
        *,
        user:users(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('name')
      .order('name');

    if (servicesData) {
      const typedServices = servicesData.map(service => ({
        ...service,
        contact_info: service.contact_info as { phone?: string; email?: string; }
      })) as Service[];
      
      // Group services by user to show unique providers only
      const uniqueProviders = typedServices.reduce((acc, service) => {
        const existingProvider = acc.find(s => s.user_id === service.user_id);
        if (!existingProvider) {
          acc.push(service);
        }
        return acc;
      }, [] as Service[]);
      
      setServices(uniqueProviders);
      
      // Extract unique categories from services
      const serviceCategories = [...new Set(servicesData.map(s => s.category))];
      const dbCategories = categoriesData?.map(c => c.name) || [];
      const allCategories = [...new Set([...serviceCategories, ...dbCategories])];
      setCategories(allCategories);
    }
    
    setLoading(false);
  };

  const generateSuggestions = () => {
    const serviceSuggestions = services
      .filter(service => 
        service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(service => service.service_name)
      .slice(0, 5);

    const locationSuggestions = services
      .filter(service => 
        service.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(service => service.location)
      .filter(Boolean)
      .slice(0, 3);

    setSuggestions([...new Set([...serviceSuggestions, ...locationSuggestions])]);
    setShowSuggestions(true);
  };

  const filterAndSortServices = () => {
    let filtered = [...services];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(service =>
        service.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.service_name.localeCompare(b.service_name));
        break;
      case 'verified':
        filtered.sort((a, b) => (b.user?.is_verified ? 1 : 0) - (a.user?.is_verified ? 1 : 0));
        break;
    }

    setFilteredServices(filtered);
    setCurrentPage(1);
  };

  const handleSearchSelect = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setLocationFilter('');
    setSortBy('latest');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredServices.length / PROVIDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROVIDERS_PER_PAGE;
  const endIndex = startIndex + PROVIDERS_PER_PAGE;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || locationFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Service Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Discover verified professionals ready to serve you
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Box with Suggestions */}
            <div className="relative md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search for providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSearchSelect(suggestion)}
                    >
                      <div className="flex items-center">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Sort and Category */}
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort and Results Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6">
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="verified">Verified First</SelectItem>
                </SelectContent>
              </Select>
              
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600">
              {filteredServices.length} provider{filteredServices.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchTerm && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Search: "{searchTerm}"
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Category: {selectedCategory}
                </Badge>
              )}
              {locationFilter && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Location: {locationFilter}
                </Badge>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Providers Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading providers...</p>
            </div>
          ) : paginatedServices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
                {paginatedServices.map((service) => (
                  <div key={service.id} className="animate-fade-in-up">
                    <ModernServiceCard service={service} />
                  </div>
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
                      
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No providers found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any providers matching your criteria. Try adjusting your search or filters.
                </p>
                <Button onClick={clearFilters} className="rounded-full">
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

export default Providers;