
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '@/types/database';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, userType: 'provider' | 'seeker') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  canAccessContactInfo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [canAccessContactInfo, setCanAccessContactInfo] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setProfile(profileData);
          
          // Check contact info access
          const { data: canAccess } = await supabase
            .rpc('can_access_contact_info', { user_id: session.user.id });
          setCanAccessContactInfo(canAccess || false);
        } else {
          setProfile(null);
          setCanAccessContactInfo(false);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, userType: 'provider' | 'seeker') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          user_type: userType
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      canAccessContactInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
