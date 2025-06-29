
import { useState } from 'react';
import { Settings, Palette, Layout, Database, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const EditingPanel = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <Settings className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l z-50 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Edit Panel</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="content" className="p-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Editing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                Click on any text element to edit it directly. Images and links can also be modified inline.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Layout className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Design Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                <Palette className="w-4 h-4 mr-2" />
                Color Palette
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Typography
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Layout Options
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                Connect to Supabase to manage dynamic content and profiles.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Connect Supabase
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
