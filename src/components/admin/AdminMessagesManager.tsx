import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, AlertTriangle, Clock, Eye, Search, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminMessage {
  id: string;
  admin_id: string;
  user_id: string;
  message: string;
  message_type: string;
  is_from_admin: boolean;
  read_by_recipient: boolean;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface UserConversation {
  user_id: string;
  user_name: string;
  user_email: string;
  latest_message: string;
  latest_message_date: string;
  unread_count: number;
  message_type: string;
}

export const AdminMessagesManager = () => {
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageType, setMessageType] = useState('general');
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchConversations = async () => {
    try {
      // First get all messages
      const { data: messages, error: messagesError } = await supabase
        .from('admin_user_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) {
        setConversations([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(messages.map(m => m.user_id))];

      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Create user lookup map
      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      // Group messages by user and get latest message info
      const conversationMap = new Map<string, UserConversation>();
      
      messages.forEach((msg: any) => {
        const userId = msg.user_id;
        const user = userMap.get(userId);
        const existing = conversationMap.get(userId);
        
        if (!existing || new Date(msg.created_at) > new Date(existing.latest_message_date)) {
          conversationMap.set(userId, {
            user_id: userId,
            user_name: user?.name || 'Unknown User',
            user_email: user?.email || 'unknown@email.com',
            latest_message: msg.message,
            latest_message_date: msg.created_at,
            unread_count: messages.filter(m => 
              m.user_id === userId && 
              !m.is_from_admin && 
              !m.read_by_recipient
            ).length,
            message_type: msg.message_type
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      // Get messages for this user
      const { data: messages, error: messagesError } = await supabase
        .from('admin_user_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
      }

      if (messages) {
        const typedMessages = messages.map(msg => ({
          ...msg,
          user_name: user?.name || 'Unknown User',
          user_email: user?.email || 'unknown@email.com'
        }));
        setMessages(typedMessages);

        // Mark user messages as read by admin
        const unreadUserMessages = messages.filter(m => !m.is_from_admin && !m.read_by_recipient);
        if (unreadUserMessages.length > 0) {
          await Promise.all(
            unreadUserMessages.map(msg => 
              supabase.rpc('mark_admin_message_read', { message_id: msg.id })
            )
          );
          fetchConversations(); // Refresh conversation list
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedUserId) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('admin_user_messages')
        .insert([{
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          user_id: selectedUserId,
          message: replyMessage,
          message_type: messageType,
          is_from_admin: true
        }]);

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the user.",
      });

      setReplyMessage('');
      fetchMessages(selectedUserId);
      fetchConversations();
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

  const filteredConversations = conversations.filter(conv =>
    conv.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            User Conversations
            {conversations.filter(c => c.unread_count > 0).length > 0 && (
              <Badge variant="destructive">
                {conversations.reduce((sum, c) => sum + c.unread_count, 0)} Unread
              </Badge>
            )}
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.user_id}
                onClick={() => setSelectedUserId(conversation.user_id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedUserId === conversation.user_id 
                    ? 'bg-primary/10 border-primary' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-semibold text-sm">{conversation.user_name}</span>
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  {getMessageTypeIcon(conversation.message_type)}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{conversation.user_email}</p>
                <p className="text-xs text-muted-foreground truncate">{conversation.latest_message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conversation.latest_message_date).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Messages Panel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {selectedUserId ? `Conversation with ${messages[0]?.user_name || 'User'}` : 'Select a Conversation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedUserId ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border ${
                      message.is_from_admin 
                        ? 'bg-green-50 border-green-200 ml-8' 
                        : 'bg-blue-50 border-blue-200 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getMessageTypeIcon(message.message_type)}
                        <span className="font-semibold text-sm">
                          {message.is_from_admin ? 'Admin' : message.user_name}
                        </span>
                        {getMessageTypeBadge(message.message_type)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(message.created_at).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="verification_issue">Verification Issue</SelectItem>
                      <SelectItem value="unverification">Unverification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your message to the user..."
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};