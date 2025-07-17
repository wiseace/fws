
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Plus, Verified } from 'lucide-react';
import { Service } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ContactModal } from './ContactModal';
import { ProfileModal } from './ProfileModal';

interface ModernServiceCardProps {
  service: Service;
  onContactClick?: (service: Service) => void;
}

export const ModernServiceCard = ({ service, onContactClick }: ModernServiceCardProps) => {
  const { canAccessContactInfo, user } = useAuth();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Get the user data from either user or users property
  const provider = service.user || service.users;

  // Service-specific African professional images
  const getServiceImage = (category: string) => {
    const serviceImages: { [key: string]: string } = {
      'plumbing': 'https://images.unsplash.com/photo-1581578949510-fa5a511c6066?w=600&h=800&fit=crop&q=80',
      'electrical': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=800&fit=crop&q=80',
      'cleaning': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=800&fit=crop&q=80',
      'carpentry': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=800&fit=crop&q=80',
      'painting': 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=600&h=800&fit=crop&q=80',
      'hair salon': 'https://images.unsplash.com/photo-1560869713-7d0ac4c75c52?w=600&h=800&fit=crop&q=80',
      'beauty': 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&h=800&fit=crop&q=80',
      'catering': 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&h=800&fit=crop&q=80',
      'tailoring': 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=800&fit=crop&q=80',
      'mechanic': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&h=800&fit=crop&q=80',
      'gardening': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=800&fit=crop&q=80',
      'tutoring': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&q=80',
      'photography': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=800&fit=crop&q=80',
      'fitness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=800&fit=crop&q=80',
      'security': 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=600&h=800&fit=crop&q=80'
    };
    
    return serviceImages[category.toLowerCase()] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&q=80';
  };

  const defaultImage = getServiceImage(service.category);

  const handleViewProfile = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view provider profiles.",
        variant: "destructive"
      });
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
    if (onContactClick) {
      onContactClick(service);
    } else {
      setShowContactModal(true);
    }
  };

  return (
    <>
      <div className="relative bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group h-[500px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={imageError ? defaultImage : (service.image_url || defaultImage)}
            alt={service.service_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Top Section - Service Name */}
        <div className="relative z-10 p-4 text-center">
          <h2 className="text-lg font-bold text-white mb-2 drop-shadow-lg leading-tight">
            {service.service_name}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-white/50 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            <span className="text-white/80 text-sm font-light">Available</span>
          </div>
        </div>

        {/* Verification Badge */}
        {provider?.is_verified && (
          <div className="absolute top-3 left-3 z-30">
            <div className="bg-blue-600 rounded-full p-2 shadow-xl ring-2 ring-white/20">
              <Verified className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Profile Icon */}
        <button
          onClick={handleViewProfile}
          className="absolute top-3 right-3 z-20 bg-white/20 backdrop-blur-sm rounded-full p-2 shadow-xl ring-2 ring-white/20 hover:bg-white/30 transition-all duration-200 group/profile"
        >
          <User className="w-4 h-4 text-white group-hover/profile:scale-110 transition-transform" />
        </button>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/30">
              {provider?.profile_image_url ? (
                <img 
                  src={provider.profile_image_url} 
                  alt={provider.name || 'Provider'} 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <User className={`w-6 h-6 text-white ${provider?.profile_image_url ? 'hidden' : ''}`} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {provider?.name || 'Provider'}
              </p>
              <p className="text-white/70 text-xs">
                {service.location && !service.location.match(/^\+?\d[\d\s\-\(\)]*$/) ? service.location : 'Location available'}
              </p>
            </div>
          </div>

          {/* Contact Button */}
          <Button
            onClick={handleContactClick}
            className="w-full bg-white text-slate-900 hover:bg-white/90 rounded-2xl py-3 font-medium shadow-lg transition-all duration-200 group/button"
          >
            <Plus className="w-5 h-5 mr-2 group-hover/button:rotate-90 transition-transform duration-200" />
            Contact Provider
          </Button>
        </div>
      </div>

      <ContactModal 
        service={service}
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
      
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={service.user_id}
        onContact={() => {
          setShowProfileModal(false);
          setShowContactModal(true);
        }}
      />
    </>
  );
};
