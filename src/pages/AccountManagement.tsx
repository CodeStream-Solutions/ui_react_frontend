import React, { useState, useEffect, useRef } from 'react';
import { useRBAC } from '../contexts/RBACContext';
import { userApi } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface User {
  UserID: number;
  Username: string;
  IsActive: boolean;
  CreatedAt: string;
  employee?: {
    EmployeeID: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Phone?: string;
    IsActive: boolean;
  };
}

interface Role {
  RoleID: number;
  Name: string;
  Description?: string;
}

interface UserRole {
  UserID: number;
  RoleID: number;
  RoleName: string;
  AssignedDate: string;
}



const AccountManagement: React.FC = () => {
  const { hasPermission } = useRBAC();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<{ [key: number]: UserRole[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create user form state
  const [createForm, setCreateForm] = useState({
    Username: '',
    Password: '',
    Email: '',
    FirstName: '',
    LastName: '',
    Phone: '',
    IsActive: false,
    roleIds: [] as number[]
  });

  // Role management state
  const [roleForm, setRoleForm] = useState({
    roleIds: [] as number[]
  });

  // Role validation state
  const [roleValidationError, setRoleValidationError] = useState('');
  
  // Loading states
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<number | null>(null);
  
  // Refs for scrolling to errors
  const errorRef = useRef<HTMLDivElement>(null);
  const createModalErrorRef = useRef<HTMLDivElement>(null);
  const roleModalErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if API is accessible
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      const [usersResponse, rolesResponse] = await Promise.all([
        userApi.getUsers(),
        userApi.getRoles()
      ]);

      if (!usersResponse.data || !Array.isArray(usersResponse.data)) {
        throw new Error('Invalid response format for users data');
      }
      
      if (!rolesResponse.data || !Array.isArray(rolesResponse.data)) {
        throw new Error('Invalid response format for roles data');
      }

      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);

      // Load user roles for each user
      const rolesData: { [key: number]: UserRole[] } = {};
      const roleLoadErrors: string[] = [];
      
      for (const user of usersResponse.data) {
        try {
          const userRolesResponse = await userApi.getUserRolesRBAC(user.UserID);
          // Transform the response to match the expected format
          const transformedRoles = userRolesResponse.data.roles.map((role: any) => ({
            UserID: user.UserID,
            RoleID: role.role_id,
            RoleName: role.role_name,
            AssignedDate: new Date().toISOString()
          }));
          rolesData[user.UserID] = transformedRoles;
        } catch (error: any) {
          console.warn(`Failed to load roles for user ${user.UserID}:`, error);
          rolesData[user.UserID] = [];
          roleLoadErrors.push(`User ${user.employee?.FirstName || user.Username}: ${error.response?.data?.detail || error.message}`);
        }
      }
      
      setUserRoles(rolesData);
      
      // Show warning if some roles failed to load
      if (roleLoadErrors.length > 0) {
        setError(`Data loaded with warnings: Some user roles could not be loaded. ${roleLoadErrors.slice(0, 3).join('; ')}${roleLoadErrors.length > 3 ? '...' : ''}`);
        setTimeout(() => {
          errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      
    } catch (error: any) {
      let errorMessage = 'Unknown error occurred';
      
      if (error.message.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication error: Your session may have expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied: You do not have permission to view this data.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Resource not found: The requested data could not be located.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error: The server encountered an internal error. Please try again later.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(`Failed to load data: ${errorMessage}`);
      // Scroll to error
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // Role validation function
  const validateRoleCombination = (selectedRoleIds: number[]): string => {
    if (selectedRoleIds.length === 0) {
      return 'At least one role must be selected';
    }

    const selectedRoleNames = selectedRoleIds.map(id => {
      const role = roles.find(r => r.RoleID === id);
      return role?.Name;
    }).filter(Boolean) as string[];

    const hasAdmin = selectedRoleNames.includes('Admin');
    const hasEmployee = selectedRoleNames.includes('Employee');
    const hasWarehouseManager = selectedRoleNames.includes('Warehouse Manager');

    // Rule 1: If Admin is present, it must be Admin alone
    if (hasAdmin) {
      if (hasEmployee || hasWarehouseManager) {
        return 'Admin cannot be combined with any other roles';
      }
      // Admin alone is valid
      return '';
    }

    // Rule 2: If no Admin, allow Employee + Warehouse Manager or either alone
    if (hasEmployee && hasWarehouseManager) {
      // Employee + Warehouse Manager is valid
      return '';
    }
    if (hasEmployee || hasWarehouseManager) {
      // Either role alone is valid
      return '';
    }

    return 'Invalid role combination';
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!createForm.Username.trim()) {
      setError('Username is required');
      setTimeout(() => {
        createModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    
    if (!createForm.Password.trim()) {
      setError('Password is required');
      setTimeout(() => {
        createModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    
    if (!createForm.Email.trim()) {
      setError('Email is required');
      setTimeout(() => {
        createModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    
    if (!createForm.FirstName.trim()) {
      setError('First name is required');
      setTimeout(() => {
        createModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    
    if (!createForm.LastName.trim()) {
      setError('Last name is required');
      setTimeout(() => {
        createModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    
    // Validate role combination
    const validationError = validateRoleCombination(createForm.roleIds);
    if (validationError) {
      setError('Role validation failed: ' + validationError);
      // Scroll to error in modal
      setTimeout(() => {
        createModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    try {
      setIsCreatingUser(true);
      setError('');
      setSuccess('');

      const signupData = {
        Username: createForm.Username,
        Password: createForm.Password,
        Email: createForm.Email,
        FirstName: createForm.FirstName,
        LastName: createForm.LastName,
        Phone: createForm.Phone || undefined,
        activate_immediately: createForm.IsActive, // Use the checkbox value
      };

      const response = await userApi.signup(signupData);
      
      // If roles are selected, assign them
      if (createForm.roleIds.length > 0) {
        try {
          await userApi.updateUserRolesRBAC(response.data.user_id, createForm.roleIds);
        } catch (roleError: any) {
          const roleErrorMessage = extractErrorMessage(roleError);
          setError(`User created but failed to assign roles: ${roleErrorMessage}`);
          // Scroll to error in modal
          setTimeout(() => {
            createModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          return;
        }
      }

      setSuccess('User created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
      loadData(); // Reload the user list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      setError(`Failed to create user: ${errorMessage}`);
      // Scroll to error in modal
      setTimeout(() => {
        createModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('No user selected for role update');
      return;
    }

    // Validate role combination
    const validationError = validateRoleCombination(roleForm.roleIds);
    if (validationError) {
      setError('Role validation failed: ' + validationError);
      // Scroll to error in modal
      setTimeout(() => {
        roleModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    try {
      setIsUpdatingRoles(true);
      setError('');
      setSuccess('');

      await userApi.updateUserRolesRBAC(selectedUser.UserID, roleForm.roleIds);
      setSuccess('User roles updated successfully!');
      setShowRoleModal(false);
      setSelectedUser(null);
      resetRoleForm();
      loadData(); // Reload the user list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      setError(`Failed to update roles: ${errorMessage}`);
      // Scroll to error in modal
      setTimeout(() => {
        roleModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setIsUpdatingRoles(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      setIsTogglingStatus(userId);
      setError('');
      setSuccess('');

      await userApi.updateUser(userId, { IsActive: !currentStatus });
      setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      loadData(); // Reload the user list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      setError(`Failed to update user status: ${errorMessage}`);
      // Scroll to error
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const openRoleModal = (user: User) => {
    if (!user) {
      setError('No user selected for role management');
      return;
    }
    
    setSelectedUser(user);
    const currentRoles = userRoles[user.UserID] || [];
    setRoleForm({
      roleIds: currentRoles.map(role => role.RoleID)
    });
    setShowRoleModal(true);
    setError('');
    setSuccess('');
    setRoleValidationError('');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
    resetRoleForm();
  };

  const resetCreateForm = () => {
    setCreateForm({
      Username: '',
      Password: '',
      Email: '',
      FirstName: '',
      LastName: '',
      Phone: '',
      IsActive: false,
      roleIds: []
    });
    setRoleValidationError('');
    setError('');
    setSuccess('');
  };

  const resetRoleForm = () => {
    setRoleForm({
      roleIds: []
    });
    setRoleValidationError('');
    setError('');
    setSuccess('');
  };

  const handleRoleSelection = (roleId: number, isChecked: boolean, formType: 'create' | 'role') => {
    const currentRoleIds = formType === 'create' ? createForm.roleIds : roleForm.roleIds;
    let newRoleIds: number[];

    if (isChecked) {
      newRoleIds = [...currentRoleIds, roleId];
    } else {
      newRoleIds = currentRoleIds.filter(id => id !== roleId);
    }

    // Get the role name for the selected role
    const selectedRole = roles.find(r => r.RoleID === roleId);
    const selectedRoleName = selectedRole?.Name;

    // Auto-deselect incompatible roles
    if (isChecked && selectedRoleName === 'Admin') {
      // If Admin is selected, deselect all other roles
      newRoleIds = [roleId];
    } else if (isChecked && selectedRoleName !== 'Admin') {
      // If a non-Admin role is selected, deselect Admin
      const adminRole = roles.find(r => r.Name === 'Admin');
      if (adminRole) {
        newRoleIds = newRoleIds.filter(id => id !== adminRole.RoleID);
      }
    }

    // Validate the new combination
    const validationError = validateRoleCombination(newRoleIds);
    setRoleValidationError(validationError);

    if (formType === 'create') {
      setCreateForm({ ...createForm, roleIds: newRoleIds });
    } else {
      setRoleForm({ roleIds: newRoleIds });
    }
  };

  // Helper function to format validation errors into user-friendly messages
  const formatValidationError = (err: any): string => {
    const field = err.loc?.[err.loc.length - 1] || 'field';
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    
    switch (err.type) {
      case 'string_too_short':
        return `${fieldName} must be at least ${err.ctx.min_length} characters long`;
      case 'string_too_long':
        return `${fieldName} must be no more than ${err.ctx.max_length} characters long`;
      case 'value_error.email':
        return `${fieldName} must be a valid email address`;
      case 'value_error.any_str.min_length':
        return `${fieldName} must be at least ${err.ctx.limit_value} characters long`;
      case 'value_error.any_str.max_length':
        return `${fieldName} must be no more than ${err.ctx.limit_value} characters long`;
      case 'missing':
        return `${fieldName} is required`;
      case 'value_error':
        return `${fieldName}: ${err.msg}`;
      default:
        return err.msg || err.message || `${fieldName}: ${err.type}`;
    }
  };

  // Helper function to extract error message from API response
  const extractErrorMessage = (error: any): string => {
    
    // Handle 400 Bad Request (like duplicate username/email)
    if (error.response?.status === 400) {
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle case where detail is a string (like "Username already exists")
        if (typeof detail === 'string') {
          return detail;
        }
        // Handle case where detail is an array of validation errors
        if (Array.isArray(detail)) {
          return detail.map((err: any) => formatValidationError(err)).join(', ');
        }
        return String(detail);
      } else if (error.response?.data?.message) {
        return error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        return error.response.data;
      } else if (error.response?.data) {
        const data = error.response.data;
        if (data.errors && Array.isArray(data.errors)) {
          return data.errors.map((err: any) => formatValidationError(err)).join(', ');
        } else if (typeof data === 'object') {
          return Object.values(data).join(', ');
        } else {
          return JSON.stringify(data);
        }
      } else {
        return 'Bad request: Please check your input and try again.';
      }
    }
    
    // Handle 422 Validation Error
    if (error.response?.status === 422) {
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle case where detail is a string
        if (typeof detail === 'string') {
          return detail;
        }
        // Handle case where detail is an array of validation errors
        if (Array.isArray(detail)) {
          return detail.map((err: any) => formatValidationError(err)).join(', ');
        }
        return String(detail);
      } else if (error.response?.data?.message) {
        return error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        return error.response.data;
      } else if (error.response?.data) {
        const data = error.response.data;
        if (data.errors && Array.isArray(data.errors)) {
          return data.errors.map((err: any) => formatValidationError(err)).join(', ');
        } else if (typeof data === 'object') {
          return Object.values(data).join(', ');
        } else {
          return JSON.stringify(data);
        }
      } else {
        return 'Validation error: Please check your input and try again.';
      }
    }
    
    // Handle 409 Conflict
    if (error.response?.status === 409) {
      return 'Username or email already exists. Please choose a different one.';
    }
    
    // Handle other response errors
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail.map((err: any) => err.msg || err.message || err).join(', ');
      }
      return String(detail);
    } else if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string') {
        return data;
      } else if (typeof data === 'object') {
        return JSON.stringify(data);
      }
    }
    
    // Handle network errors
    if (error.message) {
      return error.message;
    }
    
    return 'Unknown error occurred';
  };

  // Function to scroll to error when validation error changes
  useEffect(() => {
    if (roleValidationError) {
      const scrollTarget = showCreateModal ? createModalErrorRef : roleModalErrorRef;
      setTimeout(() => {
        scrollTarget.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [roleValidationError, showCreateModal]);

  const getRoleNames = (userId: number) => {
    const userRolesList = userRoles[userId] || [];
    return userRolesList.map(role => role.RoleName).join(', ') || 'No roles assigned';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.employee?.FirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee?.LastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee?.Email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.IsActive) ||
                         (statusFilter === 'inactive' && !user.IsActive);
    
    return matchesSearch && matchesStatus;
  });

  if (!hasPermission('manage_user_roles')) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h2>
            <p className="mt-2 text-sm text-gray-500">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
            </div>
            <div className="flex items-center space-x-4">
                             <button
                 onClick={loadData}
                 disabled={loading}
                 className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                 {loading ? 'Loading...' : 'Refresh'}
               </button>
                             {hasPermission('create_users') && (
                 <button
                   onClick={() => {
                     setShowCreateModal(true);
                     setError('');
                     setSuccess('');
                   }}
                   className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                   <UserPlus className="h-4 w-4 mr-2" />
                   Add User
                 </button>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                 {/* Alerts */}
         {error && (
           <div ref={errorRef} className="mb-4 rounded-md bg-red-50 p-4">
             <div className="flex">
               <AlertCircle className="h-5 w-5 text-red-400" />
               <div className="ml-3">
                 <h3 className="text-sm font-medium text-red-800">{error}</h3>
               </div>
             </div>
           </div>
         )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search by name, username, or email..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-500">
                  {filteredUsers.length} of {users.length} users
                </div>
              </div>
            </div>
          </div>
        </div>

                 {/* Users Table */}
         <div className="bg-white shadow overflow-hidden sm:rounded-md">
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     User
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Contact
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Roles
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Status
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Created
                   </th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Actions
                   </th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {filteredUsers.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center">
                       <div className="flex flex-col items-center">
                         <Users className="h-12 w-12 text-gray-400 mb-4" />
                         <h3 className="text-lg font-medium text-gray-900 mb-2">
                           {users.length === 0 ? 'No users found' : 'No users match your search'}
                         </h3>
                         <p className="text-sm text-gray-500 mb-4">
                           {users.length === 0 
                             ? 'Get started by creating your first user account.' 
                             : 'Try adjusting your search terms or filters.'
                           }
                         </p>
                         {users.length === 0 && hasPermission('create_users') && (
                           <button
                             onClick={() => {
                               setShowCreateModal(true);
                               setError('');
                               setSuccess('');
                             }}
                             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                           >
                             <UserPlus className="h-4 w-4 mr-2" />
                             Create First User
                           </button>
                         )}
                       </div>
                     </td>
                   </tr>
                                  ) : (
                   filteredUsers.map((user) => (
                     <tr key={user.UserID} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-10 w-10">
                             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                               <Users className="h-6 w-6 text-blue-600" />
                             </div>
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-medium text-gray-900">
                               {user.employee?.FirstName} {user.employee?.LastName}
                             </div>
                             <div className="text-sm text-gray-500">
                               @{user.Username}
                             </div>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900">{user.employee?.Email}</div>
                         <div className="text-sm text-gray-500">{user.employee?.Phone || 'No phone'}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900 max-w-xs truncate">
                           {getRoleNames(user.UserID)}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           user.IsActive 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-red-100 text-red-800'
                         }`}>
                           {user.IsActive ? (
                             <>
                               <CheckCircle className="h-3 w-3 mr-1" />
                               Active
                             </>
                           ) : (
                             <>
                               <XCircle className="h-3 w-3 mr-1" />
                               Inactive
                             </>
                           )}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {new Date(user.CreatedAt).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <div className="flex items-center justify-end space-x-2">
                           <button
                             onClick={() => openRoleModal(user)}
                             className="text-blue-600 hover:text-blue-900"
                             title="Manage Roles"
                           >
                             <Shield className="h-4 w-4" />
                           </button>
                           <button
                             onClick={() => handleToggleUserStatus(user.UserID, user.IsActive)}
                             disabled={isTogglingStatus === user.UserID}
                             className={`${user.IsActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"} disabled:opacity-50 disabled:cursor-not-allowed`}
                             title={user.IsActive ? "Deactivate User" : "Activate User"}
                           >
                             {isTogglingStatus === user.UserID ? (
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                             ) : (
                               user.IsActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
                             )}
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))
                 )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                                 <button
                   onClick={closeCreateModal}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <XCircle className="h-6 w-6" />
                 </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      required
                      value={createForm.FirstName}
                      onChange={(e) => setCreateForm({...createForm, FirstName: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      required
                      value={createForm.LastName}
                      onChange={(e) => setCreateForm({...createForm, LastName: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    required
                    value={createForm.Username}
                    onChange={(e) => setCreateForm({...createForm, Username: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.Email}
                    onChange={(e) => setCreateForm({...createForm, Email: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    value={createForm.Password}
                    onChange={(e) => setCreateForm({...createForm, Password: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={createForm.Phone}
                    onChange={(e) => setCreateForm({...createForm, Phone: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                                 <div>
                   <label className="block text-sm font-medium text-gray-700">Roles</label>
                                      <div className="mt-1">
                     {roles.map(role => (
                       <div key={role.RoleID} className="flex items-center mb-2">
                         <input
                           type="checkbox"
                           id={`role-${role.RoleID}`}
                           checked={createForm.roleIds.includes(role.RoleID)}
                           onChange={(e) => handleRoleSelection(role.RoleID, e.target.checked, 'create')}
                           className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                         />
                         <label htmlFor={`role-${role.RoleID}`} className="ml-2 text-sm text-gray-900">
                           {role.Name} - {role.Description || 'No description'}
                         </label>
                       </div>
                     ))}
                     {roleValidationError && (
                       <p className="mt-2 text-sm text-red-600">{roleValidationError}</p>
                     )}
                     <div className="mt-3 p-3 bg-blue-50 rounded-md">
                       <p className="text-sm text-blue-800 font-medium mb-2">Role Combination Rules:</p>
                       <ul className="text-xs text-blue-700 space-y-1">
                         <li>• Admin can only be assigned alone (no combinations)</li>
                         <li>• Employee can be combined with Warehouse Manager</li>
                         <li>• Employee and Warehouse Manager can be used alone or together</li>
                       </ul>
                     </div>
                   </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.IsActive}
                    onChange={(e) => setCreateForm({...createForm, IsActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Activate account immediately
                  </label>
                </div>
                
                                 {/* Error display in modal */}
                 {error && (
                   <div ref={createModalErrorRef} className="rounded-md bg-red-50 p-3">
                     <div className="flex">
                       <AlertCircle className="h-5 w-5 text-red-400" />
                       <div className="ml-3">
                         <h3 className="text-sm font-medium text-red-800">{error}</h3>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 <div className="flex justify-end space-x-3">
                   <button
                     type="button"
                     onClick={closeCreateModal}
                     disabled={isCreatingUser}
                     className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={isCreatingUser}
                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                   >
                     {isCreatingUser ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                         Creating...
                       </>
                     ) : (
                       'Create User'
                     )}
                   </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Roles for {selectedUser.employee?.FirstName} {selectedUser.employee?.LastName}
                </h3>
                                 <button
                   onClick={closeRoleModal}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <XCircle className="h-6 w-6" />
                 </button>
              </div>
              
              <form onSubmit={handleUpdateRoles} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Roles</label>
                                     <div className="mt-1">
                     {roles.map(role => (
                       <div key={role.RoleID} className="flex items-center mb-2">
                         <input
                           type="checkbox"
                           id={`role-${role.RoleID}`}
                           checked={roleForm.roleIds.includes(role.RoleID)}
                           onChange={(e) => handleRoleSelection(role.RoleID, e.target.checked, 'role')}
                           className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                         />
                         <label htmlFor={`role-${role.RoleID}`} className="ml-2 text-sm text-gray-900">
                           {role.Name} - {role.Description || 'No description'}
                         </label>
                       </div>
                     ))}
                     {roleValidationError && (
                       <p className="mt-2 text-sm text-red-600">{roleValidationError}</p>
                     )}
                     <div className="mt-3 p-3 bg-blue-50 rounded-md">
                       <p className="text-sm text-blue-800 font-medium mb-2">Role Combination Rules:</p>
                       <ul className="text-xs text-blue-700 space-y-1">
                         <li>• Admin can only be assigned alone (no combinations)</li>
                         <li>• Employee can be combined with Warehouse Manager</li>
                         <li>• Employee and Warehouse Manager can be used alone or together</li>
                       </ul>
                     </div>
                   </div>
                </div>
                
                                 {/* Error display in modal */}
                 {error && (
                   <div ref={roleModalErrorRef} className="rounded-md bg-red-50 p-3">
                     <div className="flex">
                       <AlertCircle className="h-5 w-5 text-red-400" />
                       <div className="ml-3">
                         <h3 className="text-sm font-medium text-red-800">{error}</h3>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 <div className="flex justify-end space-x-3">
                   <button
                     type="button"
                     onClick={closeRoleModal}
                     disabled={isUpdatingRoles}
                     className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={isUpdatingRoles}
                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                   >
                     {isUpdatingRoles ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                         Updating...
                       </>
                     ) : (
                       'Update Roles'
                     )}
                   </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
