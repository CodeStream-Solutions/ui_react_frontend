import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  XCircle,
  User
} from 'lucide-react';
import { useRBAC } from '../contexts/RBACContext';

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

interface ToolboxesTabProps {
  toolboxes: Toolbox[];
  employees: Employee[];
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onUpdate: (toolboxId: number, data: any) => Promise<void>;
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

  const handleEditClick = (toolbox: Toolbox) => {
    setEditingToolbox(toolbox);
    setEditForm({ 
      Name: toolbox.Name, 
      Description: toolbox.Description || '', 
      EmployeeID: toolbox.EmployeeID 
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
  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center">
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
        </div>
      </div>

      {/* Toolboxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolboxes.map((toolbox) => (
          <div key={toolbox.ToolboxID} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    {toolbox.Name}
                  </h4>
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
                 {hasPermission('update_toolboxes') && (
                   <button
                     onClick={() => handleEditClick(toolbox)}
                     className="text-blue-600 hover:text-blue-900"
                     title="Edit Toolbox"
                   >
                     <Edit className="h-4 w-4" />
                   </button>
                 )}
                 {hasPermission('delete_toolboxes') && (
                   <button
                     className="text-red-600 hover:text-red-900"
                     title="Delete Toolbox"
                   >
                     <Trash2 className="h-4 w-4" />
                   </button>
                 )}
               </div>
            </div>
          </div>
        ))}
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
     </div>
   );
 };

export default ToolboxesTab;
