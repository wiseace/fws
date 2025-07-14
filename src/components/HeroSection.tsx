
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
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-gray-900 py-20 pt-32 min-h-screen flex items-center relative overflow-hidden">
        {/* Creative background elements inspired by the image */}
        <div className="absolute inset-0">
          {/* Large decorative shapes */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute bottom-32 left-20 w-48 h-48 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-2xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
          
          {/* Floating service icons/elements */}
          <div className="absolute top-32 right-1/3 w-16 h-16 bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl shadow-lg animate-float" style={{ animationDelay: '0.5s', transform: 'rotate(15deg)' }}></div>
          <div className="absolute top-48 right-1/4 w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-xl shadow-lg animate-float" style={{ animationDelay: '1.5s', transform: 'rotate(-20deg)' }}></div>
          <div className="absolute bottom-48 right-1/5 w-14 h-14 bg-gradient-to-br from-blue-200 to-blue-300 rounded-2xl shadow-lg animate-float" style={{ animationDelay: '1s', transform: 'rotate(25deg)' }}></div>
          <div className="absolute top-64 right-2/3 w-10 h-10 bg-gradient-to-br from-purple-200 to-purple-300 rounded-lg shadow-lg animate-float" style={{ animationDelay: '2.5s', transform: 'rotate(-15deg)' }}></div>
          <div className="absolute bottom-40 right-1/2 w-18 h-18 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-2xl shadow-lg animate-float" style={{ animationDelay: '0.8s', transform: 'rotate(10deg)' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 animate-fade-in-up"
            defaultValue="Find skilled professionals near you"
          />
          
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-xl md:text-2xl mb-12 text-gray-700 max-w-3xl mx-auto animate-fade-in-up"
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
            <p className="text-gray-600 mb-6 text-lg font-medium">Popular Services:</p>
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
              className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              onClick={() => window.location.href = '/browse'}
            >
              Find Services
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-white/80 backdrop-blur-sm"
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
