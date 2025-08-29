import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Package,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Eye,
  Bell,
  Tag,
  X
} from 'lucide-react';
import api, { getApiUrl, toolApi } from '../services/api';
import Navbar from '../components/Navbar';
import Notification from '../components/Notification';

// Interfaces
interface MyTool {
  tool_id: number;
  tool_name: string;
  serial_number: string;
  description?: string;
  category: string;
  status: string;
  checkout_date?: string;
  expected_return_date?: string;
  days_with_tool: number;
  is_overdue: boolean;
  days_overdue: number;
  comments?: string;
}

interface MyToolsData {
  my_tools: MyTool[];
  total_tools: number;
  toolbox_name: string;
}

interface MyActivity {
  transaction_id: number;
  timestamp: string;
  time_ago: string;
  tool_name: string;
  serial_number: string;
  transaction_type: string;
  to_status: string;
  activity_description: string;
  from_toolbox_name: string;
  to_toolbox_name: string;
  from_toolbox_id: number;
  to_toolbox_id: number;
  comments?: string;
  expected_return_date?: string;
}

interface AvailableTool {
  tool_id: number;
  tool_name: string;
  serial_number: string;
  description?: string;
  purchase_date?: string;
  category_id: number;
}

interface ToolDetails {
  ToolID: number;
  SerialNumber: string;
  Name: string;
  Description?: string;
  PurchaseDate?: string;
  CategoryID?: number;
  CurrentStatus: number;
  ToolboxID?: number;
  IsActive: boolean;
  category?: {
    CategoryID: number;
    Name: string;
    Description?: string;
  };
  status?: {
    StatusTypeID: number;
    Name: string;
    Description?: string;
  };
  toolbox?: {
    ToolboxID: number;
    Name: string;
    Description?: string;
    EmployeeID?: number;
  };
}

interface AvailableToolsData {
  tools_by_category: { [category: string]: AvailableTool[] };
  total_available: number;
  categories: { category_id: number; name: string }[];
}

// Issue-related interfaces
interface IssueFormData {
  tool_id: number;
  issue_type: 'safety' | 'damage' | 'malfunction' | 'missing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
}

interface ToolOption {
  tool_id: number;
  tool_name: string;
  serial_number: string;
  category_name?: string;
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [myToolsSelectedCategory, setMyToolsSelectedCategory] = useState<string | null>(null);
  const [myToolsSearchTerm, setMyToolsSearchTerm] = useState<string>('');
  const [availableToolsSearchTerm, setAvailableToolsSearchTerm] = useState<string>('');
  const [showAllMyTools, setShowAllMyTools] = useState<boolean>(false);
  const apiUrl = getApiUrl();

  // Data states
  const [myToolsData, setMyToolsData] = useState<MyToolsData | null>(null);
  const [myActivity, setMyActivity] = useState<MyActivity[]>([]);
  const [availableTools, setAvailableTools] = useState<AvailableToolsData | null>(null);

  // Tool details modal states
  const [showToolDetailsModal, setShowToolDetailsModal] = useState(false);
  const [toolDetailsData, setToolDetailsData] = useState<ToolDetails | null>(null);
  const [toolLatestImage, setToolLatestImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Report issue modal states
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [issueFormData, setIssueFormData] = useState<IssueFormData>({
    tool_id: 0,
    issue_type: 'other',
    priority: 'medium',
    title: '',
    description: ''
  });
  const [toolOptions, setToolOptions] = useState<ToolOption[]>([]);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Refs for scrolling to sections
  const myToolsSectionRef = useRef<HTMLDivElement>(null);
  const overdueSectionRef = useRef<HTMLDivElement>(null);
  const activitySectionRef = useRef<HTMLDivElement>(null);
  const availableToolsSectionRef = useRef<HTMLDivElement>(null);

  const fetchEmployeeData = async () => {
    try {
      setRefreshing(true);
      setError('');

      // Fetch employee-specific data
      const [
        myToolsResponse,
        activityResponse,
        availableResponse
      ] = await Promise.all([
        api.get('/api/dashboard/employee/my-tools'),
        api.get('/api/dashboard/employee/my-activity'),
        api.get(`/api/dashboard/employee/available-tools${selectedCategory ? `?category_id=${selectedCategory}` : ''}`)
      ]);

      setMyToolsData(myToolsResponse.data);
      setMyActivity(activityResponse.data);
      setAvailableTools(availableResponse.data);

    } catch (err: any) {
      setError(`Error: ${err.response?.data?.detail || err.message || 'Failed to fetch employee data'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [selectedCategory]);

  // Get unique categories from my tools
  const myToolsCategories = myToolsData?.my_tools
    ? Array.from(new Set(myToolsData.my_tools.map(tool => tool.category))).sort()
    : [];

  // Filter my tools based on selected category and search term
  const filteredMyTools = myToolsData?.my_tools.filter(tool => {
    const matchesCategory = !myToolsSelectedCategory || tool.category === myToolsSelectedCategory;
    const matchesSearch = !myToolsSearchTerm ||
      tool.tool_name.toLowerCase().includes(myToolsSearchTerm.toLowerCase()) ||
      tool.serial_number.toLowerCase().includes(myToolsSearchTerm.toLowerCase()) ||
      tool.category.toLowerCase().includes(myToolsSearchTerm.toLowerCase()) ||
      (tool.description && tool.description.toLowerCase().includes(myToolsSearchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  }) || [];

  // Limit to 9 tools for display, or show all if expanded
  const displayedMyTools = showAllMyTools ? filteredMyTools : filteredMyTools.slice(0, 9);

  // Filter available tools based on search term
  const filteredAvailableTools = availableTools?.tools_by_category ?
    Object.fromEntries(
      Object.entries(availableTools.tools_by_category).map(([category, tools]) => [
        category,
        tools.filter(tool =>
          !availableToolsSearchTerm ||
          tool.tool_name.toLowerCase().includes(availableToolsSearchTerm.toLowerCase()) ||
          tool.serial_number.toLowerCase().includes(availableToolsSearchTerm.toLowerCase()) ||
          (tool.description && tool.description.toLowerCase().includes(availableToolsSearchTerm.toLowerCase()))
        )
      ]).filter(([, tools]) => tools.length > 0)
    ) : {};

  // Flatten all tools from all categories and limit to 6 total
  const allFilteredTools = Object.entries(filteredAvailableTools).flatMap(([category, tools]) =>
    (tools as any).map((tool: any) => ({ ...tool, category }))
  );
  const displayedAllTools = allFilteredTools.slice(0, 6);

  // Group displayed tools back by category for display
  const displayedAvailableTools = displayedAllTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as { [category: string]: AvailableTool[] });

  const handleToolDetailsClick = async (tool: AvailableTool) => {
    try {
      // Fetch detailed tool information
      const response = await api.get(`/tools/${tool.tool_id}`);
      setToolDetailsData(response.data);
      setShowToolDetailsModal(true);
      setToolLatestImage(null);
      setImageLoading(true);

      // Fetch latest image for the tool
      try {
        const response = await toolApi.getToolLatestImage(tool.tool_id);
        setToolLatestImage(response.data.ImageURL);
      } catch (imageError) {
        // No image found or error - this is fine, just don't show an image
        console.log('No image found for tool:', imageError);
      } finally {
        setImageLoading(false);
      }
    } catch (error) {
      console.error('Error fetching tool details:', error);
      setError('Failed to fetch tool details');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checkout': return <ArrowRight className="h-4 w-4 text-blue-600" />;
      case 'checkin': return <ArrowLeft className="h-4 w-4 text-green-600" />;
      case 'transfer': return <ArrowRight className="h-4 w-4 text-purple-600" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'retire': return <Package className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return 'bg-red-100 text-red-800 border-red-200';
    }

    switch (status.toLowerCase()) {
      case 'in use': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'broken': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Report Issue Functions
  const handleReportIssueClick = async () => {
    try {
      // Prepare tool options from user's current tools only (exclude maintenance/broken)
      const options: ToolOption[] = [];

      // Only add user's current tools that are not in maintenance or broken status
      if (myToolsData?.my_tools) {
        myToolsData.my_tools.forEach((tool: MyTool) => {
          // Exclude tools with maintenance or broken status
          const status = tool.status?.toLowerCase();
          if (status !== 'maintenance' && status !== 'broken') {
            options.push({
              tool_id: tool.tool_id,
              tool_name: tool.tool_name,
              serial_number: tool.serial_number,
              category_name: 'My Tools'
            });
          }
        });
      }

      setToolOptions(options);
      setShowReportIssueModal(true);
    } catch (error) {
      console.error('Error preparing report issue modal:', error);
    }
  };

  const handleIssueFormChange = (field: keyof IssueFormData, value: any) => {
    setIssueFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // KPI Click Handlers
  const handleMyToolsClick = () => {
    myToolsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOverdueClick = () => {
    if (overdueCount > 0) {
      // If there are overdue tools, scroll to the overdue alert banner
      overdueSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // If no overdue tools, scroll to the My Tools section
      myToolsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleActivityClick = () => {
    activitySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAvailableToolsClick = () => {
    availableToolsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmitIssue = async () => {
    if (!issueFormData.tool_id || !issueFormData.title.trim() || !issueFormData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingIssue(true);
      setError('');

      await api.post(`/api/issues/tools/${issueFormData.tool_id}/report`, {
        issue_type: issueFormData.issue_type,
        priority: issueFormData.priority,
        title: issueFormData.title.trim(),
        description: issueFormData.description.trim()
      });

      // Reset form and close modal
      setIssueFormData({
        tool_id: 0,
        issue_type: 'other',
        priority: 'medium',
        title: '',
        description: ''
      });
      setShowReportIssueModal(false);

      // Show success notification
      setNotification({
        show: true,
        type: 'success',
        title: 'Issue Reported Successfully',
        message: 'Your issue has been submitted and administrators have been notified.'
      });

    } catch (error: any) {
      console.error('Error submitting issue:', error);

      // Handle different error response formats
      let errorMessage = 'Failed to submit issue report';
      if (error.response?.data) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors
          const validationErrors = error.response.data.detail.map((err: any) =>
            `${err.loc?.join('.')} - ${err.msg}`
          ).join(', ');
          errorMessage = `Validation errors: ${validationErrors}`;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Report Issue',
        message: errorMessage
      });
    } finally {
      setSubmittingIssue(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{typeof error === 'string' ? error : 'An error occurred'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overdueTool = myToolsData?.my_tools.find(tool => tool.is_overdue);
  const overdueCount = myToolsData?.my_tools.filter(tool => tool.is_overdue).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Notification Component */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        duration={5000}
      />

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Tools Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Welcome, {user?.employee?.FirstName} {user?.employee?.LastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchEmployeeData}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Alert Banner for Overdue Tools */}
          {overdueCount > 0 && (
            <div ref={overdueSectionRef} className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <Bell className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {overdueCount === 1 ? 'Tool Return Overdue' : `${overdueCount} Tools Return Overdue`}
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {overdueCount === 1
                      ? `${overdueTool?.tool_name} is ${overdueTool?.days_overdue} days overdue for return.`
                      : `You have ${overdueCount} tools that are overdue for return. Please return them as soon as possible.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* My Tools Count */}
            <div
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200"
              onClick={handleMyToolsClick}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">My Tools</dt>
                      <dd className="text-2xl font-bold text-gray-900">{myToolsData?.total_tools || 0}</dd>
                      <dd className="text-sm text-blue-600">{myToolsData?.toolbox_name || 'No toolbox'}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Overdue Returns */}
            <div
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md hover:border-red-300 cursor-pointer transition-all duration-200"
              onClick={handleOverdueClick}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Overdue Returns</dt>
                      <dd className="text-2xl font-bold text-red-900">{overdueCount}</dd>
                      <dd className="text-sm text-red-600">Need immediate return</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md hover:border-green-300 cursor-pointer transition-all duration-200"
              onClick={handleActivityClick}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Recent Activity</dt>
                      <dd className="text-2xl font-bold text-gray-900">{myActivity.length}</dd>
                      <dd className="text-sm text-green-600">Last 30 days</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Tools */}
            <div
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md hover:border-purple-300 cursor-pointer transition-all duration-200"
              onClick={handleAvailableToolsClick}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Available</dt>
                      <dd className="text-2xl font-bold text-gray-900">{availableTools?.total_available || 0}</dd>
                      <dd className="text-sm text-purple-600">Ready to checkout</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Tool Issue */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Report Issue</dt>
                      <dd className="text-sm text-red-600">Found a problem?</dd>
                      <dd className="mt-2">
                        <button
                          onClick={handleReportIssueClick}
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Report
                        </button>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid - New Layout */}

          {/* My Current Tools - Full Width */}
          <div ref={myToolsSectionRef} className="bg-white shadow-sm rounded-lg border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="h-5 w-5 text-blue-600 mr-2" />
                  My Current Tools
                </h3>
                <select
                  value={myToolsSelectedCategory || ''}
                  onChange={(e) => setMyToolsSelectedCategory(e.target.value || null)}
                  className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Categories</option>
                  {myToolsCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tools by name, serial number, category, or description..."
                  value={myToolsSearchTerm}
                  onChange={(e) => setMyToolsSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="p-6">
              {displayedMyTools && displayedMyTools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedMyTools.map((tool) => (
                    <div
                      key={tool.tool_id}
                      className={`border rounded-lg p-4 ${tool.is_overdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{tool.tool_name}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(tool.status, tool.is_overdue)}`}>
                              {tool.is_overdue ? `${tool.days_overdue}d overdue` : tool.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">{tool.serial_number} • {tool.category}</p>
                          {tool.description && (
                            <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span>With me for {tool.days_with_tool} days</span>
                            {tool.expected_return_date && (
                              <span>Return by: {new Date(tool.expected_return_date).toLocaleDateString()}</span>
                            )}
                          </div>
                          {tool.comments && (
                            <p className="text-xs text-gray-600 mt-2 italic">"{tool.comments}"</p>
                          )}
                        </div>
                        {tool.is_overdue && (
                          <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    {myToolsSearchTerm
                      ? `No tools found matching "${myToolsSearchTerm}"`
                      : myToolsSelectedCategory
                        ? `No tools in ${myToolsSelectedCategory} category`
                        : 'No tools currently assigned'
                    }
                  </p>
                  {(myToolsSelectedCategory || myToolsSearchTerm) && myToolsData?.my_tools && myToolsData.my_tools.length > 0 && (
                    <div className="mt-2 space-x-2">
                      {myToolsSelectedCategory && (
                        <button
                          onClick={() => setMyToolsSelectedCategory(null)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Show all categories
                        </button>
                      )}
                      {myToolsSearchTerm && (
                        <button
                          onClick={() => setMyToolsSearchTerm('')}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show more indicator if there are more tools than displayed */}
              {filteredMyTools.length > 9 && !showAllMyTools && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Showing 9 of {filteredMyTools.length} tools
                  </p>
                  <button
                    onClick={() => setShowAllMyTools(true)}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Show All Tools
                  </button>
                </div>
              )}

              {/* Show less option when all tools are displayed */}
              {showAllMyTools && filteredMyTools.length > 9 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Showing all {filteredMyTools.length} tools
                  </p>
                  <button
                    onClick={() => setShowAllMyTools(false)}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Show Less
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* My Recent Activity */}
            <div ref={activitySectionRef} className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 text-green-600 mr-2" />
                  My Recent Activity
                </h3>
              </div>
              <div className="p-6">
                {myActivity.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {myActivity.slice(0, 10).map((activity, index) => (
                        <li key={activity.transaction_id}>
                          <div className="relative pb-8">
                            {index !== myActivity.slice(0, 10).length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                {getActivityIcon(activity.transaction_type)}
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    <span className="font-medium">{activity.tool_name}</span>
                                    <span className="text-gray-500"> ({activity.serial_number})</span>
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {activity.activity_description || `${activity.transaction_type} → ${activity.to_status}`}
                                  </p>
                                  {activity.comments && (
                                    <p className="text-xs text-gray-400 italic">"{activity.comments}"</p>
                                  )}
                                </div>
                                <div className="whitespace-nowrap text-right text-xs text-gray-500">
                                  {activity.time_ago}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Available Tools */}
            <div ref={availableToolsSectionRef} className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Search className="h-5 w-5 text-purple-600 mr-2" />
                    Available Tools
                  </h3>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                    className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Categories</option>
                    {availableTools?.categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search available tools by name, serial number, or description..."
                    value={availableToolsSearchTerm}
                    onChange={(e) => setAvailableToolsSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="p-6">
                {Object.keys(displayedAvailableTools).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(displayedAvailableTools).map(([category, tools]) => {
                      const originalTools = filteredAvailableTools[category] || [];
                      return (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <Tag className="h-4 w-4 text-gray-500 mr-2" />
                            {category} ({originalTools.length})
                          </h4>
                          <div className="space-y-2">
                            {(tools as any).map((tool: any) => (
                              <div
                                key={tool.tool_id}
                                className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{tool.tool_name}</p>
                                    <p className="text-sm text-gray-500">{tool.serial_number}</p>
                                    {tool.description && (
                                      <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleToolDetailsClick(tool)}
                                    className="ml-3 inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </button>
                                </div>
                              </div>
                            ))}
                            {originalTools.length > (tools as any).length && (
                              <p className="text-xs text-gray-500 text-center py-2">
                                +{originalTools.length - (tools as any).length} more tools in this category
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">
                      {availableToolsSearchTerm
                        ? `No tools found matching "${availableToolsSearchTerm}"`
                        : 'No tools available for checkout'
                      }
                    </p>
                    {availableToolsSearchTerm && (
                      <button
                        onClick={() => setAvailableToolsSearchTerm('')}
                        className="mt-2 text-purple-600 hover:text-purple-800 text-sm"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}

                {/* Show more indicator if there are more tools than displayed */}
                {allFilteredTools.length > 6 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Showing 6 of {allFilteredTools.length} available tools
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Use search or category filter to find specific tools
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tool Details Modal */}
      {showToolDetailsModal && toolDetailsData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Wrench className="h-5 w-5 text-blue-600 mr-2" />
                  Tool Details
                </h3>
                <button
                  onClick={() => setShowToolDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tool Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Tool Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Basic Information</h4>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">Name:</span>
                        <span className="ml-2 text-sm text-gray-700">{toolDetailsData.Name}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">Serial Number:</span>
                        <span className="ml-2 text-sm text-gray-700">{toolDetailsData.SerialNumber}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">Status:</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${toolDetailsData.status?.Name === 'Available' ? 'bg-green-100 text-green-800' :
                          toolDetailsData.status?.Name === 'In Use' ? 'bg-blue-100 text-blue-800' :
                            toolDetailsData.status?.Name === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              toolDetailsData.status?.Name === 'Lost' ? 'bg-red-100 text-red-800' :
                                toolDetailsData.status?.Name === 'Broken' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                          }`}>
                          {toolDetailsData.status?.Name || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">Location:</span>
                        <span className="ml-2 text-sm text-gray-700">
                          {toolDetailsData.toolbox?.Name || 'Warehouse'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">Category:</span>
                        <span className="ml-2 text-sm text-gray-700">
                          {toolDetailsData.category?.Name || 'Uncategorized'}
                        </span>
                      </div>
                      {toolDetailsData.PurchaseDate && (
                        <div>
                          <span className="text-sm font-medium text-gray-900">Purchase Date:</span>
                          <span className="ml-2 text-sm text-gray-700">
                            {new Date(toolDetailsData.PurchaseDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {toolDetailsData.Description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Description</h4>
                      <p className="mt-2 text-sm text-gray-700">{toolDetailsData.Description}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Image */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Latest Image</h4>
                    <div className="mt-2">
                      {imageLoading ? (
                        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : toolLatestImage ? (
                        <img
                          src={toolLatestImage.startsWith('http') ? toolLatestImage : `${apiUrl}${toolLatestImage}`}
                          alt={`${toolDetailsData.Name} latest image`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No image available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowToolDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                  Report Tool Issue
                </h2>
                <button
                  onClick={() => setShowReportIssueModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Tool Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Tool <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={issueFormData.tool_id}
                    onChange={(e) => handleIssueFormChange('tool_id', parseInt(e.target.value))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value={0}>Choose a tool...</option>
                    {toolOptions.map((tool) => (
                      <option key={`${tool.tool_id}-${tool.category_name}`} value={tool.tool_id}>
                        {tool.tool_name} ({tool.serial_number}) - {tool.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={issueFormData.issue_type}
                    onChange={(e) => handleIssueFormChange('issue_type', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="safety">🚨 Safety Issue</option>
                    <option value="damage">🔧 Damage/Wear</option>
                    <option value="malfunction">⚠️ Malfunction</option>
                    <option value="missing">📦 Missing/Lost</option>
                    <option value="other">❓ Other</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={issueFormData.priority}
                    onChange={(e) => handleIssueFormChange('priority', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="low">🟢 Low - Minor issue, not urgent</option>
                    <option value="medium">🟡 Medium - Moderate issue, needs attention</option>
                    <option value="high">🟠 High - Significant issue, urgent</option>
                    <option value="critical">🔴 Critical - Safety risk, immediate attention</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={issueFormData.title}
                    onChange={(e) => handleIssueFormChange('title', e.target.value)}
                    placeholder="Brief description of the issue..."
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    maxLength={255}
                  />
                  <p className="text-xs text-gray-500 mt-1">{issueFormData.title.length}/255 characters</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={issueFormData.description}
                    onChange={(e) => handleIssueFormChange('description', e.target.value)}
                    placeholder="Please provide detailed information about the issue, including when it occurred, what happened, and any safety concerns..."
                    rows={4}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{typeof error === 'string' ? error : 'An error occurred'}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowReportIssueModal(false)}
                  disabled={submittingIssue}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitIssue}
                  disabled={submittingIssue || !issueFormData.tool_id || !issueFormData.title.trim() || !issueFormData.description.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submittingIssue ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
