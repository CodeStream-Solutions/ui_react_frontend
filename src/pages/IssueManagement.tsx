import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  UserCheck,
  Settings,
  Wrench,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  X
} from 'lucide-react';
import api from '../services/api';
import { useRBAC } from '../contexts/RBACContext';
import Navbar from '../components/Navbar';

// Types
interface UserSummary {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface ToolSummary {
  tool_id: number;
  tool_name: string;
  serial_number: string;
  category_name: string;
}

interface ToolIssue {
  issue_id: number;
  tool: ToolSummary;
  reported_by: UserSummary;
  assigned_to?: UserSummary;
  issue_type: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  reported_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

interface IssueStats {
  total_open: number;
  total_in_progress: number;
  total_resolved: number;
  total_closed: number;
  critical_count: number;
  average_resolution_time_hours?: number;
}

interface IssueListResponse {
  issues: ToolIssue[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface AssignIssueData {
  assigned_to_user_id: number;
}

interface StatusUpdateData {
  status: string;
  resolution_notes?: string;
}

const IssueManagement: React.FC = () => {
  const { hasPermission } = useRBAC();
  
  // Check permissions first, before any other hooks
  if (!hasPermission('manage_issues')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to manage issues.
          </p>
        </div>
      </div>
    );
  }
  
  // State - only called if permission check passes
  const [issues, setIssues] = useState<ToolIssue[]>([]);
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ToolIssue | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdateData>({ status: '' });
  const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    issue_type: '',
    assigned_to_user_id: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch data
  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      
      // By default, exclude closed issues unless specifically filtering for them
      if (!filters.status) {
        params.set('exclude_closed', 'true');
      }
      
      const response = await api.get(`/api/issues/?${params}`);
      const data: IssueListResponse = response.data;
      setIssues(data.issues);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError('Failed to fetch issues');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/issues/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Get only admin users for issue assignment
      const response = await api.get('/users/admin');
      
      // Handle both array and object responses
      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data.users) {
        users = response.data.users;
      } else {
        users = response.data || [];
      }
      
      // Map to our UserSummary interface
      const mappedUsers = users
        .filter((user: any) => {
          const username = user.Username || user.username;
          const isActive = user.IsActive !== false; // Default to active if not specified
          return username !== 'system' && isActive;
        })
        .map((user: any) => ({
          user_id: user.UserID || user.user_id,
          username: user.Username || user.username,
          first_name: user.employee?.FirstName || user.first_name,
          last_name: user.employee?.LastName || user.last_name
        }));
      
      setAvailableUsers(mappedUsers);
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      setAvailableUsers([]);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchStats();
    fetchAvailableUsers();
  }, [currentPage, filters]);

  // Handlers
  const handleViewIssue = (issue: ToolIssue) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  const handleAssignIssue = (issue: ToolIssue) => {
    setSelectedIssue(issue);
    setAssigneeId(issue.assigned_to?.user_id || null);
    setShowAssignModal(true);
  };

  const handleUpdateStatus = (issue: ToolIssue) => {
    setSelectedIssue(issue);
    setStatusUpdate({ 
      status: issue.status,
      resolution_notes: issue.resolution_notes || ''
    });
    setShowStatusModal(true);
  };

  const submitAssignment = async () => {
    if (!selectedIssue || assigneeId === null) return;
    
    try {
      setSubmitting(true);
      const data: AssignIssueData = { assigned_to_user_id: assigneeId };
      await api.put(`/api/issues/${selectedIssue.issue_id}/assign`, data);
      setShowAssignModal(false);
      fetchIssues();
    } catch (err: any) {
      setError('Failed to assign issue');
    } finally {
      setSubmitting(false);
    }
  };

  const submitStatusUpdate = async () => {
    if (!selectedIssue) return;
    
    // Validate that resolution notes are provided when closing an issue
    if ((statusUpdate.status === 'closed' || statusUpdate.status === 'resolved') && 
        (!statusUpdate.resolution_notes || statusUpdate.resolution_notes.trim() === '')) {
      setError('Resolution notes are required when closing or resolving an issue');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.put(`/api/issues/${selectedIssue.issue_id}/status`, statusUpdate);
      setShowStatusModal(false);
      fetchIssues();
      fetchStats(); // Refresh stats
    } catch (err: any) {
      setError('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    // Map frontend filter names to backend parameter names
    const parameterMap: { [key: string]: string } = {
      'assigned_to': 'assigned_to_user_id',
      'reported_by': 'reported_by_user_id'
    };
    
    const backendKey = parameterMap[key] || key;
    setFilters(prev => ({ ...prev, [backendKey]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      issue_type: '',
      assigned_to_user_id: '',
      search: ''
    });
    setCurrentPage(1);
  };

  // KPI Click Handlers
  const handleActiveIssuesClick = () => {
    // Show all active issues (open, in progress, resolved)
    setFilters({
      status: '',
      priority: '',
      issue_type: '',
      assigned_to_user_id: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleOpenIssuesClick = () => {
    // Filter to show only open issues
    setFilters({
      status: 'open',
      priority: '',
      issue_type: '',
      assigned_to_user_id: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleResolvedIssuesClick = () => {
    // Filter to show only resolved issues
    setFilters({
      status: 'resolved',
      priority: '',
      issue_type: '',
      assigned_to_user_id: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleCriticalIssuesClick = () => {
    // Filter to show only critical priority issues
    setFilters({
      status: '',
      priority: 'critical',
      issue_type: '',
      assigned_to_user_id: '',
      search: ''
    });
    setCurrentPage(1);
  };

  // Helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && issues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-2 text-sm text-gray-600">Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Issue Management</h1>
                  <p className="text-sm text-gray-600">Manage and resolve tool issues</p>
                </div>
              </div>
              <button
                onClick={fetchIssues}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200 border border-transparent"
            onClick={handleActiveIssuesClick}
          >
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats ? (stats.total_open + stats.total_in_progress + stats.total_resolved) : 0}
                </p>
                <p className="text-sm text-gray-600">Active Issues</p>
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md hover:border-yellow-300 cursor-pointer transition-all duration-200 border border-transparent"
            onClick={handleOpenIssuesClick}
          >
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.total_open || 0}</p>
                <p className="text-sm text-gray-600">Open Issues</p>
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md hover:border-green-300 cursor-pointer transition-all duration-200 border border-transparent"
            onClick={handleResolvedIssuesClick}
          >
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.total_resolved || 0}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md hover:border-red-300 cursor-pointer transition-all duration-200 border border-transparent"
            onClick={handleCriticalIssuesClick}
          >
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.critical_count || 0}</p>
                <p className="text-sm text-gray-600">Critical</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.average_resolution_time_hours ? Math.round(stats.average_resolution_time_hours) : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Avg Hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search issues..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
              <select
                value={filters.issue_type}
                onChange={(e) => handleFilterChange('issue_type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="malfunction">Malfunction</option>
                <option value="damage">Damage</option>
                <option value="missing">Missing</option>
                <option value="calibration">Calibration</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={filters.assigned_to_user_id}
                onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Users</option>
                <option value="unassigned">Unassigned</option>
                {availableUsers.map(user => (
                  <option key={user.user_id} value={user.user_id?.toString() || ''}>
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issues Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                      No issues found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.issue_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {issue.title}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {issue.issue_type.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {issue.tool.tool_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {issue.tool.serial_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
                          {getStatusIcon(issue.status)}
                          <span className="ml-1 capitalize">{issue.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {issue.reported_by.first_name && issue.reported_by.last_name 
                          ? `${issue.reported_by.first_name} ${issue.reported_by.last_name}`
                          : issue.reported_by.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {issue.assigned_to 
                          ? (issue.assigned_to.first_name && issue.assigned_to.last_name 
                              ? `${issue.assigned_to.first_name} ${issue.assigned_to.last_name}`
                              : issue.assigned_to.username)
                          : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(issue.reported_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewIssue(issue)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAssignIssue(issue)}
                            className="text-green-600 hover:text-green-900"
                            title="Assign"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(issue)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Update Status"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Issue Details Modal */}
      {showIssueModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Issue Details</h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tool</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedIssue.tool.tool_name} ({selectedIssue.tool.serial_number})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedIssue.tool.category_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedIssue.issue_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(selectedIssue.priority)}`}>
                    {selectedIssue.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedIssue.status)}`}>
                    {getStatusIcon(selectedIssue.status)}
                    <span className="ml-1 capitalize">{selectedIssue.status.replace('_', ' ')}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reported By</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedIssue.reported_by.first_name && selectedIssue.reported_by.last_name 
                      ? `${selectedIssue.reported_by.first_name} ${selectedIssue.reported_by.last_name}`
                      : selectedIssue.reported_by.username}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedIssue.assigned_to 
                      ? (selectedIssue.assigned_to.first_name && selectedIssue.assigned_to.last_name 
                          ? `${selectedIssue.assigned_to.first_name} ${selectedIssue.assigned_to.last_name}`
                          : selectedIssue.assigned_to.username)
                      : 'Unassigned'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reported At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedIssue.reported_at)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{selectedIssue.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedIssue.description}</p>
              </div>
              
              {selectedIssue.resolution_notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolution Notes</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedIssue.resolution_notes}</p>
                </div>
              )}
              
              {selectedIssue.resolved_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolved At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedIssue.resolved_at)}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  handleAssignIssue(selectedIssue);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Assign
              </button>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  handleUpdateStatus(selectedIssue);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Update Status
              </button>
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Issue Modal */}
      {showAssignModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Issue</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Assigning: <span className="font-medium">{selectedIssue.title}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to User
              </label>
              <select
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select a user...</option>
                {availableUsers.map(user => (
                  <option key={user.user_id} value={user.user_id || ''}>
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name} (${user.username})`
                      : user.username}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={submitAssignment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={submitting || assigneeId === null}
              >
                {submitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Issue: <span className="font-medium">{selectedIssue.title}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select status...</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={statusUpdate.resolution_notes || ''}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, resolution_notes: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Add resolution notes (optional)..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={submitStatusUpdate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                disabled={submitting || !statusUpdate.status}
              >
                {submitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueManagement;
