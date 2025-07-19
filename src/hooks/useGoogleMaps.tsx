import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleMapsPlace {
  formatted_address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  place_id?: string;
}

export interface GoogleMapsAutocompleteResult {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export const useGoogleMaps = () => {
  const getAutocomplete = useCallback(async (input: string): Promise<GoogleMapsAutocompleteResult[]> => {
    try {
      console.log('Making Google Maps autocomplete request for:', input);
      console.log('Calling supabase.functions.invoke with google-maps-proxy');
      
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          endpoint: 'places-autocomplete',
          input,
          types: 'address'
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      const predictions = data?.predictions || [];
      console.log('Extracted predictions:', predictions);
      return predictions;
    } catch (error) {
      console.error('Google Maps autocomplete error:', error);
      return [];
    }
  }, []);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<GoogleMapsPlace | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          endpoint: 'place-details',
          place_id: placeId,
          fields: 'formatted_address,address_components,geometry'
        }
      });

      if (error) throw error;

      const place = data?.result;
      if (!place) return null;

      const location = place.geometry?.location;
      if (!location) return null;

      // Extract address components
      const addressComponents = place.address_components || [];
      let city = '';
      let state = '';
      let country = '';
      let postal_code = '';

      addressComponents.forEach((component: any) => {
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

      return {
        formatted_address: place.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        city,
        state,
        country,
        postal_code,
        place_id: placeId
      };
    } catch (error) {
      console.error('Google Maps place details error:', error);
      return null;
    }
  }, []);

  const geocodeAddress = useCallback(async (address: string): Promise<GoogleMapsPlace | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          endpoint: 'geocode',
          address
        }
      });

      if (error) throw error;

      const result = data?.results?.[0];
      if (!result) return null;

      const location = result.geometry?.location;
      if (!location) return null;

      // Extract address components
      const addressComponents = result.address_components || [];
      let city = '';
      let state = '';
      let country = '';
      let postal_code = '';

      addressComponents.forEach((component: any) => {
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

      return {
        formatted_address: result.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        city,
        state,
        country,
        postal_code
      };
    } catch (error) {
      console.error('Google Maps geocode error:', error);
      return null;
    }
  }, []);

  return {
    getAutocomplete,
    getPlaceDetails,
    geocodeAddress
  };
};