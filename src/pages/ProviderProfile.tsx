import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, FileText } from 'lucide-react';

export default function ProviderProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    bio: '',
    location: '',
    website: '',
    experience_years: '',
    specializations: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: '',
        location: '',
        website: '',
        experience_years: '',
        specializations: ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.is_verified) {
      toast({
        title: "Verification Required",
        description: "You need to complete verification before updating your profile. Please submit your verification documents first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();
      
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

  const handleVerificationRequired = () => {
    toast({
      title: "Complete Verification First",
      description: "You need to complete your verification process before accessing advanced profile features.",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            Provider Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your professional profile and service information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="mt-1 bg-gray-50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={profile?.is_verified ? 
                          (e) => setFormData({ ...formData, location: e.target.value }) :
                          handleVerificationRequired
                        }
                        placeholder="City, State/Country"
                        className="mt-1"
                        disabled={!profile?.is_verified}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={profile?.is_verified ? 
                        (e) => setFormData({ ...formData, bio: e.target.value }) :
                        handleVerificationRequired
                      }
                      placeholder="Tell clients about your experience and expertise..."
                      rows={4}
                      className="mt-1"
                      disabled={!profile?.is_verified}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience_years">Years of Experience</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        value={formData.experience_years}
                        onChange={profile?.is_verified ? 
                          (e) => setFormData({ ...formData, experience_years: e.target.value }) :
                          handleVerificationRequired
                        }
                        className="mt-1"
                        disabled={!profile?.is_verified}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website/Portfolio</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={profile?.is_verified ? 
                          (e) => setFormData({ ...formData, website: e.target.value }) :
                          handleVerificationRequired
                        }
                        placeholder="https://yourwebsite.com"
                        className="mt-1"
                        disabled={!profile?.is_verified}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specializations">Specializations</Label>
                    <Textarea
                      id="specializations"
                      value={formData.specializations}
                      onChange={profile?.is_verified ? 
                        (e) => setFormData({ ...formData, specializations: e.target.value }) :
                        handleVerificationRequired
                      }
                      placeholder="List your key skills and areas of expertise..."
                      rows={3}
                      className="mt-1"
                      disabled={!profile?.is_verified}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Profile Status Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Profile Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile?.verification_status === 'verified' 
                      ? 'bg-green-100 text-green-800'
                      : profile?.verification_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.verification_status || 'Not Verified'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subscription</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                    {profile?.subscription_plan || 'Free'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contact Access</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile?.can_access_contact 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.can_access_contact ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {!profile?.is_verified && (
              <Card className="shadow-lg border-l-4 border-l-yellow-400 bg-yellow-50">
                <CardContent className="p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Verification Required</h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    Complete your verification to unlock all profile features and start receiving client contacts.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => window.location.href = '/dashboard?tab=verification'}
                    className="w-full"
                  >
                    Start Verification
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard?tab=services'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Services
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/pricing'}
                >
                  <User className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard?tab=requests'}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  View Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer editMode={false} />
    </div>
  );
}