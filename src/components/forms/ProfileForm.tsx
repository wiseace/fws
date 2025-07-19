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
    address: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: (profile as any).address || '' // Temporarily cast until types are updated
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
        user_phone: sanitizedPhone
      });

      // Update address separately since it's not in the RPC function yet
      const { error: addressError } = await supabase
        .from('users')
        .update({ address: sanitizedAddress })
        .eq('id', user?.id);

      if (error || addressError) throw error || addressError;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
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
          placeholder="Start typing your address..."
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          We'll suggest addresses as you type using OpenStreetMap
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Update Profile
      </Button>
    </form>
  );
};