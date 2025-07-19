import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminMessagesPanel } from '@/components/dashboard/AdminMessagesPanel';
import { ContactMessaging } from '@/components/dashboard/ContactMessaging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Shield } from 'lucide-react';

export const MessagesTab = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('contacts');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {profile?.user_type === 'provider' ? 'Client Messages' : 'Provider Messages'}
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin Messages
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts" className="mt-6">
          <ContactMessaging />
        </TabsContent>
        
        <TabsContent value="admin" className="mt-6">
          <AdminMessagesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};