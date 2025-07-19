import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { AddressInput } from '@/components/ui/address-input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { validateName, validatePhone } from '@/utils/inputValidation';
import { sanitizeInput } from '@/utils/securityHeaders';

export const ProfileForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    city: '',
    state: '',
    country: '',
    postal_code: '',
    formatted_address: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: (profile as any).address || '',
        latitude: (profile as any).latitude || null,
        longitude: (profile as any).longitude || null,
        city: (profile as any).city || '',
        state: (profile as any).state || '',
        country: (profile as any).country || '',
        postal_code: (profile as any).postal_code || '',
        formatted_address: (profile as any).formatted_address || ''
      });
    }
  }, [profile]);

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return true; // Phone is optional
    return isValidPhoneNumber(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive"
      });
      return;
    }

    // Validate inputs using our security utilities
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      toast({
        title: "Invalid Name",
        description: nameValidation.error,
        variant: "destructive"
      });
      return;
    }

    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        toast({
          title: "Invalid Phone Number",
          description: phoneValidation.error,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Sanitize inputs before sending
      const sanitizedName = sanitizeInput(formData.name);
      const sanitizedPhone = sanitizeInput(formData.phone);
      const sanitizedAddress = sanitizeInput(formData.address);

      const { error } = await supabase.rpc('update_user_profile', {
        user_name: sanitizedName,
        user_phone: sanitizedPhone,
        user_address: sanitizedAddress,
        user_latitude: formData.latitude,
        user_longitude: formData.longitude,
        user_city: formData.city ? sanitizeInput(formData.city) : null,
        user_state: formData.state ? sanitizeInput(formData.state) : null,
        user_country: formData.country ? sanitizeInput(formData.country) : null,
        user_postal_code: formData.postal_code ? sanitizeInput(formData.postal_code) : null,
        user_formatted_address: formData.formatted_address ? sanitizeInput(formData.formatted_address) : null
      });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });

      // Refresh the page to reload user data from auth context
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter your full name"
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <CustomPhoneInput
          value={formData.phone}
          onChange={(value) => setFormData(prev => ({ ...prev, phone: value || '' }))}
          placeholder="Enter phone number with country code"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Include country code for international numbers (e.g., +1 555-123-4567)
        </p>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <AddressInput
          value={formData.address}
          onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
          onPlaceSelect={(place) => {
            setFormData(prev => ({
              ...prev,
              address: place.formatted_address,
              latitude: place.latitude,
              longitude: place.longitude,
              city: place.city || '',
              state: place.state || '',
              country: place.country || '',
              postal_code: place.postal_code || '',
              formatted_address: place.formatted_address
            }));
          }}
          placeholder="Start typing your address..."
          disabled={loading}
          useGooglePlaces={true}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Using address suggestions (Google Places or OpenStreetMap fallback)
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Update Profile
      </Button>
    </form>
  );
};