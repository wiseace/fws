import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Save, Shield, User, Settings, LayoutDashboard } from 'lucide-react';

export default function AdminProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        description: "Your admin profile has been updated successfully."
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

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You do not have admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin'}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Panel
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Admin Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your administrator account information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Administrator Information
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

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Admin Status Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-800">Admin Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">Role</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Administrator
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">Access Level</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Full Access
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">Verification</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">Subscription</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Admin Plan
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/admin'}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/admin/categories'}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Categories
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  User Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Super Admin Protection Notice */}
            <Card className="shadow-lg border-l-4 border-l-red-400 bg-red-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-red-800 mb-2">Super Administrator</h3>
                <p className="text-sm text-red-700 mb-3">
                  You are the primary system administrator. Your account has special protections and cannot be deleted by other administrators.
                </p>
                <ul className="text-xs text-red-600 space-y-1">
                  <li>• Account deletion protection</li>
                  <li>• Full system access rights</li>
                  <li>• Permanent administrator status</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-blue-400 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-blue-800 mb-2">Admin Privileges</h3>
                <p className="text-sm text-blue-700 mb-3">
                  As an administrator, you have full access to manage users, verify providers, and oversee system operations.
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• User & Provider Management</li>
                  <li>• Verification Processing</li>
                  <li>• Category Administration</li>
                  <li>• System Analytics & Reports</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer editMode={false} />
    </div>
  );
}