import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../contexts/RBACContext';
import { userApi } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Settings,
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
  const { user: currentUser } = useAuth();
  const { hasPermission, isAdmin } = useRBAC();
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        userApi.getUsers(),
        userApi.getRoles()
      ]);

      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);

      // Load user roles for each user
      const rolesData: { [key: number]: UserRole[] } = {};
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
        } catch (error) {
          rolesData[user.UserID] = [];
        }
      }
      setUserRoles(rolesData);
    } catch (error: any) {
      setError('Failed to load data: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const signupData = {
        Username: createForm.Username,
        Password: createForm.Password,
        Email: createForm.Email,
        FirstName: createForm.FirstName,
        LastName: createForm.LastName,
        Phone: createForm.Phone || undefined,
      };

      const response = await userApi.signup(signupData);
      
      // If roles are selected, assign them
      if (createForm.roleIds.length > 0) {
        await userApi.updateUserRolesRBAC(response.data.user_id, createForm.roleIds);
      }

      setSuccess('User created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
      loadData(); // Reload the user list
    } catch (error: any) {
      setError('Failed to create user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setError('');
      setSuccess('');

      await userApi.updateUserRolesRBAC(selectedUser.UserID, roleForm.roleIds);
      setSuccess('User roles updated successfully!');
      setShowRoleModal(false);
      setSelectedUser(null);
      resetRoleForm();
      loadData(); // Reload the user list
    } catch (error: any) {
      setError('Failed to update roles: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');

      await userApi.updateUser(userId, { IsActive: !currentStatus });
      setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      loadData(); // Reload the user list
    } catch (error: any) {
      setError('Failed to update user status: ' + (error.response?.data?.detail || error.message));
    }
  };



  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    const currentRoles = userRoles[user.UserID] || [];
    setRoleForm({
      roleIds: currentRoles.map(role => role.RoleID)
    });
    setShowRoleModal(true);
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
  };

  const resetRoleForm = () => {
    setRoleForm({
      roleIds: []
    });
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee?.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee?.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee?.Email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && user.IsActive) ||
      (statusFilter === 'inactive' && !user.IsActive);
    
    return matchesSearch && matchesStatus;
  });

  const getRoleNames = (userId: number) => {
    const userRolesList = userRoles[userId] || [];
    return userRolesList.map(role => role.RoleName).join(', ') || 'No roles assigned';
  };

  // Check if user has permission to view users
  if (!hasPermission('view_users')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
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
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              {hasPermission('create_users') && (
                <button
                  onClick={() => setShowCreateModal(true)}
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
          <div className="mb-4 rounded-md bg-red-50 p-4">
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
                {filteredUsers.map((user) => (
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
                          className={user.IsActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                          title={user.IsActive ? "Deactivate User" : "Activate User"}
                        >
                          {user.IsActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  onClick={() => setShowCreateModal(false)}
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
                                     <select
                     multiple
                     value={createForm.roleIds.map(String)}
                     onChange={(e) => {
                       const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                       setCreateForm({...createForm, roleIds: selectedOptions});
                     }}
                     className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                   >
                    {roles.map(role => (
                      <option key={role.RoleID} value={role.RoleID}>
                        {role.Name}
                      </option>
                    ))}
                  </select>
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
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create User
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
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateRoles} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Roles</label>
                                     <select
                     multiple
                     value={roleForm.roleIds.map(String)}
                     onChange={(e) => {
                       const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                       setRoleForm({roleIds: selectedOptions});
                     }}
                     className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     size={5}
                   >
                    {roles.map(role => (
                      <option key={role.RoleID} value={role.RoleID}>
                        {role.Name} - {role.Description || 'No description'}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Hold Ctrl (or Cmd on Mac) to select multiple roles
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Update Roles
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
