
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchWithGeolocationProps {
  onSearch: (filters: { search?: string; category?: string; location?: string; userLocation?: { lat: number; lng: number } }) => void;
  className?: string;
}

export const SearchWithGeolocation = ({ onSearch, className = "" }: SearchWithGeolocationProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: categories, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Categories fetch error:', error);
          throw error;
        }
        return data || [];
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        return [];
      }
    }
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setLocationFilter('Current Location');
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
      search: searchTerm || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      location: locationFilter || undefined,
      userLocation: userLocation || undefined
    };
    
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="flex items-center px-4 border border-gray-200 rounded-lg">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <Input
            placeholder="What service do you need?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="border-gray-200 text-foreground font-medium data-[state=open]:ring-2 data-[state=open]:ring-primary">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-medium">All Categories</SelectItem>
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <SelectItem key={category.id} value={category.name} className="font-medium">
                  {category.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="loading" disabled>
                {isError ? 'Failed to load categories' : 'Loading categories...'}
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* Location Input with Geolocation */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center px-4 border border-gray-200 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-400 mr-3" />
            <Input
              placeholder="Enter location"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                if (e.target.value !== 'Current Location') {
                  setUserLocation(null);
                }
              }}
              onKeyPress={handleKeyPress}
              className="border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="shrink-0"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search Button */}
        <Button 
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Search
        </Button>
      </div>
    </div>
  );
};
