import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface GoogleMapsDisplayProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
  googleMapsApiKey?: string;
  zoom?: number;
  height?: string;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
    info?: string;
  }>;
}

declare global {
  interface Window {
    google: any;
    initGoogleMapsDisplay: () => void;
  }
}

export const GoogleMapsDisplay = ({
  latitude,
  longitude,
  address,
  className,
  googleMapsApiKey,
  zoom = 15,
  height = '300px',
  markers = []
}: GoogleMapsDisplayProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!googleMapsApiKey) {
      setError('Google Maps API key not provided');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsGoogleLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initGoogleMapsDisplay`;
    script.async = true;
    script.defer = true;

    window.initGoogleMapsDisplay = () => {
      setIsGoogleLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.initGoogleMapsDisplay;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (isGoogleLoaded && mapRef.current && (latitude && longitude)) {
      initializeMap();
    }
  }, [isGoogleLoaded, latitude, longitude]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !latitude || !longitude) return;

    const mapOptions = {
      center: { lat: latitude, lng: longitude },
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

    // Add main marker
    const mainMarker = new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: mapInstanceRef.current,
      title: address || 'Location',
      animation: window.google.maps.Animation.DROP
    });

    // Add info window for main marker
    if (address) {
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div class="p-2"><strong>${address}</strong></div>`
      });

      mainMarker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, mainMarker);
      });
    }

    // Add additional markers
    markers.forEach((marker, index) => {
      const mapMarker = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: mapInstanceRef.current,
        title: marker.title || `Marker ${index + 1}`,
        animation: window.google.maps.Animation.DROP
      });

      if (marker.info) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div class="p-2">${marker.info}</div>`
        });

        mapMarker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, mapMarker);
        });
      }
    });
  };

  if (error) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg border border-dashed border-muted-foreground/25",
          className
        )}
        style={{ height }}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-sm font-medium">Map Unavailable</div>
          <div className="text-xs mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg border border-dashed border-muted-foreground/25",
          className
        )}
        style={{ height }}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-sm font-medium">No Location Data</div>
          <div className="text-xs mt-1">Add an address to see the map</div>
        </div>
      </div>
    );
  }

  if (!isGoogleLoaded) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          className
        )}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-sm text-muted-foreground mt-2">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border", className)}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="bg-muted"
      />
    </div>
  );
};