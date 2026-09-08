import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import type { Role, User, LoginRequest } from '@/types/auth';

export interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  scope: string;
  description: string;
}

export const CANONICAL_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'MINISTRY',
    label: 'Central Ministry (MoSPI)',
    email: 'ministry@mplads.gov.in',
    scope: 'All-India National Oversight',
    description: 'Unrestricted oversight across all 36 States/UTs and 98,825 works',
  },
  {
    role: 'STATE_OFFICER',
    label: 'State Nodal Officer',
    email: 'state.up@mplads.gov.in',
    scope: 'Uttar Pradesh (State)',
    description: 'State-level inter-district monitoring across Uttar Pradesh',
  },
  {
    role: 'DISTRICT_OFFICER',
    label: 'District Planning Officer',
    email: 'district.patna@mplads.gov.in',
    scope: 'Patna, Bihar (District)',
    description: 'Operational review queue for works in Patna district',
  },
  {
    role: 'MP',
    label: 'Member of Parliament',
    email: 'mp.khalsa@mplads.gov.in',
    scope: 'Sarabjeet Singh Khalsa (Faridkot)',
    description: 'Constituency portfolio monitoring (active detections across all 4 models)',
  },
];

export const DEMO_PASSWORD = 'Mplads@Demo2026#';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  quickLogin: (role: Role) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const tokenData = await authService.login(credentials);
      localStorage.setItem('token', tokenData.access_token);
      setToken(tokenData.access_token);

      const freshUser = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: Role) => {
    const demo = CANONICAL_DEMO_ACCOUNTS.find((a) => a.role === role);
    if (!demo) return;
    await login({ email: demo.email, password: DEMO_PASSWORD });
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        quickLogin,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
