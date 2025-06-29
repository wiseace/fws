
import { useState } from 'react';
import { Menu, X, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  editMode: boolean;
  onToggleEdit: () => void;
}

export const Header = ({ editMode, onToggleEdit }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">
              FindWho
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Directory</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Categories</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onToggleEdit}
              className={editMode ? "bg-blue-100 border-blue-300" : ""}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {editMode ? 'Exit Edit' : 'Edit Mode'}
            </Button>
            
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Listing
            </Button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <a href="#" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Home</a>
              <a href="#" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Directory</a>
              <a href="#" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Categories</a>
              <a href="#" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">About</a>
              <a href="#" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Contact</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
