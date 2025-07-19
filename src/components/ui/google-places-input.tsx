import { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface GooglePlacesInputProps {
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
  googleMapsApiKey?: string;
}

interface GooglePlace {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const GooglePlacesInput = ({ 
  value = '', 
  onChange, 
  onPlaceSelect,
  placeholder = "Enter address", 
  disabled, 
  className,
  googleMapsApiKey 
}: GooglePlacesInputProps) => {
  const [loading, setLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!googleMapsApiKey) {
      console.warn('Google Maps API key not provided');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsGoogleLoaded(true);
      initializeAutocomplete();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      setIsGoogleLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.initGoogleMaps;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (isGoogleLoaded && inputRef.current) {
      initializeAutocomplete();
    }
  }, [isGoogleLoaded]);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['address'],
        fields: ['formatted_address', 'address_components', 'geometry', 'place_id']
      }
    );

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    setLoading(true);
    const place: GooglePlace = autocompleteRef.current.getPlace();

    if (place.formatted_address && place.geometry) {
      const latitude = place.geometry.location.lat();
      const longitude = place.geometry.location.lng();

      // Extract address components
      const addressComponents = place.address_components || [];
      let city = '';
      let state = '';
      let country = '';
      let postal_code = '';

      addressComponents.forEach((component) => {
        const types = component.types;
        
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        } else if (types.includes('postal_code')) {
          postal_code = component.long_name;
        }
      });

      const placeData = {
        formatted_address: place.formatted_address,
        latitude,
        longitude,
        city,
        state,
        country,
        postal_code
      };

      onChange?.(place.formatted_address);
      onPlaceSelect?.(placeData);
    }

    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  // Fallback to regular input if Google Maps not available
  if (!googleMapsApiKey || !isGoogleLoaded) {
    return (
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          autoComplete="address-line1"
        />
        {!googleMapsApiKey && (
          <div className="text-xs text-muted-foreground mt-1">
            Google Places API not configured
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="address-line1"
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};