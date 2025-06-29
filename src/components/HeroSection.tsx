
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditableElement } from './EditableElement';

interface HeroSectionProps {
  editMode: boolean;
}

export const HeroSection = ({ editMode }: HeroSectionProps) => {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <EditableElement
          editMode={editMode}
          type="text"
          className="text-5xl md:text-6xl font-bold mb-6"
          defaultValue="Find Who You Need"
        />
        
        <EditableElement
          editMode={editMode}
          type="text"
          className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto"
          defaultValue="Discover talented professionals, experts, and service providers in your area. Connect with the right people for your needs."
        />

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-2 flex flex-col md:flex-row gap-2">
          <div className="flex-1 flex items-center px-4">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <Input
              placeholder="What are you looking for?"
              className="border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div className="flex-1 flex items-center px-4 border-l border-gray-200">
            <MapPin className="w-5 h-5 text-gray-400 mr-3" />
            <Input
              placeholder="Location"
              className="border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
            Search
          </Button>
        </div>

        {/* Popular Categories */}
        <div className="mt-12">
          <p className="text-blue-200 mb-4">Popular Categories:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Consultants', 'Designers', 'Developers', 'Photographers', 'Writers', 'Coaches'].map((category) => (
              <button
                key={category}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-white px-4 py-2 rounded-full text-sm transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
