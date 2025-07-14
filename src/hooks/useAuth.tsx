
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
  signUp: (email: string, password: string, name: string, userType: 'provider' | 'seeker' | 'admin') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  canAccessContactInfo: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [canAccessContactInfo, setCanAccessContactInfo] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return profileData;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const checkContactAccess = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('can_access_contact_info', { user_id: userId });
      
      if (error) {
        console.error('Error checking contact access:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error in checkContactAccess:', error);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
      const canAccess = await checkContactAccess(user.id);
      setCanAccessContactInfo(canAccess);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Immediate profile fetch for better UX
          try {
            const profileData = await fetchProfile(session.user.id);
            if (profileData) {
              setProfile(profileData);
              const canAccess = await checkContactAccess(session.user.id);
              setCanAccessContactInfo(canAccess);
            } else {
              // If no profile found, user might have been deleted
              console.log('No profile found for user, signing out...');
              await supabase.auth.signOut();
              window.location.href = '/auth';
              return;
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
          setLoading(false);
        } else {
          setProfile(null);
          setCanAccessContactInfo(false);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    // Set up realtime listener for user profile changes
    const realtimeChannel = supabase
      .channel('auth-user-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user?.id || ''}`
        },
        (payload) => {
          console.log('User profile changed:', payload);
          if (payload.eventType === 'DELETE') {
            // User was deleted, sign out immediately
            supabase.auth.signOut();
            window.location.href = '/auth';
          } else if (payload.eventType === 'UPDATE') {
            // User data updated, refresh profile
            refreshProfile();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      realtimeChannel.unsubscribe();
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error };
    }
    
    // Get the user profile to check user type
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData?.user_type === 'admin') {
        // Redirect admin users to admin panel
        window.location.href = '/admin';
        return { error: null };
      }
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, userType: 'provider' | 'seeker' | 'admin') => {
    setLoading(true);
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
    if (error) setLoading(false);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCanAccessContactInfo(false);
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
      canAccessContactInfo,
      refreshProfile
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
