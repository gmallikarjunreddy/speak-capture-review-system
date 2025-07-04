
import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and validate it
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Try to get profile to validate token
      apiClient.getProfile()
        .then((profile) => {
          setUser(profile);
          setSession({ user: profile });
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
          apiClient.clearToken();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await apiClient.signUp(email, password, userData);
      if (error) return { error };
      
      setUser(data.user);
      setSession({ user: data.user });
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await apiClient.signIn(email, password);
      if (error) return { error: { message: error.message } };
      
      setUser(data.user);
      setSession({ user: data.user });
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    await apiClient.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut
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
