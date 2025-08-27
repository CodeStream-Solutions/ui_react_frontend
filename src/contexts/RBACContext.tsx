import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { userApi } from '../services/api';

interface RoleDetail {
  role_id: number;
  role_name: string;
  role_description: string;
  permissions: string[];
}

interface UserPermissions {
  user_id: number;
  username: string;
  roles: string[];
  permissions: string[];
  is_admin: boolean;
  is_warehouse_manager: boolean;
  role_details: RoleDetail[];
}

interface RBACContextType {
  userPermissions: UserPermissions | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: () => boolean;
  isWarehouseManager: () => boolean;
  isEmployee: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getUserRoles: () => string[];
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

// Helper function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { isAuthenticated, token, loading: authLoading } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserPermissions = async () => {
    // Wait for auth context to finish loading
    if (authLoading) {
      return;
    }

    // Set loading to true when we start fetching
    setLoading(true);

    if (!isAuthenticated || !token) {
      setUserPermissions(null);
      setLoading(false);
      return;
    }

    try {
      const response = await userApi.getMyPermissions();
      setUserPermissions(response.data);
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      
      // Fallback: decode JWT token to get role information
      const decodedToken = decodeJWT(token);
      if (decodedToken && decodedToken.roles) {
        const roles = decodedToken.roles;
        const isAdmin = roles.includes('Admin');
        const isWarehouseManager = roles.includes('Warehouse Manager');
        
        // Create fallback permissions object
        const fallbackPermissions: UserPermissions = {
          user_id: decodedToken.user_id,
          username: decodedToken.username,
          roles: roles,
          permissions: [], // We don't have permissions from JWT, but we have roles
          is_admin: isAdmin,
          is_warehouse_manager: isWarehouseManager,
          role_details: roles.map((role: string, index: number) => ({
            role_id: index + 1,
            role_name: role,
            role_description: `${role} role`,
            permissions: []
          }))
        };
        
        setUserPermissions(fallbackPermissions);
      } else {
        setUserPermissions(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [isAuthenticated, token, authLoading]); // Also depend on authLoading

  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!userPermissions) return false;
    return permissions.some(permission => userPermissions.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!userPermissions) return false;
    return permissions.every(permission => userPermissions.permissions.includes(permission));
  };

  const isAdmin = (): boolean => {
    const result = userPermissions?.is_admin || false;
    return result;
  };

  const isWarehouseManager = (): boolean => {
    const result = userPermissions?.is_warehouse_manager || false;
    return result;
  };

  const isEmployee = (): boolean => {
    if (!userPermissions) return false;
    return userPermissions.roles.includes('Employee');
  };

  const hasRole = (role: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.roles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!userPermissions) return false;
    return roles.some(role => userPermissions.roles.includes(role));
  };

  const getUserRoles = (): string[] => {
    if (!userPermissions) return [];
    return userPermissions.roles;
  };

  const refreshPermissions = async () => {
    await fetchUserPermissions();
  };

  const value = {
    userPermissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isWarehouseManager,
    isEmployee,
    hasRole,
    hasAnyRole,
    getUserRoles,
    refreshPermissions,
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};
