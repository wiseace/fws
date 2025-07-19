import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminMessagesPanel } from '@/components/dashboard/AdminMessagesPanel';
import { ContactMessaging } from '@/components/dashboard/ContactMessaging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Shield } from 'lucide-react';

export const MessagesTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Admin Messages</h3>
      </div>
      <AdminMessagesPanel />
    </div>
  );
};