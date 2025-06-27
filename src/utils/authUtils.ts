
import { supabase } from '@/integrations/supabase/client';

export const cleanupAuthState = () => {
  // Remove all auth-related keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if it exists
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

export const ensureAuthSession = async () => {
  try {
    // Force refresh the session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session refresh error:", error);
      return null;
    }
    
    if (!session) {
      console.log("No active session found");
      return null;
    }
    
    // Verify the session is still valid by making a test query
    const { data: testData, error: testError } = await supabase.auth.getUser();
    
    if (testError) {
      console.error("Session verification error:", testError);
      return null;
    }
    
    console.log("Session verified successfully", { 
      userId: testData.user?.id,
      email: testData.user?.email 
    });
    
    return session;
  } catch (error) {
    console.error("Error ensuring auth session:", error);
    return null;
  }
};

export const retryWithAuth = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error("All retry attempts failed");
};

// Admin-specific database operations that bypass user auth
export const adminDatabaseOperation = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    // For admin operations, we'll bypass the auth retry mechanism
    // since admin operations don't require user authentication
    return await operation();
  } catch (error: any) {
    console.error("Admin database operation failed:", error);
    throw error;
  }
};
