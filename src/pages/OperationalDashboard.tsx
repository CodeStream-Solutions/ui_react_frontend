import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../contexts/RBACContext';
import { 
  Package, 
  Users, 
  AlertTriangle, 
  Wrench,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  RefreshCw,
  BarChart3,
  MapPin,
  Bell,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Settings
} from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';

// Interfaces
interface OperationalMetrics {
  tools_available_now: number;
  active_deployments: number;
  overdue_returns: number;
  maintenance_queue: number;
  total_tools: number;
  warehouse_capacity_percent: number;
  deployment_rate: number;
}

interface LiveActivity {
  transaction_id: number;
  timestamp: string;
  time_ago: string;
  tool_name: string;
  serial_number: string;
  transaction_type: string;
  to_status: string;
  employee_name: string;
  comments?: string;
}

interface CategoryStatus {
  category: string;
  total: number;
  available_in_warehouse: number;
  deployed: number;
  maintenance: number;
  availability_ratio: number;
  status_level: string;
  status_color: string;
}

interface WarehouseStatus {
  categories: CategoryStatus[];
  warehouse_utilization: number;
  total_tools: number;
  tools_in_warehouse: number;
}

interface EmployeeAssignment {
  employee_id: number;
  employee_name: string;
  toolbox_name: string;
  tools_count: number;
  last_activity?: string;
  activity_status: string;
  activity_color: string;
}

interface PendingAction {
  tool_id: number;
  tool_name: string;
  serial_number: string;
  employee_name?: string;
  expected_return_date?: string;
  checkout_date?: string;
  days_overdue?: number;
  status?: string;
  status_since?: string;
  lost_since?: string;
}

interface PendingActions {
  overdue_returns: PendingAction[];
  maintenance_needed: PendingAction[];
  broken_tools: PendingAction[];
  lost_tools: PendingAction[];
}

const OperationalDashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  const [warehouseStatus, setWarehouseStatus] = useState<WarehouseStatus | null>(null);
  const [employeeAssignments, setEmployeeAssignments] = useState<EmployeeAssignment[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingActions | null>(null);
  
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      if (!hasPermission('view_dashboard')) {
        setError('You do not have permission to view the dashboard');
        return;
      }

      // Fetch all operational data in parallel
      const [
        metricsResponse,
        activityResponse,
        warehouseResponse,
        employeesResponse,
        actionsResponse
      ] = await Promise.all([
        api.get('/api/dashboard/operational/metrics'),
        api.get('/api/dashboard/operational/live-activity'),
        api.get('/api/dashboard/operational/warehouse-status'),
        api.get('/api/dashboard/operational/employee-assignments'),
        api.get('/api/dashboard/operational/pending-actions')
      ]);
      
      setMetrics(metricsResponse.data);
      setLiveActivity(activityResponse.data);
      setWarehouseStatus(warehouseResponse.data);
      setEmployeeAssignments(employeesResponse.data);
      setPendingActions(actionsResponse.data);
      
    } catch (err: any) {
      setError(`Error: ${err.response?.data?.detail || err.message || 'Failed to fetch dashboard data'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-100 border-green-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'orange': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'red': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
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
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
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
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Operational Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time warehouse operations and tool management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
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
          
          {/* Real-Time Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Tools Available Now */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Available Now</dt>
                      <dd className="text-2xl font-bold text-gray-900">{metrics?.tools_available_now || 0}</dd>
                      <dd className="text-sm text-green-600">Ready for checkout</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Deployments */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Deployments</dt>
                      <dd className="text-2xl font-bold text-gray-900">{metrics?.active_deployments || 0}</dd>
                      <dd className="text-sm text-blue-600">{metrics?.deployment_rate || 0}% of tools</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Overdue Returns */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Overdue Returns</dt>
                      <dd className="text-2xl font-bold text-gray-900">{metrics?.overdue_returns || 0}</dd>
                      <dd className="text-sm text-orange-600">Need attention</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Queue */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Wrench className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Maintenance Queue</dt>
                      <dd className="text-2xl font-bold text-gray-900">{metrics?.maintenance_queue || 0}</dd>
                      <dd className="text-sm text-red-600">Needing service</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Live Activity & Warehouse Status */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Live Activity Feed */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 text-blue-600 mr-2" />
                    Live Activity Feed
                  </h3>
                </div>
                <div className="p-6">
                  {liveActivity.length > 0 ? (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {liveActivity.map((activity, index) => (
                          <li key={activity.transaction_id}>
                            <div className="relative pb-8">
                              {index !== liveActivity.length - 1 && (
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
                                      {activity.transaction_type} → {activity.to_status}
                                    </p>
                                    <p className="text-xs text-gray-400">by {activity.employee_name}</p>
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

              {/* Warehouse Status */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    Category Availability Status
                  </h3>
                </div>
                <div className="p-6">
                  {warehouseStatus?.categories && warehouseStatus.categories.length > 0 ? (
                    <div className="space-y-4">
                      {warehouseStatus.categories.map((category, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{category.category}</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(category.status_color)}`}>
                              {category.status_level}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span>Available: {category.available_in_warehouse}</span>
                            <span>Deployed: {category.deployed}</span>
                            <span>Maintenance: {category.maintenance}</span>
                            <span>Broken: {category.broken}</span>
                            <span>Lost: {category.lost}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${category.availability_ratio}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No category data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Employee Assignments & Pending Actions */}
            <div className="space-y-8">
              
              {/* Employee Tool Assignments */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    Employee Assignments
                  </h3>
                </div>
                <div className="p-6">
                  {employeeAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {employeeAssignments.slice(0, 8).map((assignment, index) => (
                        <div key={assignment.employee_id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{assignment.employee_name}</p>
                            <p className="text-xs text-gray-500 truncate">{assignment.toolbox_name}</p>
                          </div>
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <div className="text-right">
                              <span className="text-sm font-semibold text-gray-900">{assignment.tools_count} tools</span>
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.activity_color)}`}>
                                {assignment.activity_status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No employee assignments</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Actions */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Bell className="h-5 w-5 text-red-600 mr-2" />
                    Pending Actions
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Overdue Returns */}
                    {pendingActions?.overdue_returns && pendingActions.overdue_returns.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-600 mb-2">Overdue Returns ({pendingActions.overdue_returns.length})</h4>
                        <div className="space-y-2">
                          {pendingActions.overdue_returns.slice(0, 3).map((item) => (
                            <div key={item.tool_id} className="text-sm">
                              <span className="font-medium">{item.tool_name}</span>
                              <span className="text-gray-500"> - {item.employee_name}</span>
                              <span className="text-red-600"> ({item.days_overdue}d overdue)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Maintenance Needed */}
                    {pendingActions?.maintenance_needed && pendingActions.maintenance_needed.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-orange-600 mb-2">Maintenance Needed ({pendingActions.maintenance_needed.length})</h4>
                        <div className="space-y-2">
                          {pendingActions.maintenance_needed.slice(0, 3).map((item) => (
                            <div key={item.tool_id} className="text-sm">
                              <span className="font-medium">{item.tool_name}</span>
                              <span className="text-gray-500"> - {item.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Broken Tools */}
                    {pendingActions?.broken_tools && pendingActions.broken_tools.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-600 mb-2">Broken Tools ({pendingActions.broken_tools.length})</h4>
                        <div className="space-y-2">
                          {pendingActions.broken_tools.slice(0, 3).map((item) => (
                            <div key={item.tool_id} className="text-sm">
                              <span className="font-medium">{item.tool_name}</span>
                              <span className="text-gray-500"> - {item.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lost Tools */}
                    {pendingActions?.lost_tools && pendingActions.lost_tools.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-600 mb-2">Lost Tools ({pendingActions.lost_tools.length})</h4>
                        <div className="space-y-2">
                          {pendingActions.lost_tools.map((item) => (
                            <div key={item.tool_id} className="text-sm">
                              <span className="font-medium">{item.tool_name}</span>
                              <span className="text-gray-500"> ({item.serial_number})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!pendingActions?.overdue_returns?.length && 
                      !pendingActions?.maintenance_needed?.length && 
                      !pendingActions?.broken_tools?.length &&
                      !pendingActions?.lost_tools?.length) && (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No pending actions</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OperationalDashboard;
