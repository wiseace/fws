import { supabase } from '@/integrations/supabase/client';

export const fetchProfile = async (userId: string) => {
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

export const checkContactAccess = async (userId: string) => {
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