import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/database';
import { Edit, Save, X } from 'lucide-react';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const EditUserModal = ({ user, isOpen, onClose, onUserUpdated }: EditUserModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [userType, setUserType] = useState<'provider' | 'seeker' | 'admin'>('seeker');
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'rejected' | 'not_verified'>('not_verified');
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'monthly' | 'yearly' | 'semi_annual'>('free');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress((user as any).address || '');
      setUserType(user.user_type);
      setVerificationStatus(user.verification_status || 'not_verified');
      setSubscriptionPlan(user.subscription_plan || 'free');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    // Validate required fields
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Valid email is required.",
        variant: "destructive"
      });
      return;
    }

    if (phone && !isValidPhoneNumber(phone)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number with country code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Update user details
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          email: email.trim(),
          phone: phone || null,
          address: address.trim() || null,
          user_type: userType,
          verification_status: verificationStatus,
          is_verified: verificationStatus === 'verified',
          subscription_plan: subscriptionPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: `${name}'s profile has been successfully updated.`,
      });

      onUserUpdated();
      onClose();
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

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit User: {user.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <CustomPhoneInput
                value={phone}
                onChange={(value) => setPhone(value || '')}
                placeholder="Enter phone number"
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="userType">User Type</Label>
              <Select value={userType} onValueChange={(value: any) => setUserType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seeker">Service Seeker</SelectItem>
                  <SelectItem value="provider">Service Provider</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="verificationStatus">Verification Status</Label>
              <Select value={verificationStatus} onValueChange={(value: any) => setVerificationStatus(value)}>
                <SelectTrigger>
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
            
            <div>
              <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
              <Select value={subscriptionPlan} onValueChange={(value: any) => setSubscriptionPlan(value)}>
                <SelectTrigger>
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

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
            
            <Button 
              onClick={onClose} 
              variant="outline"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};