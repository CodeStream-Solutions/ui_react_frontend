import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../contexts/RBACContext';
import { 
  Shield, 
  Users, 
  Settings, 
  LogOut, 
  User,
  Home,
  Wrench,
  UserCheck,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Briefcase
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasPermission, isAdmin, isWarehouseManager } = useRBAC();
  const location = useLocation();
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isDashboardActive = () => {
    return ['/dashboard', '/performance-dashboard', '/alerts-dashboard', '/employee-dashboard', '/executive-dashboard'].includes(location.pathname);
  };

  // Check if user is an employee (not admin or warehouse manager)
  const isEmployee = () => {
    return !isAdmin() && !isWarehouseManager();
  };

  // Check if user is a warehouse manager (not admin or employee)
  const isWarehouseManagerUser = () => {
    return isWarehouseManager() && !isAdmin();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDashboardDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                {isAdmin() ? "Admin Panel" : isWarehouseManagerUser() ? "Tool Management" : "My Tools"}
              </span>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* For employees, only show "My Tools" link */}
              {isEmployee() ? (
                <Link
                  to="/employee-dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/employee-dashboard')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <User className="h-4 w-4 mr-1" />
                  My Tools
                </Link>
              ) : isWarehouseManagerUser() ? (
                /* For warehouse managers, only show "Tool Management" link */
                <Link
                  to="/tool-management"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/tool-management')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Wrench className="h-4 w-4 mr-1" />
                  Tool Management
                </Link>
              ) : (
                /* For admins, show full navigation */
                <>
                  {/* Dashboard Dropdown - only for admins */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
                      className={`inline-flex items-center px-1 pt-1 pb-1 border-b-2 text-sm font-medium h-16 ${
                        isDashboardActive()
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Home className="h-4 w-4 mr-1" />
                      Dashboards
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                    
                    {dashboardDropdownOpen && (
                      <div className="absolute top-16 left-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setDashboardDropdownOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive('/dashboard')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <BarChart3 className="h-4 w-4 mr-3" />
                            <div>
                              <div className="font-medium">Operations</div>
                              <div className="text-xs text-gray-500">Real-time warehouse operations</div>
                            </div>
                          </Link>
                          <Link
                            to="/performance-dashboard"
                            onClick={() => setDashboardDropdownOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive('/performance-dashboard')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <TrendingUp className="h-4 w-4 mr-3" />
                            <div>
                              <div className="font-medium">Performance</div>
                              <div className="text-xs text-gray-500">Analytics and insights</div>
                            </div>
                          </Link>
                          <Link
                            to="/alerts-dashboard"
                            onClick={() => setDashboardDropdownOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive('/alerts-dashboard')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <AlertTriangle className="h-4 w-4 mr-3" />
                            <div>
                              <div className="font-medium">Alerts</div>
                              <div className="text-xs text-gray-500">Risk management</div>
                            </div>
                          </Link>
                          <Link
                            to="/employee-dashboard"
                            onClick={() => setDashboardDropdownOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive('/employee-dashboard')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <User className="h-4 w-4 mr-3" />
                            <div>
                              <div className="font-medium">My Tools</div>
                              <div className="text-xs text-gray-500">Employee self-service</div>
                            </div>
                          </Link>
                          <Link
                            to="/executive-dashboard"
                            onClick={() => setDashboardDropdownOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive('/executive-dashboard')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Briefcase className="h-4 w-4 mr-3" />
                            <div>
                              <div className="font-medium">Executive</div>
                              <div className="text-xs text-gray-500">Strategic insights</div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isAdmin() && (
                    <Link
                      to="/account-management"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/account-management')
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Account Management
                    </Link>
                  )}
                  
                  {isAdmin() && (
                    <Link
                      to="/employee-management"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/employee-management')
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Employee Management
                    </Link>
                  )}
                  
                  {(isAdmin() || isWarehouseManager()) && (
                    <Link
                      to="/tool-management"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/tool-management')
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Wrench className="h-4 w-4 mr-1" />
                      Tool Management
                    </Link>
                  )}
                  
                  {isAdmin() && (
                    <Link
                      to="/issue-management"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/issue-management')
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Issue Management
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-700">
              <User className="h-4 w-4 mr-2" />
              <span>{user?.employee?.FirstName} {user?.employee?.LastName}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
