import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Shield, 
  Users, 
  UserCheck, 
  Eye, 
  Settings,
  MessageSquare,
  Star,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface MobileAdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats?: any;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const MobileAdminLayout = ({
  children,
  activeTab,
  onTabChange,
  stats
}: MobileAdminLayoutProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();

  const tabs: TabItem[] = [
    {
      id: 'verifications',
      label: 'Verifications',
      icon: <Shield className="h-4 w-4" />,
      badge: stats?.pending_verifications || 0
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Eye className="h-4 w-4" />
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare className="h-4 w-4" />
    }
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  if (!isMobile) {
    return (
      <div className="w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            {/* Home Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 p-2 hover:bg-primary/10 border border-primary/20"
            >
              <div className="p-1 bg-primary rounded-md">
                <Home className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-primary">Home</span>
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Admin
              </h1>
              <p className="text-xs text-muted-foreground">System Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-xs px-2 py-1 h-7"
            >
              Logout
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary rounded-lg">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">Admin Panel</h2>
                        <p className="text-xs text-muted-foreground">System Management</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  {stats && (
                    <div className="p-4 border-b bg-muted/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{stats.total_users}</div>
                          <div className="text-xs text-muted-foreground">Total Users</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{stats.verified_users}</div>
                          <div className="text-xs text-muted-foreground">Verified</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{stats.pending_verifications}</div>
                          <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{stats.total_services}</div>
                          <div className="text-xs text-muted-foreground">Services</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex-1 p-4">
                    <nav className="space-y-2">
                      {tabs.map(tab => (
                        <Button 
                          key={tab.id} 
                          variant={activeTab === tab.id ? "default" : "ghost"} 
                          className={cn(
                            "w-full justify-start h-12 text-left font-normal",
                            activeTab === tab.id 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "hover:bg-muted"
                          )} 
                          onClick={() => handleTabClick(tab.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              {tab.icon}
                              <span>{tab.label}</span>
                            </div>
                            {tab.badge && tab.badge > 0 && (
                              <Badge 
                                variant={activeTab === tab.id ? "secondary" : "default"} 
                                className="ml-auto h-5 px-2 text-xs"
                              >
                                {tab.badge}
                              </Badge>
                            )}
                          </div>
                        </Button>
                      ))}
                    </nav>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t">
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={() => {
                          setIsOpen(false);
                          window.location.href = '/dashboard';
                        }}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-3" />
                        User Dashboard
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={() => {
                          setIsOpen(false);
                          window.location.href = '/admin/categories';
                        }}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Categories
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile optimized */}
      {stats && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card 
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleTabClick('users')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700">Total Users</p>
                    <p className="text-xl font-bold text-blue-900">{stats.total_users}</p>
                  </div>
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleTabClick('users')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-700">Verified</p>
                    <p className="text-xl font-bold text-green-900">{stats.verified_users}</p>
                  </div>
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleTabClick('verifications')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-700">Pending</p>
                    <p className="text-xl font-bold text-orange-900">{stats.pending_verifications}</p>
                  </div>
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleTabClick('services')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-700">Services</p>
                    <p className="text-xl font-bold text-purple-900">{stats.total_services}</p>
                  </div>
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 pb-20">
        {children}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        <div className="grid grid-cols-4 gap-1 p-3 pb-safe">
          {tabs.map(tab => (
            <Button 
              key={tab.id} 
              variant="ghost" 
              className={cn(
                "h-14 flex-col gap-1 relative text-xs",
                activeTab === tab.id ? "text-primary bg-primary/10" : "text-muted-foreground"
              )} 
              onClick={() => handleTabClick(tab.id)}
            >
              <div className="flex items-center justify-center">
                {React.cloneElement(tab.icon as React.ReactElement, { className: "h-5 w-5" })}
              </div>
              <span className="text-xs truncate leading-tight">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {tab.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};