
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Search, MapPin, Loader2, Navigation, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SmartSearchBarProps {
  onSearch: (filters: {
    searchTerm?: string;
    location?: string;
    userLocation?: { lat: number; lng: number };
    minPrice?: number;
    maxPrice?: number;
    availabilityOnly?: boolean;
  }) => void;
  className?: string;
}

interface ServiceSuggestion {
  service_name: string;
  category: string;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

export const SmartSearchBar = ({ onSearch, className = "" }: SmartSearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [availabilityOnly, setAvailabilityOnly] = useState(false);

  // Service suggestions state
  const [serviceSuggestions, setServiceSuggestions] = useState<ServiceSuggestion[]>([]);
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Location suggestions state
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Refs for debouncing
  const serviceDebounceRef = useRef<NodeJS.Timeout>();
  const locationDebounceRef = useRef<NodeJS.Timeout>();

  // Fetch service suggestions from database
  const fetchServiceSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setServiceSuggestions([]);
      return;
    }

    setIsLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('service_name, category')
        .or(`service_name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(8);

      if (error) {
        console.error('Error fetching service suggestions:', error);
        return;
      }

      // Remove duplicates and limit results
      const uniqueSuggestions = data?.reduce((acc: ServiceSuggestion[], current) => {
        if (!acc.find(item => item.service_name === current.service_name)) {
          acc.push(current);
        }
        return acc;
      }, []) || [];

      setServiceSuggestions(uniqueSuggestions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching service suggestions:', error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  // Fetch location suggestions from Nominatim API
  const fetchLocationSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsLoadingLocations(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=ng&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setLocationSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Handle service input change with debouncing
  const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (serviceDebounceRef.current) {
      clearTimeout(serviceDebounceRef.current);
    }

    serviceDebounceRef.current = setTimeout(() => {
      fetchServiceSuggestions(value);
      setShowServiceSuggestions(true);
    }, 300);
  };

  // Handle location input change with debouncing
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    
    // Clear user location if manually typing
    if (value !== 'Current Location') {
      setUserLocation(null);
    }

    if (locationDebounceRef.current) {
      clearTimeout(locationDebounceRef.current);
    }

    locationDebounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
      setShowLocationSuggestions(true);
    }, 300);
  };

  // Handle service suggestion selection - now triggers search immediately
  const handleServiceSuggestionClick = (suggestion: ServiceSuggestion) => {
    setSearchTerm(suggestion.service_name);
    setServiceSuggestions([]);
    setShowServiceSuggestions(false);
    
    console.log('Service suggestion clicked:', suggestion.service_name);
    
    // Automatically trigger search for this service
    const filters = {
      searchTerm: suggestion.service_name,
      location: location || undefined,
      userLocation: userLocation || undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
      availabilityOnly: availabilityOnly || undefined
    };
    
    console.log('Triggering search with filters:', filters);
    onSearch(filters);
  };

  // Handle location suggestion selection
  const handleLocationSuggestionClick = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.display_name);
    setUserLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(currentLocation);
        setLocation('Current Location');
        setIsGettingLocation(false);
        toast.success('Location detected successfully');
      },
      (error) => {
        setIsGettingLocation(false);
        console.error('Geolocation error:', error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out.');
            break;
          default:
            toast.error('Failed to get your location.');
            break;
        }
      },
      {
        timeout: 10000,
        enableHighAccuracy: true
      }
    );
  };

  const handleSearch = () => {
    const filters = {
      searchTerm: searchTerm || undefined,
      location: location || undefined,
      userLocation: userLocation || undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
      availabilityOnly: availabilityOnly || undefined
    };
    
    console.log('Manual search triggered with filters:', filters);
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Hide suggestions
      setShowServiceSuggestions(false);
      setShowLocationSuggestions(false);
      handleSearch();
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocation('');
    setUserLocation(null);
    setPriceRange([0, 50000]);
    setAvailabilityOnly(false);
    setServiceSuggestions([]);
    setLocationSuggestions([]);
    setShowServiceSuggestions(false);
    setShowLocationSuggestions(false);
    onSearch({});
  };

  const hasActiveFilters = searchTerm || location || priceRange[0] > 0 || priceRange[1] < 50000 || availabilityOnly;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (serviceDebounceRef.current) {
        clearTimeout(serviceDebounceRef.current);
      }
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      {/* Main Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        {/* Service Search Input with Suggestions */}
        <div className="md:col-span-5 relative">
          <div className="flex items-center px-4 py-3 bg-gray-50 border-0 rounded-xl hover:bg-gray-100 transition-colors">
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <Input
              placeholder="What service do you need? (e.g., AC repair, Wedding makeup, Math tutor)"
              value={searchTerm}
              onChange={handleServiceInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => serviceSuggestions.length > 0 && setShowServiceSuggestions(true)}
              onBlur={() => setTimeout(() => setShowServiceSuggestions(false), 200)}
              className="border-0 bg-transparent focus:ring-0 focus-visible:ring-0 text-gray-900 placeholder-gray-500 p-0 h-auto"
            />
            {isLoadingServices && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
          
          {/* Service Suggestions Dropdown */}
          {showServiceSuggestions && serviceSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-60 overflow-y-auto">
              {serviceSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => handleServiceSuggestionClick(suggestion)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{suggestion.service_name}</span>
                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{suggestion.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location Input with Suggestions */}
        <div className="md:col-span-4 flex items-center gap-2">
          <div className="flex-1 relative">
            <div className="flex items-center px-4 py-3 bg-gray-50 border-0 rounded-xl hover:bg-gray-100 transition-colors">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <Input
                placeholder="Enter your area (e.g., Lagos, Ajah, Port Harcourt)"
                value={location}
                onChange={handleLocationInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                className="border-0 bg-transparent focus:ring-0 focus-visible:ring-0 text-gray-900 placeholder-gray-500 p-0 h-auto"
              />
              {isLoadingLocations && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            
            {/* Location Suggestions Dropdown */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-60 overflow-y-auto">
                {locationSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => handleLocationSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-gray-900 text-sm">{suggestion.display_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="h-12 w-12 shrink-0 bg-gray-50 border-0 rounded-xl hover:bg-gray-100 transition-colors"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="h-12 w-12 shrink-0"
            title="More filters"
          >
            <Filter className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={handleSearch}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-md"
          >
            SEARCH
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Price Range: ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={50000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>₦0</span>
                <span>₦50,000+</span>
              </div>
            </div>

            {/* Availability Filter */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Show Available Only
                </label>
                <p className="text-xs text-gray-500">
                  Only show providers available right now
                </p>
              </div>
              <Switch
                checked={availabilityOnly}
                onCheckedChange={setAvailabilityOnly}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
