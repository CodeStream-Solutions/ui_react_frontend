import React, { useState, useEffect, useRef } from 'react';
import {
  XCircle,
  ArrowRight,
  User,
  Wrench,
  AlertCircle,
  CheckCircle,
  Archive,
  Image as ImageIcon,
  X,
  FolderOpen
} from 'lucide-react';
import { uiApiUrl, toolApi } from '../services/api';

interface Tool {
  ToolID: number;
  SerialNumber: string;
  Name: string;
  Description?: string;
  CurrentStatus: number;
  ToolboxID?: number;
  status?: {
    StatusTypeID: number;
    Name: string;
  };
  toolbox?: {
    ToolboxID: number;
    Name: string;
  };
}

interface Employee {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
  Email: string;
}

interface Toolbox {
  ToolboxID: number;
  Name: string;
  Description?: string;
  EmployeeID?: number;
}

interface ToolStatusType {
  StatusTypeID: number;
  Name: string;
  Description?: string;
}

interface TransactionType {
  TypeID: number;
  Name: string;
}

interface ToolTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool | null;
  employees: Employee[];
  toolboxes: Toolbox[];
  statusTypes: ToolStatusType[];
  transactionTypes: TransactionType[];
  onTransaction: (transactionData: any) => Promise<void>;
}

type TransactionMode = 'checkout' | 'checkin' | 'transfer' | 'maintenance' | 'other' | 'retire';

const ToolTransactionModal: React.FC<ToolTransactionModalProps> = ({
  isOpen,
  onClose,
  tool,
  employees,
  toolboxes,
  onTransaction
}) => {
  const [mode, setMode] = useState<TransactionMode>('checkout');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Retire confirmation modal state
  const [showRetireConfirmation, setShowRetireConfirmation] = useState(false);

  // Searchable dropdown states
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [toolboxSearch, setToolboxSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showToolboxDropdown, setShowToolboxDropdown] = useState(false);

  // Refs for click outside detection
  const employeeDropdownRef = useRef<HTMLDivElement>(null);
  const toolboxDropdownRef = useRef<HTMLDivElement>(null);

  // Form states for different transaction types
  const [checkoutForm, setCheckoutForm] = useState({
    ToolID: 0,
    ToEmployeeID: 0,
    ExpectedReturnDate: '',
    Comments: ''
  });

  // Get employees who have toolboxes assigned
  const employeesWithToolboxes = employees.filter(employee =>
    toolboxes.some(toolbox => toolbox.EmployeeID === employee.EmployeeID)
  );

  // Filter employees for searchable dropdown
  const filteredEmployees = employeesWithToolboxes
    .filter(employee => {
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
    })
    .sort((a, b) => `${a.FirstName} ${a.LastName}`.localeCompare(`${b.FirstName} ${b.LastName}`));

  // Filter toolboxes for searchable dropdown
  const filteredToolboxes = toolboxes
    .filter(toolbox => {
      const searchTerm = toolboxSearch.toLowerCase().trim();
      if (!searchTerm) return true;
      
      const name = toolbox.Name.toLowerCase();
      const description = (toolbox.Description || '').toLowerCase();
      
      return name.includes(searchTerm) || description.includes(searchTerm);
    })
    .sort((a, b) => a.Name.localeCompare(b.Name));

  // Helper functions for dropdowns
  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.EmployeeID === employeeId);
    return employee ? `${employee.FirstName} ${employee.LastName}` : 'Unknown Employee';
  };

  const getToolboxName = (toolboxId: number) => {
    const toolbox = toolboxes.find(tb => tb.ToolboxID === toolboxId);
    return toolbox ? toolbox.Name : 'Unknown Toolbox';
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setCheckoutForm({ ...checkoutForm, ToEmployeeID: employee.EmployeeID });
    setEmployeeSearch(`${employee.FirstName} ${employee.LastName}`);
    setShowEmployeeDropdown(false);
  };

  const handleToolboxSelect = (toolbox: Toolbox) => {
    setTransferForm({ ...transferForm, ToToolboxID: toolbox.ToolboxID });
    setToolboxSearch(toolbox.Name);
    setShowToolboxDropdown(false);
  };

  const [checkinForm, setCheckinForm] = useState({
    ToolID: 0,
    FromEmployeeID: 0,
    ToToolboxID: 1 as number, // Default to warehouse (ID: 1)
    ToStatus: 1 as number, // Default to Available (ID: 1)
    Comments: ''
  });

  const [transferForm, setTransferForm] = useState({
    ToolID: 0,
    ToToolboxID: 0,
    Comments: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    ToolID: 0,
    ExpectedReturnDate: '',
    Comments: ''
  });

  const [retireForm, setRetireForm] = useState({
    ToolID: 0,
    Comments: ''
  });

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setShowEmployeeDropdown(false);
      }
      if (toolboxDropdownRef.current && !toolboxDropdownRef.current.contains(event.target as Node)) {
        setShowToolboxDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Image management functions

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setError(''); // Clear previous errors

    try {
      // Create FormData for file upload
      const formData = new FormData();
      const validFiles: File[] = [];

      // Validate files before uploading
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`File ${file.name} is too large (max 5MB)`);
          continue;
        }

        validFiles.push(file);
        formData.append('files', file);
      }

      if (validFiles.length === 0) {
        setUploadingImages(false);
        return;
      }

      // Upload files to server
      const response = await toolApi.uploadFiles(formData);

      if (response.data.uploaded_files && response.data.uploaded_files.length > 0) {
        const newUrls = response.data.uploaded_files.map((file: any) => file.url);
        setImageUrls([...imageUrls, ...newUrls]);

        if (response.data.errors && response.data.errors.length > 0) {
          setError(`Some files had issues: ${response.data.errors.join(', ')}`);
        }
      } else {
        setError('No files were uploaded successfully');
      }

    } catch (error) {
      console.error('File upload error:', error);
      setError('Failed to upload images to server');
    } finally {
      setUploadingImages(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };



  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a fake event to reuse the existing handleFileUpload logic
      const fakeEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;

      handleFileUpload(fakeEvent);
    }
  };

  const canHaveImages = (): boolean => {
    if (!tool) return false;

    // Lost tools cannot have images
    const isLost = tool.status?.Name === 'Lost';
    const willBeLost = mode === 'checkin' && tool.status?.Name === 'Lost'; // Tool is being found

    return !isLost && !willBeLost;
  };

  // Determine available transaction modes based on tool location and status
  const getAvailableModes = (): TransactionMode[] => {
    if (!tool) return [];

    const isInWarehouse = tool.ToolboxID === 1 || !tool.ToolboxID;
    const isInUse = tool.status?.Name === 'In Use';
    const isInMaintenance = tool.status?.Name === 'Maintenance';
    const isLost = tool.status?.Name === 'Lost';
    const isBroken = tool.status?.Name === 'Broken';

    const availableModes: TransactionMode[] = [];

    // Check out: Only available if tool is in warehouse and not in use, not broken, and there are employees with toolboxes
    if (isInWarehouse && !isInUse && !isInMaintenance && !isBroken && employeesWithToolboxes.length > 0) {
      availableModes.push('checkout');
    }

    // Check in: Only available if tool is in a toolbox (not warehouse) and in use, OR if tool is lost (when found)
    if (!isInWarehouse && ((isInUse && !isInMaintenance) || isLost)) {
      availableModes.push('checkin');
    }

    // Transfer: Available for tools in toolboxes (not warehouse), regardless of use status, but not if lost or broken
    if (!isInWarehouse && !isInMaintenance && !isLost && !isBroken) {
      availableModes.push('transfer');
    }

    // Maintenance: Available for tools not in maintenance and not in use (must be checked in first), not lost, OR if broken (broken tools can go to maintenance for repair)
    if (!isInMaintenance && ((!isInUse && !isLost) || isBroken)) {
      availableModes.push('maintenance');
    }

    // Retire: Only available for tools in warehouse and not already retired (broken tools can be retired if beyond repair)
    if (isInWarehouse && tool.status?.Name !== 'Retired') {
      availableModes.push('retire');
    }

    return availableModes;
  };

  // Set initial mode based on available options
  useEffect(() => {
    const availableModes = getAvailableModes();
    if (availableModes.length > 0 && !availableModes.includes(mode)) {
      setMode(availableModes[0]);
    }
  }, [tool]);

  useEffect(() => {
    if (tool) {
      setCheckoutForm(prev => ({ ...prev, ToolID: tool.ToolID }));
      setCheckinForm(prev => ({ ...prev, ToolID: tool.ToolID }));
      setTransferForm(prev => ({ ...prev, ToolID: tool.ToolID }));
      setMaintenanceForm(prev => ({ ...prev, ToolID: tool.ToolID }));
      setRetireForm(prev => ({ ...prev, ToolID: tool.ToolID }));
    }
  }, [tool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Special confirmation for retire action
    if (mode === 'retire') {
      setShowRetireConfirmation(true);
      return; // Don't proceed until user confirms in modal
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let transactionData: any;

      switch (mode) {
        case 'checkout':
          if (!checkoutForm.ToEmployeeID) {
            throw new Error('Please select an employee to check out to');
          }
          // Find the employee's toolbox
          const employeeToolbox = toolboxes.find(toolbox => toolbox.EmployeeID === checkoutForm.ToEmployeeID);
          if (!employeeToolbox) {
            throw new Error('Selected employee does not have a toolbox assigned');
          }
          transactionData = {
            ...checkoutForm,
            FromToolboxID: (tool as any).ToolboxID || 1, // Use tool's current location (1 for warehouse)
            ToToolboxID: employeeToolbox.ToolboxID, // Assign to employee's toolbox
            ToStatus: 2, // Set status to "In Use" (ID: 2)
            ExpectedReturnDate: checkoutForm.ExpectedReturnDate ? new Date(checkoutForm.ExpectedReturnDate).toISOString() : undefined,
            ImageURLs: canHaveImages() ? imageUrls : undefined
          };
          break;

        case 'checkin':
          // Automatically determine the employee based on the toolbox
          let fromEmployeeID = 0;
          let isOrphanedToolbox = false;

          if ((tool as any).toolbox && (tool as any).toolbox.ToolboxID !== 1) {
            const toolboxOwner = toolboxes.find(toolbox =>
              toolbox.ToolboxID === (tool as any).toolbox?.ToolboxID
            );
            if (toolboxOwner && toolboxOwner.EmployeeID) {
              // Check if the employee is active
              const employee = employees.find(emp => emp.EmployeeID === toolboxOwner.EmployeeID);
              if (employee) {
                fromEmployeeID = toolboxOwner.EmployeeID;
              } else {
                // Toolbox is owned by an inactive employee (orphaned)
                isOrphanedToolbox = true;
              }
            } else if (toolboxOwner) {
              // Toolbox exists but has no employee assigned (unassigned)
              isOrphanedToolbox = true;
            }
          }

          // For orphaned toolboxes, we don't set FromEmployeeID (backend will handle it)
          transactionData = {
            ...checkinForm,
            FromEmployeeID: isOrphanedToolbox ? null : fromEmployeeID,
            ToToolboxID: 1, // Always go to warehouse
            ToStatus: 1, // Always set to Available when checking in to warehouse
            Comments: isOrphanedToolbox
              ? `${checkinForm.Comments ? checkinForm.Comments + ' - ' : ''}Recovered from orphaned/unassigned toolbox`.trim()
              : checkinForm.Comments,
            ImageURLs: canHaveImages() ? imageUrls : undefined
          };
          break;

        case 'transfer':
          if (!transferForm.ToToolboxID) {
            throw new Error('Please select a destination toolbox');
          }
          if ((tool as any).ToolboxID === transferForm.ToToolboxID) {
            throw new Error('Cannot transfer to the same location');
          }

          // Check if this is an orphaned toolbox scenario going to warehouse
          const isGoingToWarehouse = transferForm.ToToolboxID === 1;
          let isOrphanedSource = false;

          if ((tool as any).toolbox && (tool as any).toolbox.ToolboxID !== 1) {
            const toolboxRecord = toolboxes.find(toolbox =>
              toolbox.ToolboxID === (tool as any).toolbox?.ToolboxID
            );
            // Check for both orphaned (inactive employee) and unassigned (no employee) toolboxes
            isOrphanedSource = toolboxRecord && ((toolboxRecord.EmployeeID && !employees.find(emp => emp.EmployeeID === toolboxRecord.EmployeeID)) || !toolboxRecord.EmployeeID) || false;
          }

          // If transferring from orphaned toolbox to warehouse, use checkin instead
          if (isOrphanedSource && isGoingToWarehouse) {
            // Convert to checkin transaction
            transactionData = {
              ToolID: transferForm.ToolID,
              FromEmployeeID: null,  // Orphaned toolbox
              ToToolboxID: 1,  // Warehouse
              ToStatus: 1,  // Available
              Comments: transferForm.Comments
                ? `${transferForm.Comments} - Recovered from orphaned/unassigned toolbox`
                : 'Recovered from orphaned/unassigned toolbox',
              ImageURLs: canHaveImages() ? imageUrls : undefined
            };
            // Change the endpoint we'll call
            setMode('checkin');
          } else {
            // Regular transfer validation
            if (tool?.ToolboxID === 1 || transferForm.ToToolboxID === 1) {
              throw new Error('Transfers cannot involve the warehouse. Use Check In/Check Out for warehouse operations.');
            }
            transactionData = {
              ...transferForm,
              FromToolboxID: tool?.ToolboxID || 1,
              ToToolboxID: transferForm.ToToolboxID,
              ImageURLs: canHaveImages() ? imageUrls : undefined
            };
          }
          break;

        case 'maintenance':
          transactionData = {
            ...maintenanceForm,
            FromToolboxID: tool?.ToolboxID || 1, // Use tool's current location
            ToToolboxID: 1, // Always move to warehouse for maintenance
            ExpectedReturnDate: maintenanceForm.ExpectedReturnDate ? new Date(maintenanceForm.ExpectedReturnDate).toISOString() : undefined,
            _transactionType: 'maintenance', // Add explicit type indicator
            ImageURLs: canHaveImages() ? imageUrls : undefined
          };
          break;

        case 'retire' as TransactionMode:
          transactionData = {
            ...retireForm,
            _transactionType: 'retire' // Add explicit type indicator
          };
          break;

        default:
          throw new Error('Invalid transaction type');
      }

      await onTransaction(transactionData);
      const displayMode = transactionData._transactionType || mode;
      setSuccess(`${displayMode.charAt(0).toUpperCase() + displayMode.slice(1)} transaction completed successfully!`);

      // Reset forms
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);

    } catch (error: any) {
      setError(error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetireConfirmation = async () => {
    setShowRetireConfirmation(false);

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const transactionData = {
        ...retireForm,
        _transactionType: 'retire' // Add explicit type indicator
      };

      await onTransaction(transactionData);
      setSuccess('Retire transaction completed successfully!');

      // Reset forms
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);

    } catch (error: any) {
      setError(error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetireCancel = () => {
    setShowRetireConfirmation(false);
  };

  const resetForms = () => {
    setCheckoutForm({
      ToolID: 0,
      ToEmployeeID: 0,
      ExpectedReturnDate: '',
      Comments: ''
    });
    setCheckinForm({
      ToolID: 0,
      FromEmployeeID: 0,
      ToToolboxID: 1, // Default to warehouse
      ToStatus: 1, // Default to Available
      Comments: ''
    });
    setTransferForm({
      ToolID: 0,
      ToToolboxID: 0,
      Comments: ''
    });
    setMaintenanceForm({
      ToolID: 0,
      ExpectedReturnDate: '',
      Comments: ''
    });
    setRetireForm({
      ToolID: 0,
      Comments: ''
    });
    // Reset search states
    setEmployeeSearch('');
    setToolboxSearch('');
    setShowEmployeeDropdown(false);
    setShowToolboxDropdown(false);
    // Reset image data
    setImageUrls([]);
    setUploadingImages(false);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForms();
    setError('');
    setSuccess('');
    setMode('checkout');
    onClose();
  };

  if (!isOpen || !tool) return null;

  const renderForm = () => {
    switch (mode) {
      case 'checkout':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Check out to Employee</label>
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
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                {showEmployeeDropdown && (
                  <div 
                    ref={employeeDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => {
                        const employeeToolbox = toolboxes.find(toolbox => toolbox.EmployeeID === employee.EmployeeID);
                        return (
                          <button
                            key={employee.EmployeeID}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleEmployeeSelect(employee);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="font-medium">{employee.FirstName} {employee.LastName}</div>
                            <div className="text-sm text-gray-500">{employee.Email} • {employeeToolbox?.Name || 'Unknown Toolbox'}</div>
                          </button>
                        );
                      })
                    ) : employeeSearch ? (
                      <div className="px-4 py-2 text-gray-500">No employees found</div>
                    ) : (
                      <div className="px-4 py-2 text-gray-500">Start typing to search employees</div>
                    )}
                  </div>
                )}
              </div>
              {checkoutForm.ToEmployeeID > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {getEmployeeName(checkoutForm.ToEmployeeID)}
                </div>
              )}
              {employeesWithToolboxes.length === 0 && (
                <p className="mt-1 text-sm text-red-500">
                  No employees with toolboxes available for checkout
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Current Location</label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                {tool.toolbox ? tool.toolbox.Name : 'Warehouse'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Return Date</label>
              <input
                type="date"
                value={checkoutForm.ExpectedReturnDate}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, ExpectedReturnDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                max="2030-12-31"
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Comments</label>
              <textarea
                value={checkoutForm.Comments}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, Comments: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Optional comments about this checkout..."
              />
            </div>
          </form>
        );

      case 'checkin':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Location</label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                {tool.toolbox ? tool.toolbox.Name : 'Warehouse'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tool Owner</label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                {(() => {
                  if (!tool.toolbox || tool.toolbox.ToolboxID === 1) {
                    return 'Warehouse (No specific owner)';
                  }

                  // Find the toolbox in our toolboxes list
                  const toolboxRecord = toolboxes.find(toolbox =>
                    toolbox.ToolboxID === tool.toolbox?.ToolboxID
                  );

                  if (toolboxRecord && toolboxRecord.EmployeeID) {
                    // Check if the employee is in our active employees list
                    const employee = employees.find(emp => emp.EmployeeID === toolboxRecord.EmployeeID);
                    if (employee) {
                      return `${employee.FirstName} ${employee.LastName}`;
                    } else {
                      // Employee exists in toolbox but not in active employees list (inactive/orphaned)
                      return '⚠️ Orphaned Toolbox (Inactive Employee)';
                    }
                  } else if (toolboxRecord) {
                    // Toolbox exists but has no employee assigned (unassigned)
                    return '⚠️ Unassigned Toolbox (No Employee)';
                  }

                  return 'Unknown Owner';
                })()}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {(() => {
                  if (!tool.toolbox || tool.toolbox.ToolboxID === 1) {
                    return 'Tool is in the warehouse';
                  }

                  const toolboxRecord = toolboxes.find(toolbox =>
                    toolbox.ToolboxID === tool.toolbox?.ToolboxID
                  );

                  if (toolboxRecord && toolboxRecord.EmployeeID) {
                    const employee = employees.find(emp => emp.EmployeeID === toolboxRecord.EmployeeID);
                    if (employee) {
                      return 'Tool will be automatically checked in from the employee who owns this toolbox';
                    } else {
                      return 'Tool will be recovered from orphaned toolbox and returned to warehouse';
                    }
                  } else if (toolboxRecord) {
                    // Unassigned toolbox
                    return 'Tool will be recovered from unassigned toolbox and returned to warehouse';
                  }

                  return 'Tool will be checked in to the warehouse';
                })()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tool Status</label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                Available
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Tool will be returned to the warehouse as Available
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Comments</label>
              <textarea
                value={checkinForm.Comments}
                onChange={(e) => setCheckinForm({ ...checkinForm, Comments: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Optional comments about this check-in..."
              />
            </div>
          </form>
        );

      case 'transfer':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Location</label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                {tool.toolbox ? tool.toolbox.Name : 'Warehouse'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Transfer to Toolbox</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search toolboxes..."
                  value={toolboxSearch}
                  onChange={(e) => {
                    setToolboxSearch(e.target.value);
                    setShowToolboxDropdown(true);
                  }}
                  onFocus={() => setShowToolboxDropdown(true)}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                {showToolboxDropdown && (
                  <div 
                    ref={toolboxDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {filteredToolboxes
                      .filter(toolbox => toolbox.ToolboxID !== tool.ToolboxID && toolbox.ToolboxID !== 1) // Exclude current location and warehouse
                      .map((toolbox) => {
                        const employee = employees.find(emp => emp.EmployeeID === toolbox.EmployeeID);
                        return (
                          <button
                            key={toolbox.ToolboxID}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleToolboxSelect(toolbox);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="font-medium">{toolbox.Name}</div>
                            <div className="text-sm text-gray-500">
                              {employee ? `${employee.FirstName} ${employee.LastName}` : 'Unassigned'}
                              {toolbox.Description && ` • ${toolbox.Description}`}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
              {transferForm.ToToolboxID > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {getToolboxName(transferForm.ToToolboxID)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Comments</label>
              <textarea
                value={transferForm.Comments}
                onChange={(e) => setTransferForm({ ...transferForm, Comments: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Optional comments about this transfer..."
              />
            </div>
          </form>
        );

      case 'maintenance':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Location</label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                {tool.toolbox ? tool.toolbox.Name : 'Warehouse'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Return from Maintenance</label>
              <input
                type="date"
                value={maintenanceForm.ExpectedReturnDate}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, ExpectedReturnDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                max="2030-12-31"
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Maintenance Details</label>
              <textarea
                value={maintenanceForm.Comments}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, Comments: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Describe the maintenance needed..."
              />
            </div>
          </form>
        );

      case 'retire':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Location</label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 sm:text-sm">
                {tool.toolbox ? tool.toolbox.Name : 'Warehouse'}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> Retiring this tool will permanently remove it from active inventory.
                    This action should only be used for tools that are no longer serviceable or needed.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Retirement Reason</label>
              <textarea
                value={retireForm.Comments}
                onChange={(e) => setRetireForm({ ...retireForm, Comments: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Explain why this tool is being retired (e.g., beyond repair, obsolete, etc.)..."
                required
              />
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tool Transaction</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Tool Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <Wrench className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h4 className="font-medium text-gray-900">{tool.Name}</h4>
                <p className="text-sm text-gray-600">Serial: {tool.SerialNumber}</p>
                <p className="text-sm text-gray-600">
                  Current Status: {tool.status?.Name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  Location: {tool.toolbox ? tool.toolbox.Name : 'Warehouse'}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Type Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-4">
              {[
                { id: 'checkout', name: 'Check Out', icon: User },
                { id: 'checkin', name: 'Check In', icon: User },
                { id: 'transfer', name: 'Transfer', icon: ArrowRight },
                { id: 'maintenance', name: 'Maintenance', icon: Wrench },
                { id: 'retire', name: 'Retire', icon: Archive }
              ].map((tab) => {
                const Icon = tab.icon;
                const availableModes = getAvailableModes();
                const isAvailable = availableModes.includes(tab.id as TransactionMode);

                return (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id as TransactionMode)}
                    disabled={!isAvailable}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${mode === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : isAvailable
                        ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        : 'border-transparent text-gray-300 cursor-not-allowed'
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

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

          {/* Orphaned/Unassigned Toolbox Warning */}
          {tool && tool.toolbox && tool.toolbox.ToolboxID !== 1 && (() => {
            const toolboxRecord = toolboxes.find(toolbox =>
              toolbox.ToolboxID === tool.toolbox?.ToolboxID
            );

            let warningType = null;
            let warningTitle = '';
            let warningMessage = '';

            if (toolboxRecord && toolboxRecord.EmployeeID) {
              // Check if employee is inactive (orphaned)
              const employee = employees.find(emp => emp.EmployeeID === toolboxRecord.EmployeeID);
              if (!employee) {
                warningType = 'orphaned';
                warningTitle = 'Orphaned Toolbox Detected';
                warningMessage = 'This tool is in a toolbox owned by an inactive employee. The system will automatically handle the recovery and return the tool to the warehouse.';
              }
            } else if (toolboxRecord) {
              // Unassigned toolbox
              warningType = 'unassigned';
              warningTitle = 'Unassigned Toolbox Detected';
              warningMessage = 'This tool is in a toolbox that has no employee assigned. The system will automatically handle the recovery and return the tool to the warehouse.';
            }

            return warningType ? (
              <div className="mb-4 rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">{warningTitle}</h3>
                    <p className="mt-1 text-sm text-yellow-700">{warningMessage}</p>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

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

          {/* Form */}
          {renderForm()}

          {/* Image Upload Section */}
          {canHaveImages() && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <ImageIcon className="h-4 w-4 mr-2" />
                Transaction Images (Optional)
              </h4>

              {/* Upload Methods */}
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Upload from Computer</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                    className={`relative cursor-pointer border-2 border-dashed rounded-md p-6 text-center transition-colors ${isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : uploadingImages
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      } ${uploadingImages ? 'cursor-not-allowed' : ''}`}
                  >
                    {uploadingImages ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-sm text-gray-600">Processing images...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FolderOpen className={`h-8 w-8 mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                        <p className={`text-sm font-medium ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>
                          {isDragOver ? 'Drop images here' : 'Click to browse or drag images here'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG, GIF, etc. - Max 5MB each
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>



                {/* Image List */}
                {imageUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">Images to attach ({imageUrls.length}):</p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {imageUrls.map((url, index) => {
                        const isServerUrl = url.startsWith('/api/files/');
                        const isExternalUrl = url.startsWith('http');
                        const displayText = isServerUrl
                          ? `Uploaded file ${index + 1}`
                          : isExternalUrl
                            ? `External image ${index + 1}`
                            : `Image ${index + 1}`;

                        // For server URLs, prepend the base URL
                        // const fullImageUrl = isServerUrl ? `${uiApiUrl}${url}` : url;
                        const fullImageUrl =`${uiApiUrl}${url}`;

                        return (
                          <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                            <div className="flex-shrink-0">
                              <img
                                src={fullImageUrl}
                                alt={`Preview ${index + 1}`}
                                className="h-8 w-8 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <ImageIcon className="h-8 w-8 text-gray-400 hidden" />
                            </div>
                            <span className="text-xs text-gray-700 truncate flex-1">
                              {displayText}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeImageUrl(index)}
                              className="text-red-500 hover:text-red-700 flex-shrink-0"
                              title="Remove image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Upload images or add URLs to document this transaction (before/after photos, condition, etc.)
                </p>
              </div>
            </div>
          )}

          {/* Lost Tool Notice */}
          {!canHaveImages() && tool?.status?.Name === 'Lost' && (
            <div className="mt-6 border-t pt-4">
              <div className="rounded-md bg-yellow-50 p-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Images cannot be attached to transactions involving lost tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Tool`}
            </button>
          </div>
        </div>
      </div>

      {/* Retire Confirmation Modal */}
      {showRetireConfirmation && tool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  ⚠️ PERMANENT ACTION WARNING ⚠️
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you absolutely sure you want to <strong>RETIRE</strong> this tool?
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded-md text-left">
                    <p className="text-sm font-medium text-gray-900">
                      Tool: {tool.Name} ({tool.SerialNumber})
                    </p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium">This action will:</p>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        <li>Mark the tool as "Retired"</li>
                        <li>Remove it from active inventory</li>
                        <li>Deactivate the tool in the system</li>
                        <li>This CANNOT be easily undone</li>
                      </ul>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-red-600 font-medium">
                    Click "Retire Tool" only if you are certain this tool should be permanently retired.
                  </p>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    onClick={handleRetireConfirmation}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Retire Tool'
                    )}
                  </button>
                  <button
                    onClick={handleRetireCancel}
                    disabled={loading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolTransactionModal;
