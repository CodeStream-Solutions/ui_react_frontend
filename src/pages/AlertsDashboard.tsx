import React, { useState, useEffect } from 'react';
import { useRBAC } from '../contexts/RBACContext';
import { 
  AlertTriangle, 
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  Shield,
  RefreshCw,
  Bell,
  Filter,
  Eye
} from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';

// Interfaces
interface Alert {
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  color: string;
}

interface AlertsData {
  alerts: Alert[];
  total_alerts: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
}

interface AlertDetails {
  category: string;
  total_count: number;
  tools?: any[];
  categories?: any[];
  actions: Array<{
    type: string;
    label: string;
    icon: string;
  }>;
  [key: string]: any;
}

const AlertsDashboard: React.FC = () => {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Data states
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [alertDetails, setAlertDetails] = useState<AlertDetails | null>(null);
  
  const fetchAlertsData = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      // Wait for RBAC to finish loading before checking permissions
      if (rbacLoading) {
        return;
      }
      
      if (!hasPermission('view_dashboard')) {
        setError('You do not have permission to view the dashboard');
        return;
      }

      // Fetch alerts data
      const alertsResponse = await api.get('/api/dashboard/alerts/critical');
      setAlertsData(alertsResponse.data);
      
    } catch (err: any) {
      setError(`Error: ${err.response?.data?.detail || err.message || 'Failed to fetch alerts data'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAlertDetails = async (category: string) => {
    try {
      setDetailsLoading(true);
      const response = await api.get(`/api/dashboard/alerts/details/${category}`);
      setAlertDetails(response.data);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(`Error fetching details: ${err.response?.data?.detail || err.message || 'Failed to fetch alert details'}`);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
    
    // Auto-refresh every 60 seconds for alerts
    const interval = setInterval(fetchAlertsData, 60000);
    return () => clearInterval(interval);
  }, [rbacLoading]); // Re-run when RBAC loading changes

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertBgColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-50 border-red-200';
      case 'orange': return 'bg-orange-50 border-orange-200';
      case 'yellow': return 'bg-yellow-50 border-yellow-200';
      case 'blue': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getAlertTextColor = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-800';
      case 'orange': return 'text-orange-800';
      case 'yellow': return 'text-yellow-800';
      case 'blue': return 'text-blue-800';
      default: return 'text-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAlerts = alertsData?.alerts.filter(alert => {
    if (selectedFilter === 'all') return true;
    return alert.type === selectedFilter;
  }) || [];

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
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alerts & Compliance Dashboard</h1>
                <p className="text-sm text-gray-500">Risk management and compliance monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Alerts</option>
                <option value="critical">Critical Only</option>
                <option value="warning">Warnings Only</option>
                <option value="info">Info Only</option>
              </select>
              <button
                onClick={fetchAlertsData}
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
          
          {/* Alert Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Alerts */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Bell className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Alerts</dt>
                      <dd className="text-2xl font-bold text-gray-900">{alertsData?.total_alerts || 0}</dd>
                      <dd className="text-sm text-gray-600">Active issues</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Critical</dt>
                      <dd className="text-2xl font-bold text-red-900">{alertsData?.critical_count || 0}</dd>
                      <dd className="text-sm text-red-600">Immediate attention</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Alerts */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Warnings</dt>
                      <dd className="text-2xl font-bold text-orange-900">{alertsData?.warning_count || 0}</dd>
                      <dd className="text-sm text-orange-600">Monitor closely</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Alerts */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Info className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Information</dt>
                      <dd className="text-2xl font-bold text-blue-900">{alertsData?.info_count || 0}</dd>
                      <dd className="text-sm text-blue-600">For awareness</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                Active Alerts
                {selectedFilter !== 'all' && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({selectedFilter} only)
                  </span>
                )}
              </h3>
            </div>
            <div className="p-6">
              {filteredAlerts.length > 0 ? (
                <div className="space-y-4">
                  {filteredAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getAlertBgColor(alert.color)}`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className={`text-sm font-medium ${getAlertTextColor(alert.color)}`}>
                                {alert.category.replace('_', ' ').toUpperCase()}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(alert.priority)}`}>
                                {alert.priority} priority
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold ${getAlertTextColor(alert.color)}`}>
                                {alert.count}
                              </span>
                            </div>
                          </div>
                          <p className={`mt-1 text-sm ${getAlertTextColor(alert.color)}`}>
                            {alert.message}
                          </p>
                          
                          {/* View Details button only */}
                          <div className="mt-3">
                            <button 
                              onClick={() => fetchAlertDetails(alert.category)}
                              disabled={detailsLoading}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  {selectedFilter === 'all' ? (
                    <>
                      <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                      <p className="text-sm text-gray-500">No active alerts at this time.</p>
                    </>
                  ) : (
                    <>
                      <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No {selectedFilter} alerts</h3>
                      <p className="text-sm text-gray-500">Try changing the filter to see other alert types.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Compliance Summary */}
          {alertsData && alertsData.total_alerts === 0 && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <h3 className="text-lg font-medium text-green-900">System Compliance Status: GOOD</h3>
                  <p className="text-sm text-green-700 mt-1">
                    All tools are accounted for and operating within normal parameters. 
                    No immediate action required.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <div className="text-sm font-medium text-green-900">Tool Accountability</div>
                  <div className="text-xs text-green-700">✓ All tools tracked and accounted for</div>
                </div>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <div className="text-sm font-medium text-green-900">Maintenance Schedule</div>
                  <div className="text-xs text-green-700">✓ All maintenance up to date</div>
                </div>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <div className="text-sm font-medium text-green-900">Return Compliance</div>
                  <div className="text-xs text-green-700">✓ No overdue returns</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Alert Details Modal */}
      {showDetailModal && alertDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {alertDetails.category} - Detailed View
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Total Items</div>
                  <div className="text-2xl font-bold text-gray-900">{alertDetails.total_count}</div>
                </div>
                {alertDetails.average_days_overdue && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-orange-500">Avg Days Overdue</div>
                    <div className="text-2xl font-bold text-orange-900">{Math.round(alertDetails.average_days_overdue)}</div>
                  </div>
                )}
                {alertDetails.average_days_deployed && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-yellow-500">Avg Days Deployed</div>
                    <div className="text-2xl font-bold text-yellow-900">{Math.round(alertDetails.average_days_deployed)}</div>
                  </div>
                )}
                {alertDetails.total_recommended_purchases && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-500">Recommended Purchases</div>
                    <div className="text-2xl font-bold text-blue-900">{alertDetails.total_recommended_purchases}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Recommended Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {alertDetails.actions.map((action, index) => (
                    <button
                      key={index}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <span className="mr-2">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed List */}
              <div className="max-h-96 overflow-y-auto">
                {alertDetails.tools && alertDetails.tools.length > 0 && (
                  <>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Tool Details</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {alertDetails.tools.map((tool, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {tool.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {tool.serial_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {tool.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  tool.urgency === 'High' ? 'bg-red-100 text-red-800' :
                                  tool.priority === 'High' ? 'bg-red-100 text-red-800' :
                                  tool.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  tool.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {tool.urgency || tool.priority || 'Normal'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {tool.days_lost !== undefined && <div>Days Lost: {tool.days_lost}</div>}
                                {tool.date_lost && <div>Date: {new Date(tool.date_lost).toLocaleDateString()}</div>}
                                {tool.last_person && <div>Last Person: {tool.last_person}</div>}
                                {tool.last_toolbox && <div>From: {tool.last_toolbox}</div>}
                                {tool.days_overdue && <div>{tool.days_overdue} days overdue</div>}
                                {tool.days_in_maintenance && <div>In maintenance: {tool.days_in_maintenance} days</div>}
                                {tool.moved_by && <div>Moved by: {tool.moved_by}</div>}
                                {tool.maintenance_started && <div>Started: {new Date(tool.maintenance_started).toLocaleDateString()}</div>}
                                {tool.days_deployed && <div>Deployed {tool.days_deployed} days</div>}
                                {tool.deployed_to && <div>To: {tool.deployed_to}</div>}
                                {tool.department && <div>Dept: {tool.department}</div>}
                                {tool.contact_email && <div>Email: {tool.contact_email}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {alertDetails.categories && alertDetails.categories.length > 0 && (
                  <>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Category Details</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {alertDetails.categories.map((category, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {category.category_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {category.available_tools}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {category.total_tools}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  category.availability_rate < 10 ? 'bg-red-100 text-red-800' :
                                  category.availability_rate < 20 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {category.availability_rate}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {category.recent_demand || 0} checkouts (30 days)
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {category.recommended_purchase} tools
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsDashboard;
