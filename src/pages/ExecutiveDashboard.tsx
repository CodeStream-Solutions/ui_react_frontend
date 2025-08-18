import React, { useState, useEffect } from 'react';
import { useRBAC } from '../contexts/RBACContext';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Target,
  Award,
  Briefcase,
  Activity,
  CheckCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import api from '../services/api';
import Navbar from '../components/Navbar';

// Interfaces
interface BusinessMetrics {
  total_asset_count: number;
  utilization_rate: number;
  loss_rate: number;
  employee_engagement: number;
  active_employees: number;
  total_employees: number;
}

interface CategoryDistribution {
  category: string;
  total: number;
  in_use: number;
  maintenance: number;
  utilization: number;
}

interface TransactionTrend {
  week: string;
  transaction_count: number;
}

interface ExecutiveSummary {
  business_metrics: BusinessMetrics;
  category_distribution: CategoryDistribution[];
  transaction_trends: TransactionTrend[];
}

interface InvestmentRecommendation {
  category: string;
  total_tools: number;
  available: number;
  in_demand: number;
  availability_ratio: number;
  recommendation: string;
}

interface MaintenanceAnalysis {
  tool_name: string;
  serial_number: string;
  category: string;
  maintenance_count: number;
  last_maintenance?: string;
  recommendation: string;
}

interface GrowthTrends {
  current_month_transactions: number;
  last_month_transactions: number;
  growth_rate: number;
  trend: string;
}

interface StrategicInsights {
  investment_planning: InvestmentRecommendation[];
  maintenance_cost_analysis: MaintenanceAnalysis[];
  growth_trends: GrowthTrends;
}

const ExecutiveDashboard: React.FC = () => {
  const { hasPermission } = useRBAC();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [strategicInsights, setStrategicInsights] = useState<StrategicInsights | null>(null);
  
  const fetchExecutiveData = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      if (!hasPermission('view_dashboard')) {
        setError('You do not have permission to view the dashboard');
        return;
      }

      // Fetch executive data
      const [summaryResponse, insightsResponse] = await Promise.all([
        api.get('/api/dashboard/executive/summary'),
        api.get('/api/dashboard/executive/strategic-insights')
      ]);
      
      setExecutiveSummary(summaryResponse.data);
      setStrategicInsights(insightsResponse.data);
      
    } catch (err: any) {
      setError(`Error: ${err.response?.data?.detail || err.message || 'Failed to fetch executive data'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  const formatChartData = () => {
    if (!executiveSummary) return { categoryData: [], trendData: [], utilizationData: [] };

    // Category distribution for pie chart
    const categoryData = executiveSummary.category_distribution.map((cat, index) => ({
      name: cat.category,
      value: cat.total,
      utilization: cat.utilization,
      fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'][index % 7]
    }));

    // Transaction trends for line chart
    const trendData = executiveSummary.transaction_trends.map(trend => ({
      week: new Date(trend.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      transactions: trend.transaction_count
    }));

    // Utilization by category for bar chart
    const utilizationData = executiveSummary.category_distribution.map(cat => ({
      category: cat.category.length > 10 ? cat.category.substring(0, 10) + '...' : cat.category,
      utilization: cat.utilization,
      in_use: cat.in_use,
      total: cat.total
    }));

    return { categoryData, trendData, utilizationData };
  };

  const { categoryData, trendData, utilizationData } = formatChartData();

  const getTrendIcon = (trend: string, rate: number) => {
    if (trend === 'Growing' || rate > 0) {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else if (trend === 'Declining' || rate < 0) {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    } else {
      return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string, rate: number) => {
    if (trend === 'Growing' || rate > 0) {
      return 'text-green-600';
    } else if (trend === 'Declining' || rate < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
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
              <Briefcase className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
                <p className="text-sm text-gray-500">Strategic insights and business intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchExecutiveData}
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
          
          {/* Business Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Assets */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Assets</dt>
                      <dd className="text-2xl font-bold text-gray-900">{executiveSummary?.business_metrics.total_asset_count || 0}</dd>
                      <dd className="text-sm text-blue-600">Active tools</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Utilization Rate */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Utilization Rate</dt>
                      <dd className="text-2xl font-bold text-gray-900">{executiveSummary?.business_metrics.utilization_rate || 0}%</dd>
                      <dd className="text-sm text-green-600">Tools in active use</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Loss Rate */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Loss Rate</dt>
                      <dd className="text-2xl font-bold text-gray-900">{executiveSummary?.business_metrics.loss_rate || 0}%</dd>
                      <dd className="text-sm text-red-600">Last 90 days</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Engagement */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Engagement</dt>
                      <dd className="text-2xl font-bold text-gray-900">{executiveSummary?.business_metrics.employee_engagement || 0}%</dd>
                      <dd className="text-sm text-purple-600">{executiveSummary?.business_metrics.active_employees || 0}/{executiveSummary?.business_metrics.total_employees || 0} employees</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Asset Distribution */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  Asset Distribution by Category
                </h3>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} tools`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transaction Trends */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  Transaction Trends (12 Weeks)
                </h3>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="transactions" 
                      stroke="#10b981" 
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Utilization by Category */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Target className="h-5 w-5 text-purple-600 mr-2" />
                Utilization by Category
              </h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" fontSize={12} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'utilization' ? `${value}%` : value,
                    name === 'utilization' ? 'Utilization Rate' : name === 'in_use' ? 'In Use' : 'Total'
                  ]} />
                  <Bar dataKey="utilization" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategic Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Investment Planning */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  Investment Recommendations
                </h3>
              </div>
              <div className="p-6">
                {strategicInsights?.investment_planning && strategicInsights.investment_planning.length > 0 ? (
                  <div className="space-y-4">
                    {strategicInsights.investment_planning.map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{rec.category}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rec.availability_ratio < 20 ? 'bg-red-100 text-red-800' :
                            rec.availability_ratio < 30 ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {rec.availability_ratio}% available
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Available: {rec.available} | In Demand: {rec.in_demand} | Total: {rec.total_tools}
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          💡 {rec.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">All categories well-stocked</p>
                  </div>
                )}
              </div>
            </div>

            {/* Maintenance Cost Analysis */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                  High Maintenance Tools
                </h3>
              </div>
              <div className="p-6">
                {strategicInsights?.maintenance_cost_analysis && strategicInsights.maintenance_cost_analysis.length > 0 ? (
                  <div className="space-y-4">
                    {strategicInsights.maintenance_cost_analysis.slice(0, 5).map((tool, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{tool.tool_name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tool.maintenance_count >= 5 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {tool.maintenance_count} repairs
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {tool.serial_number} • {tool.category}
                        </div>
                        <div className={`text-sm font-medium ${
                          tool.recommendation === 'Consider replacement' ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          ⚠️ {tool.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No high-maintenance tools</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Growth Trends Summary */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Award className="h-5 w-5 text-blue-600 mr-2" />
                Business Growth Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Month */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {strategicInsights?.growth_trends.current_month_transactions || 0}
                  </div>
                  <div className="text-sm text-gray-500">Current Month Transactions</div>
                </div>
                
                {/* Last Month */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {strategicInsights?.growth_trends.last_month_transactions || 0}
                  </div>
                  <div className="text-sm text-gray-500">Last Month Transactions</div>
                </div>
                
                {/* Growth Rate */}
                <div className="text-center">
                  <div className={`text-2xl font-bold flex items-center justify-center ${getTrendColor(
                    strategicInsights?.growth_trends.trend || 'Stable',
                    strategicInsights?.growth_trends.growth_rate || 0
                  )}`}>
                    {getTrendIcon(
                      strategicInsights?.growth_trends.trend || 'Stable',
                      strategicInsights?.growth_trends.growth_rate || 0
                    )}
                    <span className="ml-2">
                      {strategicInsights?.growth_trends.growth_rate || 0}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {strategicInsights?.growth_trends.trend || 'Stable'} Trend
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

export default ExecutiveDashboard;
