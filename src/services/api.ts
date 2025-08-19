import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000', // Your FastAPI server URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      // This prevents the page refresh issue when login fails
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// User Account API endpoints
export const userApi = {
  // Authentication
  login: (data: { Username: string; Password: string }) =>
    api.post('/users/login', data),

  signup: (data: {
    Username: string;
    Password: string;
    Email: string;
    FirstName: string;
    LastName: string;
    Phone?: string;
  }) => api.post('/users/signup', data),

  generateOTP: (username: string) =>
    api.post('/users/otp/generate', { username }),

  verifyOTP: (data: { Username: string; OTP: string }) =>
    api.post('/users/otp/verify', data),

  forgotPassword: (email: string) =>
    api.post('/users/forgot-password', { email }),

  resetPassword: (data: { token: string; new_password: string }) =>
    api.post('/users/reset-password', data),

  // User management
  getUsers: () => api.get('/users/'),
  getActiveUsers: () => api.get('/users/active'),
  getUser: (userId: number) => api.get(`/users/${userId}`),
  updateUser: (userId: number, data: any) => api.put(`/users/${userId}`, data),

  // Employee management
  getEmployees: () => api.get('/users/'), // This returns users with employee data
  
  // Direct employee management
  getAllEmployees: () => api.get('/employees/'),
  getActiveEmployees: () => api.get('/employees/active'),
  getEmployee: (employeeId: number) => api.get(`/employees/${employeeId}`),
  createEmployee: (data: any) => api.post('/employees/', data),
  updateEmployee: (employeeId: number, data: any) => api.put(`/employees/${employeeId}`, data),
  toggleEmployeeStatus: (employeeId: number) => api.patch(`/employees/${employeeId}/toggle-status`),

  // Roles (legacy endpoints)
  getRoles: () => api.get('/users/roles'),

  // OTP management
  getOTPStatus: (username: string) => api.get(`/users/otp/status/${username}`),
  resetOTPAttempts: (username: string) => api.post(`/users/otp/reset/${username}`),

  // RBAC
  getMyPermissions: () => api.get('/rbac/my-permissions'),
  checkPermission: (permission: string) => api.get(`/rbac/check-permission/${permission}`),
  getAvailablePermissions: () => api.get('/rbac/available-permissions'),
  getRolesWithPermissions: () => api.get('/rbac/roles'),
  getUserPermissions: (userId: number) => api.get(`/rbac/users/${userId}/permissions`),
  updateUserRolesRBAC: (userId: number, roleIds: number[]) => api.post(`/rbac/users/${userId}/roles`, { user_id: userId, role_ids: roleIds }),
  getUserRolesRBAC: (userId: number) => api.get(`/rbac/users/${userId}/roles`),
  getRolePermissions: (roleId: number) => api.get(`/rbac/roles/${roleId}/permissions`),
};

export const toolApi = {
  // Tools
  getTools: () => api.get('/tools/'),
  getActiveTools: () => api.get('/tools/active'),
  getTool: (toolId: number) => api.get(`/tools/${toolId}`),
  createTool: (data: any) => api.post('/tools/', data),
  updateTool: (toolId: number, data: any) => api.put(`/tools/${toolId}`, data),
  // deleteTool removed - use activate/deactivate toggle instead
  changeToolStatus: (toolId: number, data: any) => api.patch(`/tools/${toolId}/status`, data),
  toggleToolActivation: (toolId: number) => api.patch(`/tools/${toolId}/toggle-activation`),
  
  // Tool Categories
  getToolCategories: () => api.get('/tools/categories/'),
  getToolCategory: (categoryId: number) => api.get(`/tools/categories/${categoryId}`),
  createToolCategory: (data: any) => api.post('/tools/categories/', data),
  updateToolCategory: (categoryId: number, data: any) => api.put(`/tools/categories/${categoryId}`, data),
  deleteToolCategory: (categoryId: number) => api.delete(`/tools/categories/${categoryId}`),
  
  // Tool Status Types
  // Status types (read-only - system managed)
  getToolStatusTypes: () => api.get('/tools/status-types/'),
  getToolStatusType: (statusTypeId: number) => api.get(`/tools/status-types/${statusTypeId}`),
  
  // Toolboxes
  getToolboxes: () => api.get('/tools/toolboxes/'),
  getToolbox: (toolboxId: number) => api.get(`/tools/toolboxes/${toolboxId}`),
  createToolbox: (data: any) => api.post('/tools/toolboxes/', data),
  updateToolbox: (toolboxId: number, data: any) => api.put(`/tools/toolboxes/${toolboxId}`, data),
  softDeleteToolbox: (toolboxId: number) => api.put(`/tools/toolboxes/${toolboxId}/soft-delete`),
  retireToolbox: (toolboxId: number) => api.put(`/tools/toolboxes/${toolboxId}/retire`),
  reactivateToolbox: (toolboxId: number) => api.put(`/tools/toolboxes/${toolboxId}/reactivate`),

  // Transactions
  getTransactions: () => api.get('/transactions/with-details'),
  getTransaction: (transactionId: number) => api.get(`/transactions/${transactionId}`),
  getTransactionsByTool: (toolId: number) => api.get(`/transactions/tool/${toolId}`),
  getTransactionsByToolbox: (toolboxId: number) => api.get(`/transactions/toolbox/${toolboxId}`),
  getTransactionsByEmployee: (employeeId: number) => api.get(`/transactions/employee/${employeeId}`),
  getTransactionTypes: () => api.get('/transactions/types/'),
  getTransactionType: (typeId: number) => api.get(`/transactions/types/${typeId}`),
  getOverdueTools: () => api.get('/transactions/overdue/'),
  getToolsCheckedOutToEmployee: (employeeId: number) => api.get(`/transactions/employee/${employeeId}/checked-out`),
  getToolTransactionHistory: (toolId: number, limit?: number) => api.get(`/transactions/tool/${toolId}/history`, { params: { limit } }),
  getTransactionStatistics: () => api.get('/transactions/statistics'),

  // Transaction Operations
  checkoutTool: (data: any) => api.post('/transactions/checkout', data),
  checkinTool: (data: any) => api.post('/transactions/checkin', data),
  transferTool: (data: any) => api.post('/transactions/transfer', data),
  sendToolForMaintenance: (data: any) => api.post('/transactions/maintenance', data),
  returnFromMaintenance: (data: any) => api.post('/transactions/return-from-maintenance', data),
  retireTool: (data: any) => api.post('/transactions/retire', data),
  getToolsInMaintenance: () => api.get('/transactions/tools-in-maintenance'),
  bulkCheckoutTools: (data: any) => api.post('/transactions/bulk-checkout', data),
  
  // General Transaction CRUD
  createTransaction: (data: any) => api.post('/transactions/', data),
  updateTransaction: (transactionId: number, data: any) => api.put(`/transactions/${transactionId}`, data),
  deleteTransaction: (transactionId: number) => api.delete(`/transactions/${transactionId}`),

  // Transaction Images
  addTransactionImage: (transactionId: number, data: { ImageURL: string }) => api.post(`/transactions/${transactionId}/images`, data),
  getTransactionImages: (transactionId: number) => api.get(`/transactions/${transactionId}/images`),
  deleteTransactionImage: (imageId: number) => api.delete(`/transactions/images/${imageId}`),
  getToolLatestImage: (toolId: number) => api.get(`/transactions/tools/${toolId}/latest-image`),
  
  // File Upload
  uploadFiles: (files: FormData) => api.post('/api/files/upload', files, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadBase64Images: (images: Array<{data: string, filename?: string}>) => api.post('/api/files/upload/base64', images),
};

export default api;
