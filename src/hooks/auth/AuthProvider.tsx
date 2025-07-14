import { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '@/types/database';
import { AuthContextType } from './authTypes';
import { fetchProfile, checkContactAccess } from './authHelpers';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [canAccessContactInfo, setCanAccessContactInfo] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
      const canAccess = await checkContactAccess(user.id);
      setCanAccessContactInfo(canAccess);
    }
  }, [user]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile loading to avoid blocking auth state
          setTimeout(async () => {
            try {
              const profileData = await fetchProfile(session.user.id);
              console.log('Profile data loaded:', profileData);
              if (profileData) {
                setProfile(profileData);
                console.log('Profile set, user type:', profileData.user_type);
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
          }, 0);
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

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Remove user dependency to prevent infinite loops

  // Separate effect for realtime user changes
  useEffect(() => {
    if (!user?.id) return;

    const realtimeChannel = supabase
      .channel(`auth-user-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
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
      realtimeChannel.unsubscribe();
    };
  }, [user?.id, refreshProfile]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return { error };
      }
      
      // Don't redirect here, let the auth state change handle it
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error };
    }
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