
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types/database';
import { Loader2, Phone, Mail, MessageSquare, MapPin, Star, Verified } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export const ContactModal = ({ isOpen, onClose, service }: ContactModalProps) => {
  const { user, profile, canAccessContactInfo } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState<'phone' | 'email' | 'message'>('message');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to contact providers.",
        variant: "destructive"
      });
      return;
    }

    if (!canAccessContactInfo) {
      toast({
        title: "Subscription required",
        description: "You need to be verified and have an active subscription to contact providers.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('contact_requests')
        .insert([{
          seeker_id: user.id,
          provider_id: service.user_id,
          service_id: service.id,
          message: message.trim() || null,
          contact_method: contactMethod
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Contact request sent!",
        description: "Your message has been sent to the provider."
      });
      
      setMessage('');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {service.service_name}
            {service.user?.is_verified && (
              <div className="bg-blue-600 rounded-full p-1">
                <Verified className="w-4 h-4 text-white" />
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Connect with {service.user?.name || 'this provider'}
          </DialogDescription>
        </DialogHeader>

        {!canAccessContactInfo ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You need to be verified and have an active subscription to contact providers.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => window.location.href = '/dashboard'} className="flex-1">
                Get Verified
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contact-method">Preferred Contact Method</Label>
              <Select value={contactMethod} onValueChange={(value: 'phone' | 'email' | 'message') => setContactMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Platform Message
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="phone">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Phone Call
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the provider about your needs..."
                rows={4}
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !message.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Message
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
