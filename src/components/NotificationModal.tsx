import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  action_url?: string;
}

interface NotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead
}) => {
  if (!notification) return null;

  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Bell className="h-6 w-6 text-blue-600" />;
    }
  };

  const getBadgeColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            <span className="flex-1">{notification.title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={getBadgeColor()}>
              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </Badge>
            {!notification.read && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                New
              </Badge>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800 leading-relaxed">
              {notification.message}
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            {new Date(notification.created_at).toLocaleString()}
          </div>
          
          <div className="flex gap-2 pt-4">
            {!notification.read && (
              <Button
                onClick={handleMarkAsRead}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Mark as Read
              </Button>
            )}
            
            {notification.action_url && (
              <Button
                onClick={() => {
                  window.location.href = notification.action_url!;
                }}
                size="sm"
                className="flex-1"
              >
                Take Action
              </Button>
            )}
            
            <Button
              onClick={onClose}
              size="sm"
              variant="secondary"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};