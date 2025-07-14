
import { useState } from 'react';
import { Menu, X, User, LogOut, Zap, Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface HeaderProps {
  editMode: boolean;
  onToggleEdit: () => void;
}

export const Header = ({ editMode, onToggleEdit }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <header className="absolute top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-white/20 px-6 py-3">
          <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <div className="flex items-center">
            <div className="cursor-pointer flex items-center space-x-2" onClick={() => window.location.href = '/'}>
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-gray-900">FindWhoSabi</span>
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Home</a>
            <a href="/browse" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Services</a>
            {user && profile?.user_type !== 'admin' && (
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Dashboard</a>
            )}
            {profile?.user_type === 'admin' && (
              <a href="/admin" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Admin</a>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist Icon */}
            <button className="hidden md:flex p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Heart className="w-5 h-5" />
            </button>

            {/* Services/Cart Icon */}
            <button className="hidden md:flex p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline text-gray-700">{profile?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {profile?.user_type !== 'admin' && (
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  {profile?.user_type === 'admin' && (
                    <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                      <User className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="hidden md:inline text-gray-700 font-medium cursor-pointer hover:text-gray-900 transition-colors" onClick={() => window.location.href = '/auth'}>
                Contact us
              </span>
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
          <div className="mt-4 bg-white/90 backdrop-blur-lg shadow-lg rounded-2xl border border-white/20 px-6 py-4">
            <div className="flex flex-col space-y-2">
              <a href="/" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Home</a>
              <a href="/browse" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Browse Services</a>
              {user && profile?.user_type !== 'admin' && (
                <a href="/dashboard" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Dashboard</a>
              )}
              {profile?.user_type === 'admin' && (
                <a href="/admin" className="px-4 py-2 text-red-600 hover:bg-red-50 rounded font-medium">Admin Panel</a>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
