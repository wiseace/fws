import React from 'react';
import { EditableElement } from './EditableElement';
import { SearchWithGeolocation } from './SearchWithGeolocation';
import { ServicesMarquee } from './ServicesMarquee';

interface HeroSectionProps {
  editMode: boolean;
}

export const HeroSection = ({ editMode }: HeroSectionProps) => {

  const handleSearch = (filters: { search?: string; category?: string; location?: string; userLocation?: { lat: number; lng: number } }) => {
    console.log('Search filters:', filters);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.userLocation) {
      params.set('lat', filters.userLocation.lat.toString());
      params.set('lng', filters.userLocation.lng.toString());
    }
    window.location.href = `/browse?${params.toString()}`;
  };

  return (
    <>
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Static Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(/lovable-uploads/b5290578-d4c5-4295-98c6-10e9ff77ef30.png)`
          }}
        />
        
        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/50"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-8">
            <EditableElement
              editMode={editMode}
              type="text"
              className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl"
              defaultValue="Find skilled professionals near you"
            />
            
            <EditableElement
              editMode={editMode}
              type="text"
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto drop-shadow-lg"
              defaultValue="Connect with verified artisans, craftsmen, and service providers. Quality work, trusted professionals, verified credentials."
            />
          </div>
          
          {/* Search Component */}
          <SearchWithGeolocation 
            onSearch={handleSearch} 
            className="max-w-4xl mx-auto shadow-2xl backdrop-blur-sm" 
          />
        </div>
      </section>
      
      {/* Services Marquee */}
      <ServicesMarquee />
    </>
  );
};
