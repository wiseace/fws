import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { hasAdminRole } from '@/utils/security';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Enhanced admin check - verify authentication, profile, and admin role
  if (!user || !profile || !hasAdminRole(profile)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};