
import { ModernServiceCard } from '@/components/ModernServiceCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MapPin, Clock, Star } from 'lucide-react';
import { Service } from '@/types/database';

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
  searchFilters: any;
  onClearSearch: () => void;
}

export const SmartSearchResults = ({ 
  results, 
  isLoading, 
  hasSearched, 
  searchFilters,
  onClearSearch 
}: SmartSearchResultsProps) => {
  // Convert search results to Service format for ModernServiceCard
  const convertToService = (result: SearchResult): Service => ({
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
    tags: result.tags,
    user: {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });

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

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Found {results.length} provider{results.length !== 1 ? 's' : ''}
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
            {searchFilters.availabilityOnly && (
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

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((result) => (
          <div key={result.service_id} className="relative">
            <ModernServiceCard service={convertToService(result)} />
            {/* Match Score Badge */}
            {result.match_score > 70 && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-green-500 text-white">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Best Match
                </Badge>
              </div>
            )}
            {/* Availability Status */}
            {result.availability_status === 'available' && (
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Available
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
