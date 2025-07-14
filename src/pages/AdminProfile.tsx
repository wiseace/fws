import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { User, Settings, Shield, Save, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    user_type: 'admin' as any,
    subscription_plan: 'yearly' as any,
    verification_status: 'verified' as any
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        user_type: profile.user_type,
        subscription_plan: profile.subscription_plan || 'yearly',
        verification_status: profile.verification_status || 'verified'
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
          subscription_plan: formData.subscription_plan,
          verification_status: formData.verification_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();
      setEditMode(false);

      toast({
        title: "Profile Updated",
        description: "Your admin profile has been successfully updated."
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

  if (!profile?.user_type || profile.user_type !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header editMode={false} onToggleEdit={() => {}} />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header editMode={false} onToggleEdit={() => {}} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <Link to="/admin" className="text-primary hover:text-primary/80">Admin Panel</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Profile Settings</span>
            </nav>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              Admin Profile Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your administrator profile and system access privileges
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Status Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Admin Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Role</Label>
                    <Badge variant="destructive" className="mt-1 bg-red-100 text-red-800 border-red-200">
                      Administrator
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Verification</Label>
                    <Badge variant="default" className="mt-1 bg-green-100 text-green-800 border-green-200">
                      Verified
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Subscription</Label>
                    <Badge variant="outline" className="mt-1">
                      {formData.subscription_plan?.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Access Level</Label>
                    <p className="text-sm text-gray-900">Full System Access</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    {editMode ? 'Cancel Edit' : 'Edit Profile'}
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!editMode}
                          required
                          className={!editMode ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!editMode}
                          className={!editMode ? "bg-gray-50" : ""}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subscription">Subscription Plan</Label>
                        <Select 
                          value={formData.subscription_plan || 'yearly'} 
                          onValueChange={(value: any) => setFormData({ ...formData, subscription_plan: value })}
                          disabled={!editMode}
                        >
                          <SelectTrigger className={!editMode ? "bg-gray-50" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="user_type">User Type</Label>
                        <Input
                          id="user_type"
                          value="Administrator"
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">User type cannot be changed</p>
                      </div>
                      <div>
                        <Label htmlFor="verification">Verification Status</Label>
                        <Select 
                          value={formData.verification_status || 'verified'} 
                          onValueChange={(value: any) => setFormData({ ...formData, verification_status: value })}
                          disabled={!editMode}
                        >
                          <SelectTrigger className={!editMode ? "bg-gray-50" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_verified">Not Verified</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {editMode && (
                      <div className="flex justify-end pt-4 border-t">
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};

export default AdminProfile;