import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

/**
 * Secure authentication hooks with proper authorization checks
 */
export const useSecureAuth = () => {
  const auth = useAuth();

  // Secure profile update function that uses server-side validation
  const updateProfile = useCallback(async (name?: string, phone?: string) => {
    if (!auth.user) {
      throw new Error('Not authenticated');
    }

    try {
      const { data, error } = await supabase.rpc('update_user_profile', {
        user_name: name,
        user_phone: phone
      });

      if (error) throw error;
      
      // Refresh the profile to get updated data
      await auth.refreshProfile();
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error };
    }
  }, [auth]);

  // Check if user owns a specific resource
  const checkResourceOwnership = useCallback(async (resourceUserId: string) => {
    if (!auth.user) return false;
    
    try {
      const { data, error } = await supabase.rpc('check_user_owns_resource', {
        resource_user_id: resourceUserId
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Resource ownership check failed:', error);
      return false;
    }
  }, [auth.user]);

  // Validate subscription status server-side
  const validateSubscription = useCallback(async () => {
    if (!auth.user) return false;
    
    try {
      const { data, error } = await supabase.rpc('validate_user_subscription', {
        user_id: auth.user.id
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Subscription validation failed:', error);
      return false;
    }
  }, [auth.user]);

  return {
    ...auth,
    updateProfile,
    checkResourceOwnership,
    validateSubscription
  };
};