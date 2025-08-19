import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { userApi } from '../services/api';

interface Permission {
  permission: string;
  description: string;
}

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

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserPermissions = async () => {
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
      setUserPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [isAuthenticated, token]);

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
    return userPermissions?.is_admin || false;
  };

  const isWarehouseManager = (): boolean => {
    return userPermissions?.is_warehouse_manager || false;
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
    refreshPermissions,
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};
