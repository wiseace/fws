
import { useState } from 'react';
import { Menu, X, User, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
const findWhoSabiLogo = '/lovable-uploads/60f0692e-43cf-498a-bf01-0e645aa4348e.png';

interface HeaderProps {
  editMode: boolean;
  onToggleEdit: () => void;
}

export const Header = ({ editMode, onToggleEdit }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/30 px-6 py-4 backdrop-saturate-150">
          <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <div className="cursor-pointer" onClick={() => window.location.href = '/'}>
              <img src={findWhoSabiLogo} alt="FindWhoSabi" className="h-10 w-auto" />
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="relative text-gray-800 hover:text-primary font-semibold text-lg transition-all duration-300 group">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="/browse" className="relative text-gray-800 hover:text-primary font-semibold text-lg transition-all duration-300 group">
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="/providers" className="relative text-gray-800 hover:text-primary font-semibold text-lg transition-all duration-300 group">
              Providers
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl px-4 py-2 transition-all duration-300">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="hidden lg:inline text-gray-800 font-medium">{profile?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl shadow-xl">
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard'} className="flex items-center px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors">
                    <User className="w-4 h-4 mr-3 text-blue-600" />
                    {profile?.user_type === 'admin' ? 'Admin Panel' : 'Dashboard'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="flex items-center px-4 py-3 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>SIGN IN</span>
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mt-4 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/30 px-6 py-6 backdrop-saturate-150">
            <div className="flex flex-col space-y-4">
              <a href="/" className="px-4 py-3 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-all duration-300">Home</a>
              <a href="/browse" className="px-4 py-3 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-all duration-300">Browse Services</a>
              <a href="/providers" className="px-4 py-3 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-all duration-300">Providers</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
