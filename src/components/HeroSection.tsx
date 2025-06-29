
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditableElement } from './EditableElement';
import { useState } from 'react';

interface HeroSectionProps {
  editMode: boolean;
}

export const HeroSection = ({ editMode }: HeroSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (location) params.set('location', location);
    window.location.href = `/browse?${params.toString()}`;
  };

  return (
    <section 
      className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 min-h-[600px] flex items-center"
      style={{
        backgroundImage: `linear-gradient(rgba(30, 58, 138, 0.8), rgba(30, 64, 175, 0.8)), url('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1920&h=1080&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
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

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row gap-4 mb-12">
          <div className="flex-1 flex items-center px-4">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <Input
              placeholder="What service do you need?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus:ring-0 text-gray-900 placeholder-gray-500 text-lg"
            />
          </div>
          
          <div className="flex-1 flex items-center px-4 border-l border-gray-200">
            <MapPin className="w-5 h-5 text-gray-400 mr-3" />
            <Input
              placeholder="Enter your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-0 focus:ring-0 text-gray-900 placeholder-gray-500 text-lg"
            />
          </div>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            onClick={handleSearch}
          >
            Search Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
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
};
