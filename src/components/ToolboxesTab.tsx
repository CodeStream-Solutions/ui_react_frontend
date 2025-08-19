import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  XCircle,
  User,
  Search,
  Archive,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useRBAC } from '../contexts/RBACContext';

interface Toolbox {
  ToolboxID: number;
  Name: string;
  Description?: string;
  EmployeeID?: number;
  IsActive: boolean;
  IsRetired: boolean;
  RetiredAt?: string;
  RetiredBy?: number;
  CreatedAt?: string;
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

interface ToolboxesTabProps {
  toolboxes: Toolbox[];
  employees: Employee[];
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onUpdate: (toolboxId: number, data: any) => Promise<void>;
  onSoftDelete: (toolboxId: number) => Promise<void>;
  onRetire: (toolboxId: number) => Promise<void>;
  onReactivate: (toolboxId: number) => Promise<void>;
  resetForm: () => void;
}

const ToolboxesTab: React.FC<ToolboxesTabProps> = ({
  toolboxes,
  employees,
  showModal,
  setShowModal,
  form,
  setForm,
  onSubmit,
  onUpdate,
  onSoftDelete,
  onRetire,
  onReactivate,
  resetForm
}) => {
  const { hasPermission } = useRBAC();
  const [editingToolbox, setEditingToolbox] = useState<Toolbox | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ Name: '', Description: '', EmployeeID: null as number | null });
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [editEmployeeSearch, setEditEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showEditEmployeeDropdown, setShowEditEmployeeDropdown] = useState(false);
  const [toolboxSearch, setToolboxSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [toolboxToDelete, setToolboxToDelete] = useState<Toolbox | null>(null);
  const [toolboxToRetire, setToolboxToRetire] = useState<Toolbox | null>(null);
  const [retireError, setRetireError] = useState<string>('');

  const handleEditClick = (toolbox: Toolbox) => {
    setEditingToolbox(toolbox);
    setEditForm({ 
      Name: toolbox.Name, 
      Description: toolbox.Description || '', 
      EmployeeID: toolbox.EmployeeID || null 
    });
    // Set the search field to show the current employee name
    if (toolbox.EmployeeID) {
      const employee = employees.find(emp => emp.EmployeeID === toolbox.EmployeeID);
      setEditEmployeeSearch(employee ? `${employee.FirstName} ${employee.LastName}` : '');
    } else {
      setEditEmployeeSearch('');
    }
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingToolbox) {
      await onUpdate(editingToolbox.ToolboxID, editForm);
      setShowEditModal(false);
      setEditingToolbox(null);
      setEditForm({ Name: '', Description: '', EmployeeID: null });
      setEditEmployeeSearch('');
    }
  };

  const getEmployeeName = (employeeId?: number) => {
    if (!employeeId) return 'Unassigned';
    const employee = employees.find(emp => emp.EmployeeID === employeeId);
    if (!employee) {
      console.warn(`Employee with ID ${employeeId} not found in employees list:`, employees);
      return 'Unknown Employee';
    }
    return `${employee.FirstName} ${employee.LastName}`;
  };

  const filteredEmployees = employees.filter(employee => {
    const searchTerm = employeeSearch.toLowerCase().trim();
    if (!searchTerm) return true;
    
    const fullName = `${employee.FirstName} ${employee.LastName}`.toLowerCase();
    const email = employee.Email.toLowerCase();
    const firstName = employee.FirstName.toLowerCase();
    const lastName = employee.LastName.toLowerCase();
    
    return fullName.includes(searchTerm) || 
           email.includes(searchTerm) || 
           firstName.includes(searchTerm) || 
           lastName.includes(searchTerm);
  });

  const filteredEditEmployees = employees.filter(employee => {
    const searchTerm = editEmployeeSearch.toLowerCase().trim();
    if (!searchTerm) return true;
    
    const fullName = `${employee.FirstName} ${employee.LastName}`.toLowerCase();
    const email = employee.Email.toLowerCase();
    const firstName = employee.FirstName.toLowerCase();
    const lastName = employee.LastName.toLowerCase();
    
    return fullName.includes(searchTerm) || 
           email.includes(searchTerm) || 
           firstName.includes(searchTerm) || 
           lastName.includes(searchTerm);
  });

  const filteredToolboxes = toolboxes.filter(toolbox => {
    const searchTerm = toolboxSearch.toLowerCase().trim();
    if (!searchTerm) return true;
    
    const toolboxName = toolbox.Name.toLowerCase();
    const toolboxDescription = (toolbox.Description || '').toLowerCase();
    
    // Get owner name for search
    let ownerName = '';
    if (toolbox.EmployeeID) {
      const employee = employees.find(emp => emp.EmployeeID === toolbox.EmployeeID);
      if (employee) {
        ownerName = `${employee.FirstName} ${employee.LastName}`.toLowerCase();
      }
    }
    
    return toolboxName.includes(searchTerm) || 
           toolboxDescription.includes(searchTerm) || 
           ownerName.includes(searchTerm);
  });

  const handleEmployeeSelect = (employee: Employee, isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm({...editForm, EmployeeID: employee.EmployeeID});
      setEditEmployeeSearch(`${employee.FirstName} ${employee.LastName}`);
      setShowEditEmployeeDropdown(false);
    } else {
      setForm({...form, EmployeeID: employee.EmployeeID});
      setEmployeeSearch(`${employee.FirstName} ${employee.LastName}`);
      setShowEmployeeDropdown(false);
    }
  };

  const handleEmployeeClear = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm({...editForm, EmployeeID: null});
      setEditEmployeeSearch('');
    } else {
      setForm({...form, EmployeeID: null});
      setEmployeeSearch('');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEmployeeSearch('');
    setShowEmployeeDropdown(false);
    resetForm();
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingToolbox(null);
    setEditForm({ Name: '', Description: '', EmployeeID: null });
    setEditEmployeeSearch('');
    setShowEditEmployeeDropdown(false);
  };

  // Soft delete handlers
  const handleSoftDeleteClick = (toolbox: Toolbox) => {
    setToolboxToDelete(toolbox);
    setShowDeleteModal(true);
  };

  const handleSoftDeleteConfirm = async () => {
    if (toolboxToDelete) {
      await onSoftDelete(toolboxToDelete.ToolboxID);
      setShowDeleteModal(false);
      setToolboxToDelete(null);
    }
  };

  // Retire handlers
  const handleRetireClick = (toolbox: Toolbox) => {
    setToolboxToRetire(toolbox);
    setRetireError(''); // Clear any previous errors
    setShowRetireModal(true);
  };

  const handleRetireConfirm = async () => {
    if (toolboxToRetire) {
      try {
        setRetireError(''); // Clear any previous errors
        await onRetire(toolboxToRetire.ToolboxID);
        setShowRetireModal(false);
        setToolboxToRetire(null);
      } catch (error: any) {
        // Extract the detailed error message from the backend
        const errorMessage = error.response?.data?.detail || error.message;
        setRetireError(errorMessage);
        // Don't close the modal so user can see the error and tool list
      }
    }
  };

  // Reactivate handler
  const handleReactivate = async (toolbox: Toolbox) => {
    await onReactivate(toolbox.ToolboxID);
  };

  // Get toolbox status display
  const getToolboxStatus = (toolbox: Toolbox) => {
    if (toolbox.IsRetired === true) return { text: 'Retired', color: 'bg-gray-100 text-gray-800' };
    if (toolbox.IsActive === false) return { text: 'Inactive', color: 'bg-red-100 text-red-800' };
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Toolboxes
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage toolboxes for organizing and storing tools
              </p>
            </div>
            {hasPermission('create_toolboxes') && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Toolbox
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Toolboxes
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={toolboxSearch}
                onChange={(e) => setToolboxSearch(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by toolbox name or owner..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toolboxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredToolboxes.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {toolboxSearch ? 'No toolboxes found' : 'No toolboxes yet'}
            </h3>
            <p className="text-gray-500">
              {toolboxSearch 
                ? 'Try adjusting your search terms or clear the search to see all toolboxes.'
                : 'Get started by creating your first toolbox.'
              }
            </p>
          </div>
        ) : (
          filteredToolboxes.map((toolbox) => (
          <div key={toolbox.ToolboxID} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {toolbox.Name}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getToolboxStatus(toolbox).color}`}>
                      {getToolboxStatus(toolbox).text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {toolbox.Description || 'No description'}
                  </p>
                  <div className="text-sm text-gray-400 flex items-center mt-1">
                    <User className="h-3 w-3 mr-1" />
                    {getEmployeeName(toolbox.EmployeeID)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Edit Button - Available for active toolboxes */}
                {hasPermission('update_toolboxes') && toolbox.IsActive && !toolbox.IsRetired && (
                  <button
                    onClick={() => handleEditClick(toolbox)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit Toolbox"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}

                {/* Action buttons based on toolbox status */}
                {hasPermission('delete_toolboxes') && (
                  <>
                    {toolbox.IsRetired ? (
                      /* Retired toolboxes - no actions available */
                      <span className="text-gray-400 text-xs">No actions available</span>
                    ) : !toolbox.IsActive ? (
                      /* Inactive toolboxes - can be reactivated */
                      <button
                        onClick={() => handleReactivate(toolbox)}
                        className="text-green-600 hover:text-green-900"
                        title="Reactivate Toolbox"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      /* Active toolboxes - can be soft deleted or retired */
                      <>
                        <button
                          onClick={() => handleSoftDeleteClick(toolbox)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Deactivate Toolbox"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRetireClick(toolbox)}
                          className="text-red-600 hover:text-red-900"
                          title="Retire Toolbox"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Create Toolbox Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Toolbox</h3>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={form.Name}
                    onChange={(e) => setForm({...form, Name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Main Toolbox, Electrical Tools, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={form.Description}
                    onChange={(e) => setForm({...form, Description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Describe the purpose or contents of this toolbox..."
                  />
                </div>
                
                                                 <div>
                  <label className="block text-sm font-medium text-gray-700">Assign to Employee (Optional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setShowEmployeeDropdown(true);
                      }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
                      className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {showEmployeeDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setForm({...form, EmployeeID: null});
                            setEmployeeSearch('');
                            setShowEmployeeDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-200"
                        >
                          <div className="font-medium text-gray-600">🚫 No employee assignment</div>
                          <div className="text-sm text-gray-500">Leave toolbox unassigned</div>
                        </button>
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee) => (
                            <button
                              key={employee.EmployeeID}
                              type="button"
                              onClick={() => handleEmployeeSelect(employee)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              <div className="font-medium">{employee.FirstName} {employee.LastName}</div>
                              <div className="text-sm text-gray-500">{employee.Email}</div>
                            </button>
                          ))
                        ) : employeeSearch && !employeeSearch.includes('No employee') ? (
                          <div className="px-4 py-2 text-gray-500">No employees found</div>
                        ) : !employeeSearch ? (
                          <div className="px-4 py-2 text-gray-500">Start typing to search employees</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {form.EmployeeID && (
                    <div className="mt-2 text-sm text-gray-600 flex items-center">
                      <span>Selected: {getEmployeeName(form.EmployeeID)}</span>
                      <button
                        type="button"
                        onClick={() => handleEmployeeClear()}
                        className="ml-2 text-red-600 hover:text-red-900"
                        title="Clear Employee"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Toolbox
                  </button>
                </div>
              </form>
            </div>
          </div>
                 </div>
       )}

       {/* Edit Toolbox Modal */}
       {showEditModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium text-gray-900">Edit Toolbox</h3>
                 <button
                   onClick={handleEditModalClose}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <XCircle className="h-6 w-6" />
                 </button>
               </div>
               
               <form onSubmit={handleEditSubmit} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Name</label>
                   <input
                     type="text"
                     required
                     value={editForm.Name}
                     onChange={(e) => setEditForm({...editForm, Name: e.target.value})}
                     className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     placeholder="e.g., Main Toolbox, Electrical Tools, etc."
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Description</label>
                   <textarea
                     value={editForm.Description}
                     onChange={(e) => setEditForm({...editForm, Description: e.target.value})}
                     rows={3}
                     className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     placeholder="Describe the purpose or contents of this toolbox..."
                   />
                 </div>
                 
                                                    <div>
                   <label className="block text-sm font-medium text-gray-700">Assign to Employee (Optional)</label>
                   <div className="relative">
                     <input
                       type="text"
                       placeholder="Search employees..."
                       value={editEmployeeSearch}
                       onChange={(e) => {
                         setEditEmployeeSearch(e.target.value);
                         setShowEditEmployeeDropdown(true);
                       }}
                       onFocus={() => setShowEditEmployeeDropdown(true)}
                       onBlur={() => setTimeout(() => setShowEditEmployeeDropdown(false), 200)}
                       className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     />
                     {showEditEmployeeDropdown && (
                       <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                         <button
                           type="button"
                           onClick={() => {
                             setEditForm({...editForm, EmployeeID: null});
                             setEditEmployeeSearch('');
                             setShowEditEmployeeDropdown(false);
                           }}
                           className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-200"
                         >
                           <div className="font-medium text-gray-600">🚫 Unassign from employee</div>
                           <div className="text-sm text-gray-500">Remove employee assignment</div>
                         </button>
                         {filteredEditEmployees.length > 0 ? (
                            filteredEditEmployees.map((employee) => (
                              <button
                                key={employee.EmployeeID}
                                type="button"
                                onClick={() => handleEmployeeSelect(employee, true)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                <div className="font-medium">{employee.FirstName} {employee.LastName}</div>
                                <div className="text-sm text-gray-500">{employee.Email}</div>
                              </button>
                            ))
                          ) : editEmployeeSearch && !editEmployeeSearch.includes('Unassign') ? (
                            <div className="px-4 py-2 text-gray-500">No employees found</div>
                          ) : !editEmployeeSearch ? (
                            <div className="px-4 py-2 text-gray-500">Start typing to search employees</div>
                          ) : null}
                       </div>
                     )}
                   </div>
                   {editForm.EmployeeID && (
                     <div className="mt-2 text-sm text-gray-600 flex items-center">
                       <span>Selected: {getEmployeeName(editForm.EmployeeID)}</span>
                       <button
                         type="button"
                         onClick={() => handleEmployeeClear(true)}
                         className="ml-2 text-red-600 hover:text-red-900"
                         title="Clear Employee"
                       >
                         <XCircle className="h-4 w-4" />
                       </button>
                     </div>
                   )}
                 </div>
                 
                 <div className="flex justify-end space-x-3">
                   <button
                     type="button"
                     onClick={handleEditModalClose}
                     className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                   >
                     Update Toolbox
                   </button>
                 </div>
               </form>
             </div>
           </div>
                 </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {showDeleteModal && toolboxToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                  <Trash2 className="h-6 w-6 text-orange-600" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                  Deactivate Toolbox
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-3">
                    Are you sure you want to deactivate the toolbox <strong>"{toolboxToDelete.Name}"</strong>?
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3 text-left">
                        <h4 className="text-sm font-medium text-yellow-800">
                          What happens when you deactivate:
                        </h4>
                        <div className="mt-1 text-sm text-yellow-700">
                          <p>• The toolbox will be unassigned from its current employee</p>
                          <p>• It will show as "Inactive" but remain visible</p>
                          <p>• It can be reactivated later if needed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  onClick={handleSoftDeleteConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:col-start-2 sm:text-sm"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retire Confirmation Modal */}
      {showRetireModal && toolboxToRetire && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Archive className="h-6 w-6 text-red-600" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                  Retire Toolbox
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-3">
                    Are you sure you want to retire the toolbox <strong>"{toolboxToRetire.Name}"</strong>?
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div className="ml-3 text-left">
                        <h4 className="text-sm font-medium text-red-800">
                          Important: Permanent Action
                        </h4>
                        <div className="mt-1 text-sm text-red-700">
                          <p>
                            • All active tools must be moved to the warehouse first
                          </p>
                          <p>
                            • The toolbox will be unassigned from its employee
                          </p>
                          <p>
                            • This action cannot be undone
                          </p>
                          <p>
                            • The toolbox will be hidden from the system permanently
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error display for retirement validation */}
                  {retireError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div className="ml-3 text-left">
                          <h4 className="text-sm font-medium text-red-800">
                            Cannot Retire Toolbox
                          </h4>
                          <div className="mt-1 text-sm text-red-700">
                            <pre className="whitespace-pre-wrap font-sans">{retireError}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  onClick={handleRetireConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                >
                  Retire Toolbox
                </button>
                <button
                  onClick={() => {
                    setShowRetireModal(false);
                    setRetireError(''); // Clear error when closing modal
                    setToolboxToRetire(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolboxesTab;
