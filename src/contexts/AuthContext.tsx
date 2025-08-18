import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userApi } from '../services/api';
import api from '../services/api';

interface Employee {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  IsActive: boolean;
  CreatedAt: string;
}

interface User {
  user_id: number;
  username: string;
  is_active: boolean;
  employee?: Employee;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (signupData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing token on app load
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken) {
        setToken(storedToken);
        
        // Try to fetch fresh user profile data
        try {
          const profileResponse = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          const userData = {
            user_id: profileResponse.data.UserID,
            username: profileResponse.data.Username,
            is_active: profileResponse.data.IsActive,
            employee: profileResponse.data.employee
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          // If profile fetch fails, use stored user data or clear auth
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Token is invalid, clear everything
            setToken(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
          }
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await userApi.login({ Username: username, Password: password });
      const { access_token, user_id, username: userUsername, is_active } = response.data;
      
      // Set token first so we can make authenticated requests
      setToken(access_token);
      localStorage.setItem('access_token', access_token);
      
      // Fetch full user profile including employee data
      try {
        const profileResponse = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        
        const userData = {
          user_id: profileResponse.data.UserID,
          username: profileResponse.data.Username,
          is_active: profileResponse.data.IsActive,
          employee: profileResponse.data.employee
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (profileError) {
        // Fallback to basic user data if profile fetch fails
        console.warn('Failed to fetch user profile:', profileError);
        const userData = { user_id, username: userUsername, is_active };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (signupData: any) => {
    try {
      const response = await userApi.signup(signupData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
