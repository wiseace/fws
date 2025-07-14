import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '@/types/database';

export interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, userType: 'provider' | 'seeker' | 'admin') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  canAccessContactInfo: boolean;
  refreshProfile: () => Promise<void>;
}