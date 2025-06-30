
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Service } from '@/types/database';
import { Phone, Mail, MapPin, Star, Verified } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ContactModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal = ({ service, isOpen, onClose }: ContactModalProps) => {
  const { user, canAccessContactInfo } = useAuth();

  if (!service) return null;

  const handleContactAction = () => {
    if (!user) {
      toast.error('Please sign in to access contact information');
      window.location.href = '/auth';
      return;
    }

    if (!canAccessContactInfo) {
      toast.error('Please verify your account and subscribe to access contact information');
      return;
    }

    toast.success('Contact information is now available!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {service.service_name}
            {service.user?.is_verified && (
              <div className="bg-blue-600 rounded-full p-1">
                <Verified className="w-4 h-4 text-white" />
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Connect with {service.user?.name || 'this provider'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Provider Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{service.user?.name}</h4>
            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
            
            {service.location && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                {service.location}
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
              4.8 rating (12 reviews)
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-medium mb-3">Contact Information</h4>
            
            {canAccessContactInfo ? (
              <div className="space-y-2">
                {service.contact_info?.phone && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Phone className="w-4 h-4 mr-3 text-green-600" />
                    <span className="font-medium">{service.contact_info.phone}</span>
                  </div>
                )}
                {service.contact_info?.email && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Mail className="w-4 h-4 mr-3 text-blue-600" />
                    <span className="font-medium">{service.contact_info.email}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center text-gray-500 mb-2">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>••• ••• ••••</span>
                </div>
                <div className="flex items-center text-gray-500 mb-3">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>••••••@••••.com</span>
                </div>
                <p className="text-sm text-gray-600">
                  {!user 
                    ? 'Sign in to view contact information'
                    : 'Verify your account and subscribe to access contact details'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            {canAccessContactInfo ? (
              <Button 
                onClick={() => window.location.href = `/provider/${service.user_id}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                View Profile
              </Button>
            ) : (
              <Button 
                onClick={handleContactAction}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {!user ? 'Sign In' : 'Get Access'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
