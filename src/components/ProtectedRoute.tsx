import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireNonAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAuth = true, requireNonAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, session, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Enhanced authentication check - verify both user and session
  if (requireAuth && (!user || !session)) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect admin users away from regular user dashboard
  if (requireNonAdmin && profile?.user_type === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};