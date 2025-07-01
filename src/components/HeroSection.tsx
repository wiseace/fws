
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
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 min-h-[600px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg"
            defaultValue="Find Skilled Professionals Near You"
          />
          
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto drop-shadow-md"
            defaultValue="Connect with verified artisans, craftsmen, and service providers. Quality work, trusted professionals, verified credentials."
          />

          {/* Enhanced Search Bar with Geolocation */}
          <div className="max-w-5xl mx-auto mb-12">
            <SearchWithGeolocation 
              onSearch={handleSearch}
              className="shadow-2xl"
            />
          </div>

          {/* Popular Categories */}
          <div className="mt-12">
            <p className="text-blue-200 mb-6 text-lg">Popular Services:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Gardening'].map((category) => (
                <button
                  key={category}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium transition-all border border-white/20 hover:border-white/30"
                  onClick={() => window.location.href = `/browse?category=${category}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-800 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.href = '/browse'}
            >
              Find Services
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-800 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.href = '/auth'}
            >
              Join as Provider
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
