import { useContext } from 'react';
import { AuthContext } from './auth/AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Re-export the provider for convenience
export { AuthProvider } from './auth/AuthProvider';