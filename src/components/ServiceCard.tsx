
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Lock, Star, Verified, User } from 'lucide-react';
import { Service } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ContactModal } from './ContactModal';
import { ProfileModal } from './ProfileModal';

interface ServiceCardProps {
  service: Service;
  onContactClick?: (service: Service) => void;
  editMode?: boolean;
}

export const ServiceCard = ({ service, onContactClick }: ServiceCardProps) => {
  const { canAccessContactInfo, user } = useAuth();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Service-specific African professional images
  const getServiceImage = (category: string) => {
    const serviceImages: { [key: string]: string } = {
      'plumbing': 'https://images.unsplash.com/photo-1581578949510-fa5a511c6066?w=400&h=300&fit=crop&q=80',
      'electrical': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop&q=80',
      'cleaning': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&q=80',
      'carpentry': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop&q=80',
      'painting': 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=400&h=300&fit=crop&q=80',
      'hair salon': 'https://images.unsplash.com/photo-1560869713-7d0ac4c75c52?w=400&h=300&fit=crop&q=80',
      'beauty': 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&h=300&fit=crop&q=80',
      'catering': 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=300&fit=crop&q=80',
      'tailoring': 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=300&fit=crop&q=80',
      'mechanic': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop&q=80',
      'gardening': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&q=80',
      'tutoring': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80',
      'photography': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&q=80',
      'fitness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
      'security': 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=400&h=300&fit=crop&q=80'
    };
    
    return serviceImages[category.toLowerCase()] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80';
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
      <Card className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <img
              src={imageError ? defaultImage : (service.image_url || defaultImage)}
              alt={service.service_name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-white/90">
                {service.category}
              </Badge>
            </div>
            {service.user?.is_verified && (
              <div className="absolute top-2 left-2">
                <div className="bg-blue-600 rounded-full p-1">
                  <Verified className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {service.service_name}
              </h3>
              <div className="flex items-center text-yellow-400 ml-2">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm text-gray-600 ml-1">4.8</span>
              </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2">
              {service.description || "Professional service provider"}
            </p>

            {service.location && (
              <div className="flex items-center text-gray-500 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{service.location}</span>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              {canAccessContactInfo ? (
                <>
                  {service.contact_info.phone && (
                    <div className="flex items-center text-gray-700">
                      <Phone className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-sm">{service.contact_info.phone}</span>
                    </div>
                  )}
                  {service.contact_info.email && (
                    <div className="flex items-center text-gray-700">
                      <Mail className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-sm">{service.contact_info.email}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Lock className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {!user ? 'Sign in to view contact info' : 'Subscribe & verify to view contact info'}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handleViewProfile}
              >
                <User className="w-4 h-4 mr-1" />
                View Profile
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleContactClick}
              >
                Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
