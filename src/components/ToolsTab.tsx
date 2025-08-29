import React, { useState, useEffect } from 'react';
import { useRBAC } from '../contexts/RBACContext';
import {
  Wrench,
  Plus,
  Search,
  Eye,
  EyeOff,
  Package,
  Tag,
  Calendar,
  Hash,
  ArrowRight,
  Settings,
  AlertTriangle,
  AlertCircle,
  Image as ImageIcon,
  X,
  XCircle
} from 'lucide-react';
import ToolTransactionModal from './ToolTransactionModal';
import { getApiUrl, toolApi } from '../services/api';

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

interface ToolsTabProps {
  tools: Tool[];
  categories: ToolCategory[];
  statusTypes: ToolStatusType[];
  toolboxes: Toolbox[];
  employees: Employee[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'active' | 'inactive' | number;
  setStatusFilter: (filter: 'all' | 'active' | 'inactive' | number) => void;
  categoryFilter: number | 'all';
  setCategoryFilter: (filter: number | 'all') => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleStatus: (toolId: number, currentStatus: boolean) => void;
  onTransaction: (transactionData: any) => Promise<void>;
  onUpdate?: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  resetForm: () => void;
}

const ToolsTab: React.FC<ToolsTabProps> = ({
  tools,
  categories,
  statusTypes,
  toolboxes,
  employees,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  showModal,
  setShowModal,
  form,
  setForm,
  onSubmit,
  onToggleStatus,
  onTransaction,
  onUpdate,
  onSuccess,
  onError,
  resetForm
}) => {
  const { hasPermission, isAdmin, isWarehouseManager } = useRBAC();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const apiUrl = getApiUrl();

  // Helper function to check if user can manage tool transactions
  const canManageToolTransactions = () => {
    return isAdmin() || isWarehouseManager() || hasPermission('create_transactions');
  };
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeTool, setStatusChangeTool] = useState<Tool | null>(null);
  const [newStatusId, setNewStatusId] = useState<number>(0);
  const [statusChangeComments, setStatusChangeComments] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [showToolDetailsModal, setShowToolDetailsModal] = useState(false);
  const [toolDetailsData, setToolDetailsData] = useState<Tool | null>(null);
  const [toolLatestImage, setToolLatestImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Edit tool states
  const [isEditingTool, setIsEditingTool] = useState(false);
  const [editToolForm, setEditToolForm] = useState({
    SerialNumber: '',
    Name: '',
    Description: '',
    PurchaseDate: '',
    CategoryID: undefined as number | undefined
  });
  const [editError, setEditError] = useState('');

  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true; // Empty date is valid (optional field)

    // Check format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      setDateError('Invalid date format. Please use YYYY-MM-DD format.');
      return false;
    }

    // Check if it's a real date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      setDateError('Invalid date. Please enter a valid date.');
      return false;
    }

    // Check if it's not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (date > today) {
      setDateError('Purchase date cannot be in the future.');
      return false;
    }

    // Check if it's not too far in the past (before 1900)
    const minDate = new Date('1900-01-01');
    if (date < minDate) {
      setDateError('Purchase date cannot be before 1900.');
      return false;
    }

    setDateError(null);
    return true;
  };

  const handleTransactionClick = (tool: Tool) => {
    setSelectedTool(tool);
    setShowTransactionModal(true);
    // Clear any existing messages when opening transaction modal
    onSuccess('');
    onError('');
  };

  const handleToolDetailsClick = async (tool: Tool) => {
    setToolDetailsData(tool);
    setShowToolDetailsModal(true);
    setToolLatestImage(null);
    setImageLoading(true);

    // Fetch latest image for the tool
    try {
      const response = await toolApi.getToolLatestImage(tool.ToolID);
      setToolLatestImage(response.data.ImageURL);
    } catch (error) {
      // No image found or error - this is fine, just don't show an image
      setToolLatestImage(null);
    } finally {
      setImageLoading(false);
    }
  };

  const handleTransaction = async (transactionData: any) => {
    await onTransaction(transactionData);
  };

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
    setSelectedTool(null);
  };

  const handleStatusChangeClick = (tool: Tool) => {
    setStatusChangeTool(tool);
    setNewStatusId(0);
    setStatusChangeComments('');
    setShowStatusChangeModal(true);
    // Clear any existing messages when opening status change modal
    onSuccess('');
    onError('');
  };

  const handleStatusChange = async () => {
    if (!statusChangeTool || !newStatusId) return;

    try {
      // Import toolApi dynamically or add it to props
      const { toolApi } = await import('../services/api');

      await toolApi.changeToolStatus(statusChangeTool.ToolID, {
        new_status_id: newStatusId,
        comments: statusChangeComments
      });

      // Close modal and refresh data
      setShowStatusChangeModal(false);
      setStatusChangeTool(null);
      setNewStatusId(0);
      setStatusChangeComments('');

      // The parent component should refresh the tools list
      window.location.reload(); // Simple refresh for now
    } catch (error: any) {
      console.error('Failed to change tool status:', error);
      onError('Failed to change tool status: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCloseStatusChangeModal = () => {
    setShowStatusChangeModal(false);
    setStatusChangeTool(null);
    setNewStatusId(0);
    setStatusChangeComments('');
  };

  const handleEditToolClick = () => {
    if (!toolDetailsData) return;

    setEditToolForm({
      SerialNumber: toolDetailsData.SerialNumber,
      Name: toolDetailsData.Name,
      Description: toolDetailsData.Description || '',
      PurchaseDate: toolDetailsData.PurchaseDate ? new Date(toolDetailsData.PurchaseDate).toISOString().split('T')[0] : '',
      CategoryID: toolDetailsData.CategoryID || undefined
    });
    setEditError('');
    setIsEditingTool(true);
  };

  const handleCancelEdit = () => {
    setIsEditingTool(false);
    setEditError('');
    setEditToolForm({
      SerialNumber: '',
      Name: '',
      Description: '',
      PurchaseDate: '',
      CategoryID: undefined
    });
  };

  const handleSaveEdit = async () => {
    if (!toolDetailsData) return;

    try {
      setDateError(null);
      setEditError('');

      // Validate date if provided
      if (editToolForm.PurchaseDate && !validateDate(editToolForm.PurchaseDate)) {
        return; // validateDate already sets the appropriate error message
      }

      // Prepare update data - only include changed fields
      const updateData: any = {};

      if (editToolForm.SerialNumber !== toolDetailsData.SerialNumber) {
        updateData.SerialNumber = editToolForm.SerialNumber;
      }
      if (editToolForm.Name !== toolDetailsData.Name) {
        updateData.Name = editToolForm.Name;
      }
      if (editToolForm.Description !== (toolDetailsData.Description || '')) {
        updateData.Description = editToolForm.Description || null;
      }
      if (editToolForm.PurchaseDate !== (toolDetailsData.PurchaseDate ? new Date(toolDetailsData.PurchaseDate).toISOString().split('T')[0] : '')) {
        updateData.PurchaseDate = editToolForm.PurchaseDate ? new Date(editToolForm.PurchaseDate).toISOString() : null;
      }
      if (editToolForm.CategoryID !== (toolDetailsData.CategoryID || undefined)) {
        updateData.CategoryID = editToolForm.CategoryID || null;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        await toolApi.updateTool(toolDetailsData.ToolID, updateData);

        // Try to refresh the tool data, but don't fail if it doesn't work
        try {
          const updatedTool = await toolApi.getTool(toolDetailsData.ToolID);
          setToolDetailsData(updatedTool.data);
        } catch (refreshError) {
          console.warn('Failed to refresh tool data after update:', refreshError);
          // Continue anyway - the update was successful
        }

        // Refresh the tools list by calling parent's onUpdate if available
        if (onUpdate) {
          onUpdate();
        }

        setIsEditingTool(false);
        onSuccess('Tool updated successfully!');
      } else {
        // No changes were made
        setIsEditingTool(false);
        onSuccess('No changes were made.');
      }

    } catch (error: any) {
      console.error('Failed to update tool:', error);
      setEditError('Failed to update tool: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Clear date error when form is reset
  useEffect(() => {
    if (!showModal) {
      setDateError(null);
    }
  }, [showModal]);

  return (
    <div>
      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Tools
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name, serial, description, category, or toolbox..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all' || value === 'active' || value === 'inactive') {
                    setStatusFilter(value);
                  } else {
                    setStatusFilter(parseInt(value));
                  }
                }}
                className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <optgroup label="Activity Status">
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </optgroup>
                <optgroup label="Tool Status">
                  {statusTypes.map(status => (
                    <option key={status.StatusTypeID} value={status.StatusTypeID}>
                      {status.Name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Filter
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.CategoryID} value={category.CategoryID}>
                    {category.Name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              {hasPermission('create_tools') && (
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tools Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toolbox
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tools.map((tool) => (
                <tr key={tool.ToolID} className={`hover:bg-gray-50 ${!tool.IsActive ? 'bg-gray-100 opacity-75' : ''
                  }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Wrench className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleToolDetailsClick(tool)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900 text-left"
                            title="Click to view tool details and latest image"
                          >
                            {tool.Name}
                          </button>
                          {!tool.IsActive && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Hash className="h-3 w-3 mr-1" />
                          {tool.SerialNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {tool.Description || 'No description'}
                    </div>
                    {tool.PurchaseDate && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(tool.PurchaseDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {tool.category?.Name || 'Uncategorized'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tool.status?.Name === 'Available'
                          ? 'bg-green-100 text-green-800'
                          : tool.status?.Name === 'In Use'
                            ? 'bg-yellow-100 text-yellow-800'
                            : tool.status?.Name === 'Maintenance'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                        {tool.status?.Name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {tool.toolbox?.Name || 'No toolbox'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {canManageToolTransactions() && (
                        <button
                          onClick={() => tool.IsActive ? handleTransactionClick(tool) : null}
                          className={`${tool.IsActive
                              ? "text-blue-600 hover:text-blue-900"
                              : "text-gray-400 cursor-not-allowed"
                            }`}
                          disabled={!tool.IsActive}
                          title={(() => {
                            if (!tool.IsActive) {
                              return "Tool is inactive - activate to enable transactions";
                            }

                            if (!canManageToolTransactions()) {
                              return "Admin or Warehouse Manager access required for tool transactions";
                            }

                            const isInWarehouse = tool.ToolboxID === 1 || !tool.ToolboxID;
                            const isInUse = tool.status?.Name === 'In Use';
                            const isInMaintenance = tool.status?.Name === 'Maintenance';
                            const isLost = tool.status?.Name === 'Lost';
                            const isBroken = tool.status?.Name === 'Broken';

                            if (isLost) {
                              return "Check In Tool (When Found) - Admin/Warehouse Manager Only";
                            } else if (isBroken) {
                              return "Send for Maintenance or Retire (Broken) - Admin/Warehouse Manager Only";
                            } else if (isInWarehouse && !isInUse && !isInMaintenance) {
                              return "Check Out Tool - Admin/Warehouse Manager Only";
                            } else if (!isInWarehouse && isInUse && !isInMaintenance) {
                              return "Check In Tool - Admin/Warehouse Manager Only";
                            } else if (!isInWarehouse && !isInMaintenance) {
                              return "Transfer Tool - Admin/Warehouse Manager Only";
                            } else if (!isInMaintenance && !isInUse) {
                              return "Send for Maintenance - Admin/Warehouse Manager Only";
                            } else if (isInUse) {
                              return "Check In First (In Use) - Admin/Warehouse Manager Only";
                            } else {
                              return "Manage Tool - Admin/Warehouse Manager Only";
                            }
                          })()}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission('update_tools') && (
                        <button
                          onClick={() => onToggleStatus(tool.ToolID, tool.IsActive)}
                          className={tool.IsActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                          title={tool.IsActive ? "Deactivate Tool" : "Activate Tool"}
                        >
                          {tool.IsActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                      {hasPermission('update_tools') && tool.IsActive && (
                        <button
                          onClick={() => handleStatusChangeClick(tool)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Change Status (Mark as Broken/Lost)"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      )}
                      {/* Delete button removed - use activate/deactivate toggle instead */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tool Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Tool</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setDateError(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (dateError) {
                  return; // Prevent submission if there's a date error
                }
                onSubmit(e);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <input
                    type="text"
                    required
                    value={form.SerialNumber}
                    onChange={(e) => setForm({ ...form, SerialNumber: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={form.Name}
                    onChange={(e) => setForm({ ...form, Name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={form.Description}
                    onChange={(e) => setForm({ ...form, Description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                  <input
                    type="date"
                    value={form.PurchaseDate}
                    onChange={(e) => {
                      setForm({ ...form, PurchaseDate: e.target.value });
                      validateDate(e.target.value);
                    }}
                    onBlur={(e) => validateDate(e.target.value)}
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    className={`mt-1 block w-full rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${dateError ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="YYYY-MM-DD"
                  />
                  {dateError ? (
                    <p className="mt-1 text-sm text-red-600">{dateError}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      Format: YYYY-MM-DD (e.g., 2024-01-15)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={form.CategoryID || ''}
                    onChange={(e) => setForm({ ...form, CategoryID: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.CategoryID} value={category.CategoryID}>
                        {category.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                    Available
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    New tools are automatically set to Available status
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Toolbox</label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                    Warehouse
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    New tools are automatically placed in the warehouse
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.IsActive}
                    onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setDateError(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!dateError}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${dateError
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'text-white bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    Create Tool
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <ToolTransactionModal
        isOpen={showTransactionModal}
        onClose={handleCloseTransactionModal}
        tool={selectedTool}
        employees={employees}
        toolboxes={toolboxes}
        statusTypes={statusTypes}
        transactionTypes={[]} // We'll get this from the API if needed
        onTransaction={handleTransaction}
      />

      {/* Status Change Modal */}
      {showStatusChangeModal && statusChangeTool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Change Tool Status
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Change the status of <strong>{statusChangeTool.Name}</strong> (Serial: {statusChangeTool.SerialNumber})
                  </p>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">
                      New Status
                    </label>
                    <select
                      value={newStatusId}
                      onChange={(e) => setNewStatusId(parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      required
                    >
                      <option value={0}>Select Status</option>
                      {statusTypes
                        .filter(status => {
                          // Lost tools can only be found (checked in), not changed to broken
                          if (statusChangeTool?.status?.Name === 'Lost') {
                            return false; // No status changes allowed for lost tools
                          }
                          return ['Broken', 'Lost'].includes(status.Name);
                        })
                        .map(status => (
                          <option key={status.StatusTypeID} value={status.StatusTypeID}>
                            {status.Name}
                          </option>
                        ))}
                    </select>
                    <div className="mt-2 text-xs text-gray-600">
                      {statusChangeTool?.status?.Name === 'Lost' ? (
                        <p className="text-red-600 mt-1">
                          <strong>Lost tools cannot be changed to other statuses.</strong>
                          Use "Check In" transaction when the tool is found.
                        </p>
                      ) : (
                        <>
                          <p><strong>Broken:</strong> Tool will be moved to warehouse for repair</p>
                          <p><strong>Lost:</strong> Tool remains with employee for accountability</p>
                          {statusChangeTool?.status?.Name === 'In Use' && (
                            <p className="text-blue-600 mt-1"><strong>Note:</strong> Tool can be marked Lost/Broken while in use</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">
                      Comments
                    </label>
                    <textarea
                      value={statusChangeComments}
                      onChange={(e) => setStatusChangeComments(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      placeholder="Describe what happened to the tool..."
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    onClick={handleStatusChange}
                    disabled={!newStatusId}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change Status
                  </button>
                  <button
                    onClick={handleCloseStatusChangeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      {isEditingTool ? 'Edit Tool Information' : 'Basic Information'}
                    </h4>

                    {isEditingTool ? (
                      /* Edit Form */
                      <div className="mt-2 space-y-4">
                        {/* Edit Error Alert */}
                        {editError && (
                          <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                              <AlertCircle className="h-5 w-5 text-red-400" />
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{editError}</h3>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tool Name</label>
                          <input
                            type="text"
                            value={editToolForm.Name}
                            onChange={(e) => setEditToolForm({ ...editToolForm, Name: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                          <input
                            type="text"
                            value={editToolForm.SerialNumber}
                            onChange={(e) => setEditToolForm({ ...editToolForm, SerialNumber: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Category</label>
                          <select
                            value={editToolForm.CategoryID || ''}
                            onChange={(e) => setEditToolForm({ ...editToolForm, CategoryID: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">No Category</option>
                            {categories.map(category => (
                              <option key={category.CategoryID} value={category.CategoryID}>
                                {category.Name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                          <input
                            type="date"
                            value={editToolForm.PurchaseDate}
                            onChange={(e) => setEditToolForm({ ...editToolForm, PurchaseDate: e.target.value })}
                            min="1900-01-01"
                            max={new Date().toISOString().split('T')[0]}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          {dateError && (
                            <p className="mt-1 text-sm text-red-600">{dateError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea
                            value={editToolForm.Description}
                            onChange={(e) => setEditToolForm({ ...editToolForm, Description: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Optional description..."
                          />
                        </div>

                        {/* Read-only fields during edit */}
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Read-only information:</p>
                          <div className="space-y-1">
                            <div>
                              <span className="text-xs font-medium text-gray-600">Status:</span>
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
                              <span className="text-xs font-medium text-gray-600">Location:</span>
                              <span className="ml-2 text-xs text-gray-500">
                                {toolDetailsData.toolbox ? toolDetailsData.toolbox.Name : 'Warehouse'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
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
                            {toolDetailsData.toolbox ? toolDetailsData.toolbox.Name : 'Warehouse'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">Category:</span>
                          <span className="ml-2 text-sm text-gray-700">
                            {toolDetailsData.category ? toolDetailsData.category.Name : 'Uncategorized'}
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
                        {toolDetailsData.Description && (
                          <div>
                            <span className="text-sm font-medium text-gray-900">Description:</span>
                            <p className="mt-1 text-sm text-gray-700">{toolDetailsData.Description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Latest Image */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Latest Image
                    </h4>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {imageLoading ? (
                        <div className="flex items-center justify-center h-48">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : toolLatestImage ? (
                        <div className="space-y-2">
                          <img
                            src={`${apiUrl}${toolLatestImage}`}
                            alt={`Latest image of ${toolDetailsData.Name}`}
                            className="max-w-full h-auto max-h-48 mx-auto rounded-lg shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden text-sm text-red-600">
                            Failed to load image
                          </div>

                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                          <ImageIcon className="h-12 w-12 mb-2" />
                          <p className="text-sm">No images available</p>
                          <p className="text-xs">Images are added when transactions are performed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowToolDetailsModal(false);
                    setIsEditingTool(false);
                    setEditError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {hasPermission('update_tools') && toolDetailsData.IsActive && !isEditingTool && (
                  <button
                    onClick={handleEditToolClick}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Settings className="h-4 w-4 mr-1 inline" />
                    Edit Tool
                  </button>
                )}
                {canManageToolTransactions() && toolDetailsData.IsActive && !isEditingTool && (
                  <button
                    onClick={() => {
                      setShowToolDetailsModal(false);
                      handleTransactionClick(toolDetailsData);
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    title="Manage tool transactions (Admin/Warehouse Manager only)"
                  >
                    Create Transaction
                  </button>
                )}
                {isEditingTool && (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsTab;
