
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Lock, Star, Verified } from 'lucide-react';
import { Service } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface ServiceCardProps {
  service: Service;
  onContactClick?: (service: Service) => void;
}

export const ServiceCard = ({ service, onContactClick }: ServiceCardProps) => {
  const { canAccessContactInfo } = useAuth();
  const [imageError, setImageError] = useState(false);

  const defaultImage = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop";

  return (
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
                <span className="text-sm">Subscribe & Verify to view contact info</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => window.location.href = `/service/${service.id}`}
            >
              View Details
            </Button>
            {canAccessContactInfo && onContactClick && (
              <Button 
                size="sm" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => onContactClick(service)}
              >
                Contact
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
