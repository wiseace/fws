import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Send, Clock, User, ArrowLeft } from 'lucide-react';

interface ContactRequest {
  id: string;
  seeker_id: string;
  provider_id: string;
  service_id: string;
  message: string;
  contact_method: string;
  created_at: string;
  services: {
    service_name: string;
    category: string;
  };
  users: {
    name: string;
    email: string;
  };
}

interface MessageThread {
  id: string;
  content: string;
  sender_id: string;
  contact_request_id: string;
  created_at: string;
  sender_name: string;
}

interface ContactMessagingProps {
  selectedRequest?: ContactRequest | null;
  onBack?: () => void;
}

export const ContactMessaging = ({ selectedRequest, onBack }: ContactMessagingProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(selectedRequest?.id || null);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchContactRequests();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRequestId) {
      fetchMessages(selectedRequestId);
    }
  }, [selectedRequestId]);

  const fetchContactRequests = async () => {
    try {
      if (profile?.user_type === 'provider') {
        const { data, error } = await supabase
          .from('contact_requests')
          .select(`
            *,
            services:service_id!inner (service_name, category),
            users:seeker_id!inner (name, email)
          `)
          .eq('provider_id', user?.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setRequests(data as unknown as ContactRequest[] || []);
      } else {
        const { data, error } = await supabase
          .from('contact_requests')
          .select(`
            *,
            services:service_id!inner (service_name, category),
            users:provider_id!inner (name, email)
          `)
          .eq('seeker_id', user?.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setRequests(data as unknown as ContactRequest[] || []);
      }
    } catch (error: any) {
      console.error('Error fetching contact requests:', error);
      toast({
        title: "Error",
        description: "Failed to load contact requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (requestId: string) => {
    try {
      // For now, we'll simulate a message thread since we don't have a messages table
      // In a real implementation, you'd create a contact_messages table
      const request = requests.find(r => r.id === requestId);
      if (request) {
        const simulatedMessages: MessageThread[] = [
          {
            id: '1',
            content: request.message,
            sender_id: request.seeker_id,
            contact_request_id: requestId,
            created_at: request.created_at,
            sender_name: request.users.name
          }
        ];
        setMessages(simulatedMessages);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRequestId) return;

    setSending(true);
    try {
      // In a real implementation, you'd insert into a contact_messages table
      // For now, we'll show a success message
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      
      // Simulate adding the message to the thread
      const newMsg: MessageThread = {
        id: Date.now().toString(),
        content: newMessage,
        sender_id: user?.id || '',
        contact_request_id: selectedRequestId,
        created_at: new Date().toISOString(),
        sender_name: profile?.name || 'You'
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Contact Requests List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {requests.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedRequestId === request.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{request.users.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {request.services.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {request.services.service_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {request.message}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Thread */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedRequestId ? 
                requests.find(r => r.id === selectedRequestId)?.users.name || 'Conversation' : 
                'Select a conversation'
              }
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          {selectedRequestId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                        <Clock className="h-3 w-3" />
                        {new Date(message.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};