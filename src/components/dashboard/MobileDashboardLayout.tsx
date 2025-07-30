import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, LayoutDashboard, User, Settings, Star, MessageSquare, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
interface MobileDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onboardingProgress?: number;
  unreadNotifications?: number;
}
interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  userTypes?: ('provider' | 'seeker' | 'admin')[];
}
export const MobileDashboardLayout = ({
  children,
  activeTab,
  onTabChange,
  onboardingProgress = 0,
  unreadNotifications = 0
}: MobileDashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const {
    profile
  } = useAuth();
  const tabs: TabItem[] = [{
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
    userTypes: ['provider', 'seeker', 'admin']
  }, {
    id: 'services',
    label: 'My Services',
    icon: <Star className="h-4 w-4" />,
    userTypes: ['provider']
  }, {
    id: 'verification',
    label: 'Verification',
    icon: <Shield className="h-4 w-4" />,
    userTypes: ['provider']
  }, {
    id: 'messages',
    label: 'Messages',
    icon: <MessageSquare className="h-4 w-4" />,
    badge: unreadNotifications,
    userTypes: ['provider', 'seeker', 'admin']
  }, {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    userTypes: ['provider', 'seeker', 'admin']
  }];
  const filteredTabs = tabs.filter(tab => !tab.userTypes || tab.userTypes.includes(profile?.user_type as any));
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
  return <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary rounded-lg">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold truncate">Dashboard</h1>
              {onboardingProgress < 100 && <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{
                  width: `${onboardingProgress}%`
                }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{onboardingProgress}%</span>
                </div>}
            </div>
          </div>

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
                <div className="flex items-center justify-between p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Dashboard</h2>
                      <p className="text-sm text-muted-foreground capitalize">{profile?.user_type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-slate-50">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress indicator for providers */}
                {profile?.user_type === 'provider' && onboardingProgress < 100 && <div className="p-6 border-b bg-muted/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Setup Progress</span>
                        <span className="text-sm text-muted-foreground">{onboardingProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500" style={{
                      width: `${onboardingProgress}%`
                    }} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Complete your profile to unlock all features
                      </p>
                    </div>
                  </div>}

                {/* Navigation */}
                <div className="flex-1 p-6">
                  <nav className="space-y-2">
                    {filteredTabs.map(tab => <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} className={cn("w-full justify-start h-12 text-left font-normal", activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted")} onClick={() => handleTabClick(tab.id)}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {tab.icon}
                            <span>{tab.label}</span>
                          </div>
                          {tab.badge && tab.badge > 0 && <Badge variant={activeTab === tab.id ? "secondary" : "default"} className="ml-auto h-5 px-2 text-xs">
                              {tab.badge}
                            </Badge>}
                        </div>
                      </Button>)}
                  </nav>
                </div>

                {/* Footer */}
                <div className="p-6 border-t">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/pricing';
                  }}>
                      <Star className="h-4 w-4 mr-3" />
                      Upgrade Plan
                    </Button>
                    {profile?.user_type === 'admin' && <Button variant="outline" className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50" onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/admin';
                  }}>
                        <Shield className="h-4 w-4 mr-3" />
                        Admin Panel
                      </Button>}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Bottom navigation for quick access */}
      <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-4 gap-1 p-2">
          {filteredTabs.slice(0, 4).map(tab => <Button key={tab.id} variant="ghost" className={cn("h-12 flex-col gap-1 relative", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} onClick={() => handleTabClick(tab.id)}>
              {tab.icon}
              <span className="text-xs truncate">{tab.label}</span>
              {tab.badge && tab.badge > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {tab.badge}
                </Badge>}
            </Button>)}
        </div>
      </div>
    </div>;
};