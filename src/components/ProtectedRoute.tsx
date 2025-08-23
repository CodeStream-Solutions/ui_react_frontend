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
  const { isAdmin, isWarehouseManager, loading: rbacLoading } = useRBAC();

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

  // Check if user is an employee (not admin or warehouse manager)
  const isEmployee = !isAdmin() && !isWarehouseManager();
  
  // Check if user is a warehouse manager (not admin)
  const isWarehouseManagerUser = isWarehouseManager() && !isAdmin();

  // Admins have access to everything - no restrictions
  if (isAdmin()) {
    return <>{children}</>;
  }

  // If this route is employee-only, only employees can access it
  if (employeeOnly) {
    if (isEmployee) {
      return <>{children}</>;
    } else {
      // Warehouse managers get redirected to tool management
      return <Navigate to="/tool-management" replace />;
    }
  }

  // If this route is warehouse manager-only, only warehouse managers can access it
  if (warehouseManagerOnly) {
    if (isWarehouseManagerUser) {
      return <>{children}</>;
    } else {
      // Employees get redirected to employee dashboard
      return <Navigate to="/employee-dashboard" replace />;
    }
  }

  // If this route has specific allowed roles, check if user has access
  if (allowedRoles.length > 0) {
    const userRole = isWarehouseManagerUser ? 'warehouse_manager' : 'employee';
    if (allowedRoles.includes(userRole)) {
      return <>{children}</>;
    } else {
      // Redirect users to their appropriate dashboard
      if (isEmployee) {
        return <Navigate to="/employee-dashboard" replace />;
      } else if (isWarehouseManagerUser) {
        return <Navigate to="/tool-management" replace />;
      }
    }
  }

  // For employees, restrict access to only the employee dashboard
  if (isEmployee) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/employee-dashboard') {
      return <Navigate to="/employee-dashboard" replace />;
    }
  }

  // For warehouse managers, restrict access to only the tool management page
  if (isWarehouseManagerUser) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/tool-management') {
      return <Navigate to="/tool-management" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
