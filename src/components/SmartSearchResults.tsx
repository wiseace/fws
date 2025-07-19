import { ModernProviderCard } from '@/components/ModernProviderCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MapPin, Clock, Star } from 'lucide-react';
import { Provider } from '@/types/database';

interface SearchResult {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  profile_image_url: string;
  skills: string[];
  tags: string[];
  service_location: string;
  city_or_state: string;
  availability_status: string;
  price_range_min: number;
  price_range_max: number;
  last_active: string;
  service_id: string;
  service_name: string;
  service_description: string;
  service_category: string;
  service_price_min: number;
  service_price_max: number;
  match_score: number;
}

interface SmartSearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  searchFilters: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: boolean;
    searchTerm?: string;
    availabilityOnly?: boolean;
  };
  onClearSearch: () => void;
}

export const SmartSearchResults = ({ 
  results, 
  isLoading, 
  hasSearched, 
  searchFilters,
  onClearSearch 
}: SmartSearchResultsProps) => {
  // Convert search results to Provider format, grouping services by provider
  const convertToProviders = (searchResults: SearchResult[]): Provider[] => {
    const providersMap = new Map<string, Provider>();

    searchResults.forEach((result) => {
      const providerId = result.user_id;
      
      // Create service object for this result
      const service = {
        id: result.service_id,
        user_id: result.user_id,
        service_name: result.service_name,
        category: result.service_category,
        description: result.service_description || 'Professional service provider',
        contact_info: {
          phone: result.phone || '',
          email: result.email || ''
        },
        location: result.service_location || result.city_or_state || '',
        image_url: result.profile_image_url,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        price_range_min: result.service_price_min || result.price_range_min,
        price_range_max: result.service_price_max || result.price_range_max,
        skills: result.skills,
        tags: result.tags
      };

      if (providersMap.has(providerId)) {
        // Add service to existing provider
        const existingProvider = providersMap.get(providerId)!;
        existingProvider.services.push(service);
      } else {
        // Create new provider
        const provider: Provider = {
          id: result.user_id,
          name: result.name || 'Service Provider',
          email: result.email || '',
          phone: result.phone || '',
          user_type: 'provider' as const,
          is_verified: true,
          subscription_status: 'monthly' as const,
          verification_status: 'verified' as const,
          profile_image_url: result.profile_image_url,
          availability_status: result.availability_status,
          skills: result.skills,
          tags: result.tags,
          service_location: result.service_location,
          city_or_state: result.city_or_state,
          price_range_min: result.price_range_min,
          price_range_max: result.price_range_max,
          last_active: result.last_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          services: [service],
          can_access_contact: true,
          subscription_plan: 'monthly' as const
        };
        
        providersMap.set(providerId, provider);
      }
    });

    return Array.from(providersMap.values());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Searching for the best providers...</p>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Search for Services</h3>
          <p className="text-gray-600">
            Use the search bar above to find verified providers for your needs.
          </p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No providers found</h3>
          <p className="text-gray-600 mb-6">
            No providers found matching your search criteria. Try adjusting your search terms or expanding your location.
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <p>Try searching for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">"Hair styling"</Badge>
              <Badge variant="outline">"Plumbing repair"</Badge>
              <Badge variant="outline">"Web design"</Badge>
            </div>
          </div>
          <Button onClick={onClearSearch} className="rounded-full">
            Clear Search
          </Button>
        </div>
      </div>
    );
  }

  const providers = convertToProviders(results);

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Found {providers.length} provider{providers.length !== 1 ? 's' : ''} offering {results.length} service{results.length !== 1 ? 's' : ''}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {searchFilters.searchTerm && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Service: "{searchFilters.searchTerm}"
              </Badge>
            )}
            {searchFilters.location && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <MapPin className="w-3 h-3 mr-1" />
                {searchFilters.location}
              </Badge>
            )}
            {searchFilters.availability && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <Clock className="w-3 h-3 mr-1" />
                Available Now
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={onClearSearch}>
          Clear Search
        </Button>
      </div>

      {/* Results Grid - Show Provider Cards without overlapping badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {providers.map((provider) => (
          <div key={provider.id} className="relative">
            <ModernProviderCard provider={provider} />
            {/* Show match score for the best matching service */}
            {(() => {
              const bestMatch = results
                .filter(r => r.user_id === provider.id)
                .reduce((best, current) => current.match_score > best.match_score ? current : best);
              
              return bestMatch.match_score > 70 && (
                <div className="absolute top-2 left-2 z-20">
                  <Badge className="bg-green-500 text-white shadow-lg">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Best Match
                  </Badge>
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
};
