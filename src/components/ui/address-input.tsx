import { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { SecureGooglePlacesInput } from './secure-google-places-input';
import { cn } from '@/lib/utils';

interface AddressInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onPlaceSelect?: (place: {
    formatted_address: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  useGooglePlaces?: boolean;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

export const AddressInput = ({ 
  value = '', 
  onChange, 
  onPlaceSelect,
  placeholder = "Enter address", 
  disabled, 
  className,
  useGooglePlaces = false
}: AddressInputProps) => {
  console.log('AddressInput rendered with useGooglePlaces:', useGooglePlaces);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    
    // Debounce the search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      searchAddresses(newValue);
      setShowSuggestions(true);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange?.(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Use Google Places if enabled (through secure edge function)
  if (useGooglePlaces) {
    console.log('Using Google Places for address input');
    return (
      <SecureGooglePlacesInput
        value={value}
        onChange={onChange}
        onPlaceSelect={onPlaceSelect}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    );
  }

  // Fallback to Nominatim (OpenStreetMap) implementation
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="address-line1"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm border-b last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.display_name}
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};