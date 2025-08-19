import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../contexts/RBACContext';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Users,
  Activity,
  RefreshCw,
  AlertTriangle,
  Clock,
  Package,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import api from '../services/api';
import Navbar from '../components/Navbar';

// Interfaces
interface UtilizationData {
  analysis_period_days: number;
  most_used_tools: ToolUsage[];
  least_used_tools: ToolUsage[];
  employee_activity: EmployeeActivity[];
}

interface ToolUsage {
  tool_name: string;
  serial_number: string;
  transaction_count: number;
  last_used?: string;
}

interface EmployeeActivity {
  employee_name: string;
  transaction_count: number;
  unique_tools_used: number;
}

const PerformanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission, loading: rbacLoading } = useRBAC();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  
  // Data states
  const [utilizationData, setUtilizationData] = useState<UtilizationData | null>(null);
  
  const fetchPerformanceData = async () => {
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

      // Fetch performance analytics
      const utilizationResponse = await api.get(`/api/dashboard/performance/utilization?days=${selectedPeriod}`);
      setUtilizationData(utilizationResponse.data);
      
    } catch (err: any) {
      setError(`Error: ${err.response?.data?.detail || err.message || 'Failed to fetch performance data'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod, rbacLoading]); // Re-run when RBAC loading changes

  const formatChartData = () => {
    if (!utilizationData) return { toolUsageData: [], employeeData: [] };

    // Tool usage chart data
    const toolUsageData = utilizationData.most_used_tools.map((tool, index) => ({
      name: tool.tool_name,
      usage: tool.transaction_count,
      efficiency: Math.round((tool.transaction_count / selectedPeriod) * 100) / 100
    }));

    // Employee productivity data
    const employeeData = utilizationData.employee_activity.map(emp => ({
      name: emp.employee_name.split(' ')[0], // First name only for chart
      transactions: emp.transaction_count,
      unique_tools: emp.unique_tools_used,
      productivity_score: Math.round((emp.transaction_count / emp.unique_tools_used) * 10) / 10
    }));

    return { toolUsageData, employeeData };
  };

  const { toolUsageData, employeeData } = formatChartData();

  const calculateKPIs = () => {
    if (!utilizationData) return { totalTransactions: 0, avgToolsPerEmployee: 0, utilizationTrend: 0, topPerformerGain: 0, topPerformerName: '' };

    // Use backend performance metrics if available
    const performanceMetrics = (utilizationData as any).performance_metrics;
    const totalTransactions = performanceMetrics?.total_transactions || 
      utilizationData.employee_activity.reduce((sum, emp) => sum + emp.transaction_count, 0);
    
    // Use backend calculation for average tools per employee (tools assigned via toolboxes)
    const avgToolsPerEmployee = performanceMetrics?.avg_tools_per_employee || 0;
    
    // Use real daily average from backend
    const utilizationTrend = performanceMetrics?.avg_daily_transactions || 
      Math.round((totalTransactions / selectedPeriod) * 10) / 10;
    
    // Calculate top performer percentage and get their name
    let topPerformerGain = 0;
    let topPerformerName = '';
    
    if (utilizationData.employee_activity.length > 0) {
      const topEmployee = utilizationData.employee_activity[0];
      topPerformerGain = Math.round(((topEmployee?.transaction_count || 0) / Math.max(totalTransactions, 1) * 100) * 10) / 10;
      topPerformerName = topEmployee?.employee_name || 'Unknown';
    } else if (totalTransactions > 0) {
      topPerformerGain = 100;
      topPerformerName = 'System User';
    }

    return { totalTransactions, avgToolsPerEmployee, utilizationTrend, topPerformerGain, topPerformerName };
  };

  const { totalTransactions, avgToolsPerEmployee, utilizationTrend, topPerformerGain, topPerformerName } = calculateKPIs();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

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
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
                <p className="text-sm text-gray-500">Analytics and optimization insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={fetchPerformanceData}
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
          
          {/* Performance KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Transactions */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                      <dd className="text-2xl font-bold text-gray-900">{totalTransactions}</dd>
                      <dd className="text-sm text-blue-600">Last {selectedPeriod} days</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Avg Tools per Employee */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Tools/Employee</dt>
                      <dd className="text-2xl font-bold text-gray-900">{avgToolsPerEmployee}</dd>
                      <dd className="text-sm text-green-600">Tools assigned</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Utilization Trend */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Daily Avg</dt>
                      <dd className="text-2xl font-bold text-gray-900">{utilizationTrend}</dd>
                      <dd className="text-sm text-blue-600">transactions/day</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performer Share */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Top Performer</dt>
                      <dd className="text-2xl font-bold text-gray-900">{topPerformerGain}%</dd>
                      <dd className="text-sm text-purple-600">{topPerformerName}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Tool Usage Chart */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  Most Used Tools
                </h3>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={toolUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Employee Productivity */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  Employee Activity
                </h3>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={employeeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="transactions" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Most Used Tools List */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  Top Performers
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {utilizationData?.most_used_tools.slice(0, 5).map((tool, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{tool.tool_name}</p>
                        <p className="text-sm text-gray-500">{tool.serial_number}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{tool.transaction_count}</span>
                        <p className="text-xs text-gray-500">transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Least Used Tools (Optimization Opportunities) */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <TrendingDown className="h-5 w-5 text-yellow-600 mr-2" />
                  Optimization Opportunities
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {utilizationData?.least_used_tools.slice(0, 5).map((tool, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{tool.tool_name}</p>
                        <p className="text-sm text-gray-500">{tool.serial_number}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-yellow-600">{tool.transaction_count}</span>
                        <p className="text-xs text-gray-500">transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
                {utilizationData?.least_used_tools && utilizationData.least_used_tools.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                    <p className="text-xs text-yellow-800">
                      💡 Consider redistributing or repurposing underutilized tools
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PerformanceDashboard;
