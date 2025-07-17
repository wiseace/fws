
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
        <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/30 px-6 py-3 backdrop-saturate-150">
          <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <div className="flex items-center">
            <div className="cursor-pointer" onClick={() => window.location.href = '/'}>
              <img src={findWhoSabiLogo} alt="FindWhoSabi" className="h-8 w-auto" />
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Home</a>
            <a href="/browse" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Services</a>
            <a href="/providers" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Providers</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline text-gray-700">{profile?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                    <User className="w-4 h-4 mr-2" />
                    {profile?.user_type === 'admin' ? 'Admin Panel' : 'Dashboard'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:inline-flex items-center space-x-1 text-gray-700 font-medium cursor-pointer hover:text-gray-900 transition-colors" onClick={() => window.location.href = '/auth'}>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mt-4 bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/30 px-6 py-4 backdrop-saturate-150">
            <div className="flex flex-col space-y-2">
              <a href="/" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Home</a>
              <a href="/browse" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Browse Services</a>
              <a href="/providers" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Providers</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
