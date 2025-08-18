import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../contexts/RBACContext';
import { toolApi, userApi } from '../services/api';
import Navbar from '../components/Navbar';
import ToolsTab from '../components/ToolsTab';
import CategoriesTab from '../components/CategoriesTab';
// StatusTypesTab removed - status types are system-managed only
import ToolboxesTab from '../components/ToolboxesTab';
import TransactionsTab from '../components/TransactionsTab';
import MaintenanceTab from '../components/MaintenanceTab';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Package,
  Tag,
  Settings,
  Calendar,
  Hash,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

interface Tool {
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

interface ToolCategory {
  CategoryID: number;
  Name: string;
  Description?: string;
}

interface ToolStatusType {
  StatusTypeID: number;
  Name: string;
  Description?: string;
}

interface Toolbox {
  ToolboxID: number;
  Name: string;
  Description?: string;
  EmployeeID?: number;
}

interface Employee {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  IsActive: boolean;
  CreatedAt: string;
}

interface UserWithEmployee {
  UserID: number;
  Username: string;
  IsActive: boolean;
  CreatedAt: string;
  employee?: Employee;
}

type TabType = 'tools' | 'categories' | 'toolboxes' | 'transactions' | 'maintenance';

const ToolManagement: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const [activeTab, setActiveTab] = useState<TabType>('tools');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [statusTypes, setStatusTypes] = useState<ToolStatusType[]>([]);
  const [toolboxes, setToolboxes] = useState<Toolbox[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | number>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');

  // Modal states
  const [showToolModal, setShowToolModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  // Status modal removed - system-managed only
  const [showToolboxModal, setShowToolboxModal] = useState(false);

  // Form states
  const [toolForm, setToolForm] = useState({
    SerialNumber: '',
    Name: '',
    Description: '',
    PurchaseDate: '',
    CategoryID: undefined as number | undefined,
    CurrentStatus: 1, // Always Available
    ToolboxID: 1, // Always Warehouse
    IsActive: true
  });

  const [categoryForm, setCategoryForm] = useState({
    Name: '',
    Description: ''
  });

  // Status form removed - status types are system-managed only

  const [toolboxForm, setToolboxForm] = useState({
    Name: '',
    Description: '',
    EmployeeID: null as number | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load data individually to better handle errors
      try {
        const toolsResponse = await toolApi.getTools();
        setTools(toolsResponse.data);
      } catch (error: any) {
        console.error('Failed to load tools:', error);
        setTools([]);
      }

      try {
        const categoriesResponse = await toolApi.getToolCategories();
        setCategories(categoriesResponse.data);
      } catch (error: any) {
        console.error('Failed to load categories:', error);
        setCategories([]);
      }

      try {
        const statusTypesResponse = await toolApi.getToolStatusTypes();
        setStatusTypes(statusTypesResponse.data);
      } catch (error: any) {
        console.error('Failed to load status types:', error);
        setStatusTypes([]);
      }

      try {
        const toolboxesResponse = await toolApi.getToolboxes();
        setToolboxes(toolboxesResponse.data);
      } catch (error: any) {
        console.error('Failed to load toolboxes:', error);
        setToolboxes([]);
      }

      try {
        const employeesResponse = await userApi.getEmployees();
        console.log('Employees response:', employeesResponse.data); // Debug log
        // Extract employee data from users
        const employeeData = employeesResponse.data
          .filter((user: UserWithEmployee) => 
            user.employee && 
            user.employee.IsActive && 
            user.employee.FirstName && 
            user.employee.LastName
          )
          .map((user: UserWithEmployee) => user.employee!);
        console.log('Filtered employee data:', employeeData); // Debug log
        setEmployees(employeeData);
      } catch (error: any) {
        console.error('Failed to load employees:', error);
        setEmployees([]);
      }

      try {
        const transactionsResponse = await toolApi.getTransactions();
        setTransactions(transactionsResponse.data);
      } catch (error: any) {
        console.error('Failed to load transactions:', error);
        setTransactions([]);
      }

    } catch (error: any) {
      console.error('General error loading data:', error);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      // Validate date format
      let purchaseDate = undefined;
      if (toolForm.PurchaseDate) {
        // Check if the date is in valid format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(toolForm.PurchaseDate)) {
          setError('Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-01-15)');
          return;
        }
        
        // Validate that it's a real date
        const date = new Date(toolForm.PurchaseDate);
        if (isNaN(date.getTime())) {
          setError('Invalid date. Please enter a valid date.');
          return;
        }
        
        purchaseDate = date.toISOString();
      }

      const toolData = {
        ...toolForm,
        PurchaseDate: purchaseDate,
        CategoryID: toolForm.CategoryID || undefined,
        ToolboxID: toolForm.ToolboxID || undefined
      };

      await toolApi.createTool(toolData);
      setSuccess('Tool created successfully!');
      setShowToolModal(false);
      resetToolForm();
      loadData();
    } catch (error: any) {
      setError('Failed to create tool: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      await toolApi.createToolCategory(categoryForm);
      setSuccess('Category created successfully!');
      setShowCategoryModal(false);
      resetCategoryForm();
      loadData();
    } catch (error: any) {
      setError('Failed to create category: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Status type creation removed - system-managed only

  const handleCreateToolbox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const toolboxData = {
        ...toolboxForm,
        EmployeeID: toolboxForm.EmployeeID || null
      };

      await toolApi.createToolbox(toolboxData);
      setSuccess('Toolbox created successfully!');
      setShowToolboxModal(false);
      resetToolboxForm();
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message;
      
      // Handle specific duplicate employee assignment error
      if (errorMessage.includes('Duplicate entry') && errorMessage.includes('ux_toolbox_employee')) {
        const employeeName = employees.find(emp => emp.EmployeeID === toolboxForm.EmployeeID);
        const displayName = employeeName ? `${employeeName.FirstName} ${employeeName.LastName}` : 'this employee';
        setError(`Cannot create toolbox: ${displayName} already has a toolbox assigned. Each employee can only have one toolbox at a time.`);
      } else {
        setError('Failed to create toolbox: ' + errorMessage);
      }
    }
  };

  const handleToggleToolStatus = async (toolId: number, currentStatus: boolean) => {
    // Show confirmation dialog for deactivation
    if (currentStatus) {
      const confirmed = window.confirm(
        'Are you sure you want to deactivate this tool?\n\n' +
        'This will:\n' +
        '• Move the tool to the warehouse\n' +
        '• Set its status to "Retired"\n' +
        '• Make it unavailable for checkout'
      );
      
      if (!confirmed) {
        return; // User cancelled
      }
    }

    try {
      setError('');
      setSuccess('');

      await toolApi.toggleToolActivation(toolId);
      setSuccess(`Tool ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      loadData();
    } catch (error: any) {
      setError('Failed to update tool status: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Delete tool function removed - use activate/deactivate toggle instead

  // Edit handlers
  const handleUpdateCategory = async (categoryId: number, data: any) => {
    try {
      setError('');
      setSuccess('');

      await toolApi.updateToolCategory(categoryId, data);
      setSuccess('Category updated successfully!');
      loadData();
    } catch (error: any) {
      setError('Failed to update category: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Status type update removed - system-managed only

  const handleUpdateToolbox = async (toolboxId: number, data: any) => {
    try {
      setError('');
      setSuccess('');

      await toolApi.updateToolbox(toolboxId, data);
      setSuccess('Toolbox updated successfully!');
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message;
      
      // Handle specific duplicate employee assignment error
      if (errorMessage.includes('Duplicate entry') && errorMessage.includes('ux_toolbox_employee')) {
        const employeeName = employees.find(emp => emp.EmployeeID === data.EmployeeID);
        const displayName = employeeName ? `${employeeName.FirstName} ${employeeName.LastName}` : 'this employee';
        setError(`Cannot assign toolbox: ${displayName} already has a toolbox assigned. Each employee can only have one toolbox at a time.`);
      } else {
        setError('Failed to update toolbox: ' + errorMessage);
      }
    }
  };

  const handleToolTransaction = async (transactionData: any) => {
    try {
      setError('');
      setSuccess('');

      // Determine the transaction type and call the appropriate API
      if (transactionData.ToEmployeeID) {
        // Checkout transaction
        await toolApi.checkoutTool(transactionData);
      } else if (transactionData.FromEmployeeID !== undefined) {
        // Checkin transaction (includes null for orphaned toolboxes)
        await toolApi.checkinTool(transactionData);
      } else if (transactionData.ToToolboxID && transactionData.FromToolboxID !== transactionData.ToToolboxID) {
        // Transfer transaction
        await toolApi.transferTool(transactionData);
      } else if (transactionData._transactionType === 'maintenance') {
        // Maintenance transaction (explicit type indicator)
        await toolApi.sendToolForMaintenance(transactionData);
      } else if (transactionData._transactionType === 'retire') {
        // Retire transaction (explicit type indicator)
        await toolApi.retireTool(transactionData);
      } else {
        // General transaction
        await toolApi.createTransaction(transactionData);
      }

      setSuccess('Tool transaction completed successfully!');
      loadData(); // Refresh the data to show updated tool status
    } catch (error: any) {
      setError('Failed to complete transaction: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetToolForm = () => {
    setToolForm({
      SerialNumber: '',
      Name: '',
      Description: '',
      PurchaseDate: '',
      CategoryID: undefined,
      CurrentStatus: 1, // Always Available
      ToolboxID: 1, // Always Warehouse
      IsActive: true
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      Name: '',
      Description: ''
    });
  };

  // Status form reset removed - system-managed only

  const resetToolboxForm = () => {
    setToolboxForm({
      Name: '',
      Description: '',
      EmployeeID: null
    });
  };

  // Filter tools based on search and filters
  const filteredTools = tools.filter(tool => {
    const matchesSearch = 
      tool.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.SerialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.category?.Name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && tool.IsActive) ||
      (statusFilter === 'inactive' && !tool.IsActive) ||
      (typeof statusFilter === 'number' && tool.CurrentStatus === statusFilter);
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      tool.CategoryID === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Check if user has permission to view tools
  if (!hasPermission('view_tools') && !hasPermission('view_categories') && !hasPermission('view_toolboxes')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Wrench className="h-16 w-16 text-red-500 mx-auto mb-4" />
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
              <Wrench className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Tool Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
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



        {/* Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'tools', name: 'Tools', icon: Wrench, count: tools.length, permission: 'view_tools' },
                { id: 'categories', name: 'Categories', icon: Tag, count: categories.length, permission: 'view_categories' },
                // Status Types tab removed - system-managed only
                { id: 'toolboxes', name: 'Toolboxes', icon: Package, count: toolboxes.length, permission: 'view_toolboxes' },
                { id: 'transactions', name: 'Transactions', icon: ArrowRight, count: transactions.length, permission: 'view_transactions' },
                { id: 'maintenance', name: 'Maintenance', icon: AlertTriangle, count: tools.filter(t => t.CurrentStatus === 3 && t.IsActive).length, permission: 'view_tools' }
              ].filter(tab => hasPermission(tab.permission)).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'tools' && (
          <ToolsTab 
            tools={filteredTools}
            categories={categories}
            statusTypes={statusTypes}
            toolboxes={toolboxes}
            employees={employees}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            showModal={showToolModal}
            setShowModal={setShowToolModal}
            form={toolForm}
            setForm={setToolForm}
            onSubmit={handleCreateTool}
            onToggleStatus={handleToggleToolStatus}
            onTransaction={handleToolTransaction}
            resetForm={resetToolForm}
          />
        )}

                 {activeTab === 'categories' && (
           <CategoriesTab 
             categories={categories}
             showModal={showCategoryModal}
             setShowModal={setShowCategoryModal}
             form={categoryForm}
             setForm={setCategoryForm}
             onSubmit={handleCreateCategory}
             onUpdate={handleUpdateCategory}
             resetForm={resetCategoryForm}
           />
         )}

         {/* Status Types tab removed - system-managed only */}

                   {activeTab === 'toolboxes' && (
            <ToolboxesTab 
              toolboxes={toolboxes}
              employees={employees}
              showModal={showToolboxModal}
              setShowModal={setShowToolboxModal}
              form={toolboxForm}
              setForm={setToolboxForm}
              onSubmit={handleCreateToolbox}
              onUpdate={handleUpdateToolbox}
              resetForm={resetToolboxForm}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab transactions={transactions} />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceTab 
              onSuccess={setSuccess}
              onError={setError}
            />
          )}
      </main>
    </div>
  );
};

export default ToolManagement;
