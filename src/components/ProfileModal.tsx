import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Service } from '@/types/database';
import { MapPin, Phone, Mail, Star, Calendar, Verified } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onContact?: () => void;
}

export const ProfileModal = ({ isOpen, onClose, userId, onContact }: ProfileModalProps) => {
  const { canAccessContactInfo } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Fetch user's services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;
      const typedServices = (servicesData || []).map(service => ({
        ...service,
        contact_info: service.contact_info as { phone?: string; email?: string; }
      })) as Service[];
      setServices(typedServices);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Not Found</DialogTitle>
          </DialogHeader>
          <p>Unable to load user profile.</p>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Provider Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                {user.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <Verified className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline" className="capitalize">
                  {user.user_type}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {user.subscription_plan} Plan
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {canAccessContactInfo && user.phone && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{service.service_name}</h3>
                          <Badge variant="secondary" className="mt-1">
                            {service.category}
                          </Badge>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                          )}
                          {service.location && (
                            <div className="flex items-center space-x-1 mt-2">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">{service.location}</span>
                            </div>
                          )}
                        </div>
                        {service.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.service_name}
                            className="w-16 h-16 object-cover rounded-lg ml-4"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Member since</p>
                    <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Services</p>
                    <p className="font-medium">{services.length} active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
            {onContact && canAccessContactInfo && (
              <Button
                onClick={onContact}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Contact Provider
              </Button>
            )}
          </div>

          {!canAccessContactInfo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You need to be verified and have an active subscription to contact providers.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};