
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('clerk_user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No profile found, this is expected for new users
            setProfile(null);
          } else {
            console.error('Error fetching user profile:', fetchError);
            setError('Failed to fetch user profile');
          }
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to fetch user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const syncProfile = async () => {
    if (!user) return;

    try {
      setError(null);
      
      // Get the Clerk session token
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Call our sync endpoint to manually sync the profile
      const response = await fetch(`https://xojaodjwmzaaobcwlyrj.supabase.co/functions/v1/sync-user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync profile');
      }

      // Refetch the profile after sync
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single();

      if (!fetchError && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
      setError('Failed to sync profile');
    }
  };

  return {
    profile,
    isLoading,
    error,
    syncProfile,
  };
};
