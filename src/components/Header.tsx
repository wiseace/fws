
import { useState } from 'react';
import { Menu, X, Edit3, User, LogOut } from 'lucide-react';
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
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
              <img 
                src="/lovable-uploads/9af80b6f-2452-4317-a6c9-0d8c6cacd4b1.png" 
                alt="Findwhosabi Logo" 
                className="h-10 w-auto"
              />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Findwhosabi
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
            <a href="/browse" className="text-gray-700 hover:text-blue-600 transition-colors">Browse Services</a>
            {user && (
              <a href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">Dashboard</a>
            )}
            {profile?.user_type === 'admin' && (
              <a href="/admin" className="text-red-600 hover:text-red-700 transition-colors font-medium">Admin</a>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">{profile?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
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
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
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

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <a href="/" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Home</a>
              <a href="/browse" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Browse Services</a>
              {user && (
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
