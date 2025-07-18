
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ModernProviderCard } from '@/components/ModernProviderCard';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SmartSearchBar } from '@/components/SmartSearchBar';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { SmartSearchResults } from '@/components/SmartSearchResults';
import type { Provider } from '@/types/database';
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
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const { searchResults, isLoading: isSearching, performSearch, clearSearch, hasSearched, searchFilters } = useSmartSearch();

  useEffect(() => {
    fetchAllProviders();
  }, []);

  const fetchAllProviders = async () => {
    setLoading(true);
    
    try {
      console.log('Fetching providers for non-logged-in users...');
      
      // Fetch all verified providers with their services
      const { data: providersData, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          user_type,
          is_verified,
          verification_status,
          profile_image_url,
          subscription_status,
          subscription_plan,
          can_access_contact,
          skills,
          tags,
          service_location,
          city_or_state,
          availability_status,
          price_range_min,
          price_range_max,
          last_active,
          created_at,
          updated_at,
          services!inner(
            id,
            service_name,
            category,
            description,
            image_url,
            location,
            contact_info,
            is_active,
            created_at,
            updated_at,
            price_range_min,
            price_range_max,
            skills,
            tags
          )
        `)
        .eq('user_type', 'provider')
        .eq('is_verified', true)
        .eq('verification_status', 'verified')
        .neq('subscription_plan', 'free')
        .eq('services.is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching providers:', error);
        return;
      }

      console.log('Fetched providers:', providersData);

      if (providersData) {
        // Group services by provider to avoid duplicates
        const uniqueProviders = providersData.reduce((acc: Provider[], current) => {
          const existingProvider = acc.find(p => p.id === current.id);
          
          if (existingProvider) {
            // Add service to existing provider if not already included
            const serviceExists = existingProvider.services.some(s => 
              current.services.some(cs => cs.id === s.id)
            );
            if (!serviceExists) {
              // Add user_id to each service
              const servicesWithUserId = current.services.map(service => ({
                ...service,
                user_id: current.id
              }));
              existingProvider.services.push(...servicesWithUserId);
            }
          } else {
            // Add new provider with services that include user_id
            const servicesWithUserId = current.services.map(service => ({
              ...service,
              user_id: current.id
            }));
            
            acc.push({
              ...current,
              user_type: 'provider' as const,
              verification_status: current.verification_status || 'not_verified',
              services: servicesWithUserId
            } as Provider);
          }
          
          return acc;
        }, []);
        
        setProviders(uniqueProviders);
      }
    } catch (error) {
      console.error('Error in fetchAllProviders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSearch = (filters: any) => {
    console.log('Smart search triggered with:', filters);
    performSearch({
      searchTerm: filters.searchTerm,
      location: filters.location,
      userLocation: filters.userLocation,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      availabilityOnly: filters.availabilityOnly
    });
  };

  const handleClearSearch = () => {
    clearSearch();
    // Reset to show all providers when search is cleared
    setCurrentPage(1);
  };

  // For pagination, work with unique providers
  const totalPages = Math.ceil(providers.length / PROVIDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROVIDERS_PER_PAGE;
  const endIndex = startIndex + PROVIDERS_PER_PAGE;
  const paginatedProviders = providers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [hasSearched, searchResults.length, providers.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Find Service Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Discover verified professionals using our smart search
            </p>
          </div>
          
          {/* Smart Search Component */}
          <SmartSearchBar onSearch={handleSmartSearch} className="max-w-6xl mx-auto" />
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {hasSearched ? (
            <SmartSearchResults
              results={searchResults}
              isLoading={isSearching}
              hasSearched={hasSearched}
              searchFilters={searchFilters}
              onClearSearch={handleClearSearch}
            />
          ) : (
            <>
              {/* Default Results Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Verified Providers
                  </h3>
                  <p className="text-sm text-gray-600">
                    {providers.length} verified provider{providers.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>

              {/* Providers Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Loading providers...</p>
                </div>
              ) : paginatedProviders.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {paginatedProviders.map((provider) => (
                      <div key={provider.id} className="animate-fade-in-up">
                        <ModernProviderCard provider={provider} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination - only show if not searching and there are multiple pages */}
                  {!hasSearched && totalPages > 1 && (
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
                      We couldn't find any providers. Try using the search above to find what you need.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer editMode={false} />
    </div>
  );
};

export default Providers;
