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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
import { User, Settings, Save, CreditCard, Calendar, CheckCircle, Upload, Camera, Mail, Plus } from 'lucide-react';
import { isValidPhoneNumber } from 'react-phone-number-input';

export const ProfileTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  // Check if user registered with phone (has phone auth email pattern)
  const isPhoneUser = user?.email?.includes('@phoneauth.local') || user?.email?.includes('@anonymous.local');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress((profile as any).address || '');
      // Use uploaded profile image or fallback to generated avatar
      setProfileImage(profile.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`);
    }
  }, [profile]);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(`profiles/${fileName}`, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('service-images')
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload profile image. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 1MB.",
          variant: "destructive"
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      
      // Upload new profile image if selected
      let uploadedImageUrl = null;
      if (imageFile) {
        setUploading(true);
        uploadedImageUrl = await handleImageUpload(imageFile);
        setUploading(false);
        
        if (!uploadedImageUrl) {
          return; // Upload failed, error already shown
        }
      }
      
      // Update profile including image URL if uploaded
      const { error } = await supabase
        .from('users')
        .update({
          name: name,
          phone: phone,
          address: address,
          profile_image_url: uploadedImageUrl || profileImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      
      // Mark profile completion step as complete if profile is now complete
      if (name && phone && profile?.email) {
        await supabase.rpc('complete_onboarding_step', {
          input_step_name: 'profile_completion'
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
              {/* Profile Image Upload */}
              <div className="text-center">
                <Label>Profile Image</Label>
                <div className="flex flex-col items-center space-y-4 mt-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback className="text-xl">
                      {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="profile-image" className="cursor-pointer">
                      <div className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4" />
                        <span className="text-sm">Change Photo</span>
                      </div>
                    </label>
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={loading || uploading}
                    />
                    {uploading && (
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a clear photo (max 1MB). JPG, PNG formats supported.
                  </p>
                </div>
              </div>
              
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
                <div className="flex gap-2">
                  <Input
                    id="email"
                    value={isPhoneUser ? '' : (profile?.email || '')}
                    disabled={!isPhoneUser}
                    className={isPhoneUser ? "" : "bg-gray-50"}
                    placeholder={isPhoneUser ? "Enter email address to add" : ""}
                  />
                  {isPhoneUser && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEmailModalOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Add & Verify Email
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isPhoneUser ? 'Add a verified email address to your account' : 'Email cannot be changed'}
                </p>
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
                  useGooglePlaces={true}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll suggest addresses as you type using Google Places
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

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onEmailVerified={() => {
          refreshProfile();
          toast({
            title: "Email Added",
            description: "Your email has been successfully added and verified.",
          });
        }}
      />
    </div>
  );
};