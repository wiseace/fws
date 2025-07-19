import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Service } from '@/types/database';
import { Phone, Mail, MessageSquare, Verified, ExternalLink } from 'lucide-react';
import { SubscriptionGate } from './SubscriptionGate';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DirectContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export const DirectContactModal = ({ isOpen, onClose, service }: DirectContactModalProps) => {
  const { user, profile, canAccessContactInfo } = useAuth();
  const { toast } = useToast();
  const [showSubscriptionGate, setShowSubscriptionGate] = useState(false);

  const handleAuthRedirect = () => {
    onClose();
    window.location.href = '/auth';
  };

  const handleWhatsAppClick = () => {
    if (!service.contact_info?.phone) {
      toast({
        title: "Contact Info Unavailable",
        description: "WhatsApp number not available for this provider.",
        variant: "destructive"
      });
      return;
    }
    
    // Clean phone number for WhatsApp
    const cleanPhone = service.contact_info.phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneClick = () => {
    if (!service.contact_info?.phone) {
      toast({
        title: "Contact Info Unavailable",
        description: "Phone number not available for this provider.",
        variant: "destructive"
      });
      return;
    }
    
    window.location.href = `tel:${service.contact_info.phone}`;
  };

  const handleEmailClick = () => {
    if (!service.contact_info?.email) {
      toast({
        title: "Contact Info Unavailable",
        description: "Email address not available for this provider.",
        variant: "destructive"
      });
      return;
    }
    
    const subject = encodeURIComponent(`Inquiry about ${service.service_name}`);
    const body = encodeURIComponent(`Hi ${service.user?.name},\n\nI'm interested in your ${service.service_name} service. Could you please provide more information?\n\nThanks!`);
    window.location.href = `mailto:${service.contact_info.email}?subject=${subject}&body=${body}`;
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
            Contact {service.user?.name || 'this provider'} directly
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Sign up required:</strong> You need to create an account to contact providers.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAuthRedirect} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Sign Up / Login
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        ) : !canAccessContactInfo ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Subscription required:</strong> You need an active subscription to contact providers.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowSubscriptionGate(true)} className="flex-1">
                Get Subscription
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Provider Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {service.user?.profile_image_url && (
                  <img 
                    src={service.user.profile_image_url} 
                    alt={service.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{service.user?.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.category}</p>
                  {service.location && (
                    <p className="text-xs text-muted-foreground">{service.location}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Verified Provider
              </Badge>
            </div>

            {/* Contact Methods */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Choose your preferred contact method:</h4>
              
              {/* WhatsApp */}
              {service.contact_info?.phone && (
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full justify-start gap-3 h-12 bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageSquare className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">WhatsApp</div>
                    <div className="text-xs opacity-90">{service.contact_info.phone}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </Button>
              )}

              {/* Phone Call */}
              {service.contact_info?.phone && (
                <Button
                  onClick={handlePhoneClick}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-blue-200 hover:bg-blue-50"
                >
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Phone Call</div>
                    <div className="text-xs text-muted-foreground">{service.contact_info.phone}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-blue-600" />
                </Button>
              )}

              {/* Email */}
              {service.contact_info?.email && (
                <Button
                  onClick={handleEmailClick}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-gray-200 hover:bg-gray-50"
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <div className="font-medium">Email</div>
                    <div className="text-xs text-muted-foreground">{service.contact_info.email}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-gray-600" />
                </Button>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      
      <SubscriptionGate 
        isOpen={showSubscriptionGate}
        onClose={() => setShowSubscriptionGate(false)}
        feature="Contact Information"
      />
    </Dialog>
  );
};