import { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { useGoogleMaps, GoogleMapsAutocompleteResult, GoogleMapsPlace } from '@/hooks/useGoogleMaps';

interface SecureGooglePlacesInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onPlaceSelect?: (place: GoogleMapsPlace) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SecureGooglePlacesInput = ({ 
  value = '', 
  onChange, 
  onPlaceSelect,
  placeholder = "Enter address", 
  disabled, 
  className
}: SecureGooglePlacesInputProps) => {
  const [suggestions, setSuggestions] = useState<GoogleMapsAutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { getAutocomplete, getPlaceDetails } = useGoogleMaps();

  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await getAutocomplete(query);
      setSuggestions(results);
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

  const handleSuggestionClick = async (suggestion: GoogleMapsAutocompleteResult) => {
    setLoading(true);
    try {
      const placeDetails = await getPlaceDetails(suggestion.place_id);
      if (placeDetails) {
        onChange?.(placeDetails.formatted_address);
        onPlaceSelect?.(placeDetails);
      } else {
        onChange?.(suggestion.description);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      onChange?.(suggestion.description);
    } finally {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }
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
              <div className="font-medium">
                {suggestion.structured_formatting?.main_text || suggestion.description}
              </div>
              {suggestion.structured_formatting?.secondary_text && (
                <div className="text-xs text-muted-foreground">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              )}
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