import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/database';
import { CheckCircle, XCircle, AlertTriangle, MessageSquare, Edit } from 'lucide-react';
import { EditUserModal } from './EditUserModal';

interface UserVerificationModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const UserVerificationModal = ({ user, isOpen, onClose, onUserUpdated }: UserVerificationModalProps) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: user.id,
        new_user_type: user.user_type,
        admin_notes: 'User verified'
      });

      // Update verification status
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          verification_status: 'verified',
          is_verified: true 
        })
        .eq('id', user.id);

      if (error || updateError) throw error || updateError;

      toast({
        title: "User Verified",
        description: `${user.name} has been successfully verified.`,
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

  const handleUnverify = async () => {
    if (!user || !reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for unverification.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_unverify_user', {
        target_user_id: user.id,
        admin_reason: reason
      });

      if (error) throw error;

      toast({
        title: "User Unverified",
        description: `${user.name} has been unverified and notified.`,
      });

      onUserUpdated();
      onClose();
      setReason('');
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

  const handleSendMessage = async () => {
    if (!user || !reason.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_user_messages')
        .insert([{
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          user_id: user.id,
          message: reason,
          message_type: 'general',
          is_from_admin: true
        }]);

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: `Message sent to ${user.name}.`,
      });

      setReason('');
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Manage User: {user.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge variant={
              user.verification_status === 'verified' ? 'default' :
              user.verification_status === 'pending' ? 'secondary' : 'destructive'
            }>
              {user.verification_status}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              {user.verification_status === 'verified' ? 'Reason for Unverification' : 'Message to User'}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                user.verification_status === 'verified' 
                  ? "Explain why this user is being unverified..."
                  : "Send a message to this user..."
              }
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {user.verification_status === 'verified' ? (
                <Button
                  onClick={handleUnverify}
                  disabled={loading || !reason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Unverify User
                </Button>
              ) : (
                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify User
                </Button>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={loading || !reason.trim()}
                variant="outline"
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
            
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              className="w-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit User Details
            </Button>
          </div>

          <Button 
            onClick={onClose} 
            variant="outline" 
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
      
      <EditUserModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserUpdated={() => {
          onUserUpdated();
          setIsEditModalOpen(false);
        }}
      />
    </Dialog>
  );
};