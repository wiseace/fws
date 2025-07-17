
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Search, MapPin, Loader2, Navigation, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

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

export const SmartSearchBar = ({ onSearch, className = "" }: SmartSearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [availabilityOnly, setAvailabilityOnly] = useState(false);

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
    
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocation('');
    setUserLocation(null);
    setPriceRange([0, 50000]);
    setAvailabilityOnly(false);
    onSearch({});
  };

  const hasActiveFilters = searchTerm || location || priceRange[0] > 0 || priceRange[1] < 50000 || availabilityOnly;

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      {/* Main Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        {/* Service Search Input */}
        <div className="md:col-span-5">
          <div className="flex items-center px-4 py-3 bg-gray-50 border-0 rounded-xl hover:bg-gray-100 transition-colors">
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <Input
              placeholder="What service do you need? (e.g., AC repair, Wedding makeup, Math tutor)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent focus:ring-0 focus-visible:ring-0 text-gray-900 placeholder-gray-500 p-0 h-auto"
            />
          </div>
        </div>

        {/* Location Input */}
        <div className="md:col-span-4 flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center px-4 py-3 bg-gray-50 border-0 rounded-xl hover:bg-gray-100 transition-colors">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <Input
                placeholder="Enter your area (e.g., Lagos, Ajah, Port Harcourt)"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (e.target.value !== 'Current Location') {
                    setUserLocation(null);
                  }
                }}
                onKeyPress={handleKeyPress}
                className="border-0 bg-transparent focus:ring-0 focus-visible:ring-0 text-gray-900 placeholder-gray-500 p-0 h-auto"
              />
            </div>
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
