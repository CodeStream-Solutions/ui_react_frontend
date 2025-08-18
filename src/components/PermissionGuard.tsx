import React, { ReactNode } from 'react';
import { useRBAC } from '../contexts/RBACContext';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = useRBAC();

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // If no permission specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

interface AdminGuardProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ fallback = null, children }) => {
  const { isAdmin, loading } = useRBAC();

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return isAdmin() ? <>{children}</> : <>{fallback}</>;
};

interface WarehouseManagerGuardProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const WarehouseManagerGuard: React.FC<WarehouseManagerGuardProps> = ({ 
  fallback = null, 
  children 
}) => {
  const { isWarehouseManager, loading } = useRBAC();

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return isWarehouseManager() ? <>{children}</> : <>{fallback}</>;
};
