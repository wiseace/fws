
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Star, Calendar } from 'lucide-react';

interface ProviderInfoProps {
  mainService: any;
  canAccessContactInfo: boolean;
  contactInfo: { phone: string | null; email: string | null };
  onContactClick: () => void;
}

export const ProviderInfo = ({ 
  mainService, 
  canAccessContactInfo, 
  contactInfo, 
  onContactClick 
}: ProviderInfoProps) => {
  return (
    <CardContent className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">About</h3>
          <p className="text-gray-600 mb-4">
            {mainService.description || "Professional service provider with years of experience delivering quality work."}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              <span>{mainService.location || "Location not specified"}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Star className="w-4 h-4 mr-2 text-yellow-500 fill-current" />
              <span>4.8 rating (25 reviews)</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Calendar className="w-4 h-4 mr-2 text-green-600" />
              <span>Available for bookings</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
          {canAccessContactInfo ? (
            <div className="space-y-2">
              {contactInfo.phone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  <span>{contactInfo.phone}</span>
                </div>
              )}
              {contactInfo.email && (
                <div className="flex items-center text-gray-700">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  <span>{contactInfo.email}</span>
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
                Verify your account and subscribe to view contact details
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t">
        <Button 
          onClick={onContactClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {canAccessContactInfo ? 'Contact Now' : 'Unlock Contact Info'}
        </Button>
      </div>
    </CardContent>
  );
};
