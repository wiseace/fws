
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SearchFilters {
  searchTerm?: string;
  location?: string;
  userLocation?: { lat: number; lng: number };
  minPrice?: number;
  maxPrice?: number;
  availabilityOnly?: boolean;
}

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

export const useSmartSearch = () => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['smartSearch', searchFilters],
    queryFn: async () => {
      if (!Object.keys(searchFilters).length) {
        return [];
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase.rpc('smart_search_providers', {
          search_term: searchFilters.searchTerm || '',
          search_location: searchFilters.location || '',
          min_price: searchFilters.minPrice || null,
          max_price: searchFilters.maxPrice || null,
          availability_only: searchFilters.availabilityOnly || false,
          user_lat: searchFilters.userLocation?.lat || null,
          user_lng: searchFilters.userLocation?.lng || null
        });

        if (error) {
          console.error('Smart search error:', error);
          throw error;
        }

        return data as SearchResult[] || [];
      } finally {
        setIsSearching(false);
      }
    },
    enabled: Object.keys(searchFilters).length > 0,
  });

  const performSearch = useCallback((filters: SearchFilters) => {
    console.log('Performing search with filters:', filters);
    setSearchFilters(filters);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchFilters({});
  }, []);

  return {
    searchResults: searchResults || [],
    isLoading: isLoading || isSearching,
    error,
    performSearch,
    clearSearch,
    hasSearched: Object.keys(searchFilters).length > 0,
    searchFilters
  };
};
