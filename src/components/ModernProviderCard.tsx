
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, MapPin, Star, Verified, Phone, Mail, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DirectContactModal } from './DirectContactModal';
import { ProfileModal } from './ProfileModal';
import type { Provider } from '@/types/database';

interface ModernProviderCardProps {
  provider: Provider;
  onContactClick?: (service: any) => void;
}

export const ModernProviderCard = ({ provider, onContactClick }: ModernProviderCardProps) => {
  const { canAccessContactInfo, user } = useAuth();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Get provider's primary service for the contact modal
  const primaryService = provider.services[0];

  const defaultImage = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&q=80';

  const handleViewProfile = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view provider profiles.",
        variant: "destructive"
      });
      window.location.href = '/auth';
      return;
    }
    
    if (!canAccessContactInfo) {
      toast({
        title: "Subscription required", 
        description: "You need to be verified and have an active subscription to view provider profiles.",
        variant: "destructive"
      });
      return;
    }
    
    setShowProfileModal(true);
  };

  const handleContactClick = () => {
    if (onContactClick && primaryService) {
      onContactClick({
        ...primaryService,
        user_id: provider.id,
        user: provider
      });
    } else {
      setShowContactModal(true);
    }
  };

  const getContactButtonText = () => {
    if (!user) {
      return 'Sign Up to Contact';
    }
    return 'Contact Provider';
  };

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Recently active';
    const date = new Date(lastActive);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Active ${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `Active ${Math.floor(diffInHours / 24)}d ago`;
    }
    return 'Active this month';
  };

  return (
    <>
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100">
        {/* Header with Profile Image - Updated with darker brand colors for better readability */}
        <div className="relative p-6 bg-gradient-to-br from-brand-primary-dark to-brand-primary-darker">
          {/* Top badges container - positioned to avoid overlap */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {/* Availability Status - Left side */}
            {provider.availability_status === 'available' && (
              <div className="bg-brand-success/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                <div className="flex items-center gap-1 text-white text-xs font-medium">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Available
                </div>
              </div>
            )}

            {/* Verification Badge - Right side */}
            {provider.is_verified && (
              <div className="bg-brand-success rounded-full p-2 shadow-lg ring-2 ring-white/50">
                <Verified className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-4 mt-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden ring-4 ring-white/30">
              {provider.profile_image_url && !imageError ? (
                <img 
                  src={provider.profile_image_url} 
                  alt={provider.name} 
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setImageError(true)}
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                {provider.name}
              </h3>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{provider.service_location || provider.city_or_state || 'Location available'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-xs mt-1">
                <Calendar className="w-3 h-3" />
                <span>{formatLastActive(provider.last_active)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Services Count & Categories */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {provider.services.length} Service{provider.services.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Service Categories */}
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(provider.services.map(s => s.category))).slice(0, 3).map((category, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-xs rounded-full border border-brand-primary/20"
                >
                  {category}
                </span>
              ))}
              {provider.services.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200">
                  +{provider.services.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Skills */}
          {provider.skills && provider.skills.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1">
                {provider.skills.slice(0, 4).map((skill, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                  >
                    {skill}
                  </span>
                ))}
                {provider.skills.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    +{provider.skills.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price Range */}
          {(provider.price_range_min || provider.price_range_max) && (
            <div className="mb-4">
              <span className="text-sm text-gray-600">Price Range: </span>
              <span className="text-sm font-medium text-gray-900">
                ₦{provider.price_range_min?.toLocaleString() || '0'} - 
                ₦{provider.price_range_max?.toLocaleString() || '50,000+'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleViewProfile}
              className="flex-1 rounded-xl border-brand-primary/20 hover:bg-brand-primary/5 text-brand-primary"
            >
              <User className="w-4 h-4 mr-2" />
              View Profile
            </Button>
            <Button
              onClick={handleContactClick}
              className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl"
            >
              <Mail className="w-4 h-4 mr-2" />
              {getContactButtonText()}
            </Button>
          </div>
        </div>
      </div>

      {primaryService && (
        <DirectContactModal 
          service={{
            ...primaryService,
            user_id: provider.id,
            user: provider
          }}
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
        />
      )}
      
      {user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={provider.id}
          onContact={() => {
            setShowProfileModal(false);
            setShowContactModal(true);
          }}
        />
      )}
    </>
  );
};
