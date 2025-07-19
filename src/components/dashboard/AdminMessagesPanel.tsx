import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, AlertTriangle, Clock, Eye } from 'lucide-react';

interface AdminMessage {
  id: string;
  admin_id: string;
  message: string;
  message_type: string;
  is_from_admin: boolean;
  read_by_recipient: boolean;
  created_at: string;
  admin_name: string;
}

export const AdminMessagesPanel = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_admin_messages');
      
      if (error) throw error;
      
      if (data) {
        // Reverse the order to show oldest messages first (like a normal chat)
        setMessages(data.reverse());
        // Mark unread messages as read
        const unreadMessages = data.filter(m => !m.read_by_recipient && m.is_from_admin);
        if (unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map(msg => 
              supabase.rpc('mark_admin_message_read', { message_id: msg.id })
            )
          );
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.rpc('send_admin_reply', {
        reply_message: replyMessage,
        reply_type: 'general'
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the admin team.",
      });

      setReplyMessage('');
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'unverification':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'verification_issue':
        return <Eye className="h-4 w-4 text-amber-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  const getMessageTypeBadge = (messageType: string) => {
    switch (messageType) {
      case 'unverification':
        return <Badge variant="destructive">Unverification</Badge>;
      case 'verification_issue':
        return <Badge variant="secondary">Verification Issue</Badge>;
      default:
        return <Badge variant="outline">General</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if user is currently unverified (not just if there's an unverification message)
  const isCurrentlyUnverified = profile?.verification_status === 'not_verified' && profile?.user_type === 'provider';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Admin Messages
          {isCurrentlyUnverified && (
            <Badge variant="destructive" className="ml-2">Action Required</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCurrentlyUnverified && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">Account Verification Revoked</span>
            </div>
            <p className="text-sm text-red-700">
              Your account verification has been revoked. Please review the admin message below and take necessary action to restore your verification status.
            </p>
          </div>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border ${
                  message.is_from_admin 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getMessageTypeIcon(message.message_type)}
                    <span className="font-semibold text-sm">
                      {message.is_from_admin ? `Admin: ${message.admin_name}` : 'You'}
                    </span>
                    {getMessageTypeBadge(message.message_type)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(message.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your message to the admin team..."
            rows={3}
          />
          <Button 
            onClick={handleSendReply}
            disabled={sending || !replyMessage.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};