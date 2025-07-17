import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { AddressInput } from '@/components/ui/address-input';
import { useToast } from '@/hooks/use-toast';
import { User, Settings, Save, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { isValidPhoneNumber } from 'react-phone-number-input';

export const ProfileTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(''); // Address field would need to be added to database
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate phone number if provided
    if (phone && !isValidPhoneNumber(phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.rpc('update_user_profile', {
        user_name: name,
        user_phone: phone
      });

      if (error) throw error;

      await refreshProfile();
      
      // Mark profile completion step as complete if profile is now complete
      if (name && phone && profile?.email) {
        await supabase.rpc('complete_onboarding_step', {
          step_name: 'profile_completion'
        });
      }
      
      toast({
        title: "Profile updated",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-secondary text-white"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <CustomPhoneInput
                  value={phone}
                  onChange={(value) => setPhone(value || '')}
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
                  value={address}
                  onChange={setAddress}
                  placeholder="Start typing your address..."
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll suggest addresses as you type using OpenStreetMap
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Type</span>
              <Badge variant="outline" className="capitalize">
                {profile?.user_type === 'provider' ? 'Service Provider' : 'Service Seeker'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification Status</span>
              {getStatusBadge(profile?.verification_status || 'not_verified')}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subscription Plan</span>
              <Badge variant="outline" className="capitalize">
                {profile?.subscription_plan || 'Free'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Member Since</span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            {profile?.subscription_expiry && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subscription Expires</span>
                <span className="text-sm text-gray-500">
                  {new Date(profile.subscription_expiry).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/pricing'}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Upgrade Plan
            </Button>
            
            {profile?.user_type === 'provider' && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/provider-profile'}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Provider Settings
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/browse'}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Browse Services
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};