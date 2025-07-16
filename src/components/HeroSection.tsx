
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableElement } from './EditableElement';
import { SearchWithGeolocation } from './SearchWithGeolocation';

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

  try {
    return (
      <section className="relative py-20 pt-32 min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/lovable-uploads/192e50f4-9f3a-4668-bb0b-91e3529dae51.png)'
          }}
        />
        
        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/40"></div>
        
        {/* Additional subtle pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-2xl animate-fade-in-up"
            defaultValue="Find skilled professionals near you"
          />
          
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto drop-shadow-lg animate-fade-in-up"
            defaultValue="Connect with verified artisans, craftsmen, and service providers. Quality work, trusted professionals, verified credentials."
          />

          {/* Enhanced Search Bar with Geolocation */}
          <div className="max-w-5xl mx-auto mb-12 animate-fade-in-up">
            <SearchWithGeolocation 
              onSearch={handleSearch}
              className="shadow-2xl backdrop-blur-sm"
            />
          </div>

          {/* Popular Categories */}
          <div className="mt-12 animate-fade-in-up">
            <p className="text-white/80 mb-6 text-lg font-medium drop-shadow-md">Popular Services:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Gardening'].map((category) => (
                <button
                  key={category}
                  className="bg-white/80 hover:bg-white backdrop-blur-sm text-gray-700 hover:text-gray-900 px-6 py-3 rounded-full text-sm font-medium transition-all border border-gray-200 hover:border-gray-300 hover:scale-105 transform shadow-sm hover:shadow-md"
                  onClick={() => window.location.href = `/browse?category=${category}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              onClick={() => window.location.href = '/browse'}
            >
              Find Services
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-white/10 backdrop-blur-sm"
              onClick={() => window.location.href = '/auth'}
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Discover How
            </Button>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('HeroSection render error:', error);
    // Fallback content if there's any rendering error
    return (
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 min-h-[600px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
            Find Skilled Professionals Near You
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto drop-shadow-md">
            Connect with verified artisans, craftsmen, and service providers. Quality work, trusted professionals, verified credentials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-800 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl"
              onClick={() => window.location.href = '/browse'}
            >
              Find Services
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-800 px-8 py-4 text-lg font-semibold rounded-xl"
              onClick={() => window.location.href = '/auth'}
            >
              Join as Provider
            </Button>
          </div>
        </div>
      </section>
    );
  }
};
