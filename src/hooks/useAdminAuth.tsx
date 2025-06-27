
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authUtils';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = async () => {
      const adminStatus = localStorage.getItem('isAdmin');
      const loginTime = localStorage.getItem('adminLoginTime');
      
      if (adminStatus === 'true' && loginTime) {
        const currentTime = Date.now();
        const timeDiff = currentTime - parseInt(loginTime);
        const hoursElapsed = timeDiff / (1000 * 60 * 60);
        
        // Admin session expires after 24 hours
        if (hoursElapsed < 24) {
          // Also ensure we have a valid Supabase session for admin operations
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setIsAdmin(true);
            } else {
              // Try to sign in with a service account or handle admin auth differently
              console.log("Admin session valid but no Supabase session");
              setIsAdmin(true);
            }
          } catch (error) {
            console.error("Error checking Supabase session:", error);
            setIsAdmin(true); // Allow admin access even if Supabase auth fails
          }
        } else {
          // Session expired, clear admin status
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('adminLoginTime');
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

  const adminLogin = async (status: boolean) => {
    if (status) {
      // When admin logs in, also ensure we have a service session for database operations
      try {
        // For admin operations, we can use a service account or bypass auth
        // For now, we'll set admin status and handle auth at the operation level
        setIsAdmin(status);
      } catch (error) {
        console.error("Error setting up admin session:", error);
        setIsAdmin(status); // Set admin status anyway
      }
    } else {
      setIsAdmin(status);
    }
  };

  const adminLogout = async () => {
    try {
      // Clean up any auth state
      cleanupAuthState();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during admin logout:", error);
    }
    
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminLoginTime');
    setIsAdmin(false);
  };

  return {
    isAdmin,
    loading,
    adminLogin,
    adminLogout
  };
};
