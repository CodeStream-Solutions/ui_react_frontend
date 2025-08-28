import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../contexts/RBACContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  employeeOnly?: boolean;
  warehouseManagerOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  employeeOnly = false,
  warehouseManagerOnly = false
}) => {
  const { isAuthenticated, loading } = useAuth();
  const { isAdmin, hasRole, loading: rbacLoading } = useRBAC();

  // Show loading spinner while authentication and RBAC are loading
  if (loading || rbacLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has specific roles (can have multiple roles)
  const hasEmployeeRole = hasRole('Employee');
  const hasWarehouseManagerRole = hasRole('Warehouse Manager');

  // Check if user is ONLY an employee (no other roles)
  const isOnlyEmployee = hasEmployeeRole && !hasWarehouseManagerRole && !isAdmin();

  // Check if user is ONLY a warehouse manager (no other roles)
  const isOnlyWarehouseManager = hasWarehouseManagerRole && !hasEmployeeRole && !isAdmin();

  // Admins have access to everything - no restrictions
  if (isAdmin()) {
    return <>{children}</>;
  }

  // If this route is employee-only, users with Employee role can access it
  if (employeeOnly) {
    if (hasEmployeeRole) {
      return <>{children}</>;
    } else {
      // Users without Employee role get redirected to tool management
      return <Navigate to="/tool-management" replace />;
    }
  }

  // If this route is warehouse manager-only, users with Warehouse Manager role can access it
  if (warehouseManagerOnly) {
    if (hasWarehouseManagerRole) {
      return <>{children}</>;
    } else {
      // Users without Warehouse Manager role get redirected to employee dashboard
      return <Navigate to="/employee-dashboard" replace />;
    }
  }

  // If this route has specific allowed roles, check if user has access
  if (allowedRoles.length > 0) {
    const userRole = hasWarehouseManagerRole ? 'warehouse_manager' : 'employee';
    if (allowedRoles.includes(userRole)) {
      return <>{children}</>;
    } else {
      // Redirect users to their appropriate dashboard
      if (hasEmployeeRole) {
        return <Navigate to="/employee-dashboard" replace />;
      } else if (hasWarehouseManagerRole) {
        return <Navigate to="/tool-management" replace />;
      }
    }
  }

  // For users with only Employee role, restrict access to only the employee dashboard
  if (isOnlyEmployee) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/employee-dashboard') {
      return <Navigate to="/employee-dashboard" replace />;
    }
  }

  // For users with only Warehouse Manager role, restrict access to only the tool management page
  if (isOnlyWarehouseManager) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/tool-management') {
      return <Navigate to="/tool-management" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
