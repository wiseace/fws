import React, { useState, useEffect } from 'react';
import { EditableElement } from './EditableElement';
import { SearchWithGeolocation } from './SearchWithGeolocation';
import artisan1 from '@/assets/african-artisan-1.jpg';
import artisan2 from '@/assets/african-artisan-2.jpg';
import artisan3 from '@/assets/african-artisan-3.jpg';
import artisan4 from '@/assets/african-artisan-4.jpg';

interface HeroSectionProps {
  editMode: boolean;
}

const artisanImages = [artisan1, artisan2, artisan3, artisan4];

export const HeroSection = ({ editMode }: HeroSectionProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Image slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % artisanImages.length);
    }, 8000); // Change image every 8 seconds

    return () => clearInterval(interval);
  }, []);

  try {
    return (
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700">
        {/* Background Image Slideshow with Ken Burns Effect */}
        <div className="absolute inset-0">
          {artisanImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-2000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="w-full h-full bg-cover bg-center bg-no-repeat animate-ken-burns"
                style={{
                  backgroundImage: `url(${image})`,
                  animationDuration: '20s',
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out'
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/50"></div>
        
        {/* Additional subtle pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-8">
            <EditableElement
              editMode={editMode}
              type="text"
              className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl animate-fade-in"
              defaultValue="Find skilled professionals near you"
            />
            
            <EditableElement
              editMode={editMode}
              type="text"
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto drop-shadow-lg animate-fade-in"
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
    );
  } catch (error) {
    console.error('HeroSection render error:', error);
    // Fallback content if there's any rendering error
    return (
      <section className="pt-32 pb-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Find Professional Services
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Connect with verified service providers in your area
            </p>
          </div>
          
          {/* Search Component */}
          <SearchWithGeolocation 
            onSearch={handleSearch} 
            className="max-w-4xl mx-auto" 
          />
        </div>
      </section>
    );
  }
};