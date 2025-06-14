
import { useState, useEffect } from 'react';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = () => {
      const adminStatus = localStorage.getItem('isAdmin');
      const loginTime = localStorage.getItem('adminLoginTime');
      
      if (adminStatus === 'true' && loginTime) {
        const currentTime = Date.now();
        const timeDiff = currentTime - parseInt(loginTime);
        const hoursElapsed = timeDiff / (1000 * 60 * 60);
        
        // Admin session expires after 24 hours
        if (hoursElapsed < 24) {
          setIsAdmin(true);
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

  const adminLogin = (status: boolean) => {
    setIsAdmin(status);
  };

  const adminLogout = () => {
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
