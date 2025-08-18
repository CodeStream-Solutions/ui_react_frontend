import React, { useState, useEffect } from 'react';
import { useRBAC } from '../contexts/RBACContext';
import { toolApi } from '../services/api';
import { 
  ArrowRight, 
  User, 
  Package, 
  Wrench, 
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface Transaction {
  TransactionID: number;
  ToolID: number;
  TransactionTypeID: number;
  FromToolboxID?: number;
  ToToolboxID?: number;
  FromEmployeeID?: number;
  ToEmployeeID?: number;
  ToStatus: number;
  ExpectedReturnDate?: string;
  Comments?: string;
  PerformedBy: number;
  TransactionDate: string;
  tool?: {
    ToolID: number;
    Name: string;
    SerialNumber: string;
  };
  transaction_type?: {
    TypeID: number;
    Name: string;
  };
  from_toolbox?: {
    ToolboxID: number;
    Name: string;
  };
  to_toolbox?: {
    ToolboxID: number;
    Name: string;
  };
  from_employee?: {
    EmployeeID: number;
    FirstName: string;
    LastName: string;
  };
  to_employee?: {
    EmployeeID: number;
    FirstName: string;
    LastName: string;
  };
  to_status?: {
    StatusTypeID: number;
    Name: string;
  };
}

interface TransactionsTabProps {
  transactions?: Transaction[];
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions = [] }) => {
  const { hasPermission } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [showTransactionDetailsModal, setShowTransactionDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionImages, setTransactionImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  useEffect(() => {
    loadTransactionTypes();
  }, []);



  const loadTransactionTypes = async () => {
    try {
      const response = await toolApi.getTransactionTypes();
      setTransactionTypes(response.data);
    } catch (error: any) {
      console.error('Failed to load transaction types:', error);
    }
  };

  const handleTransactionDetailsClick = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetailsModal(true);
    setTransactionImages([]);
    setImagesLoading(true);

    // Fetch images for the transaction
    try {
      const response = await toolApi.getTransactionImages(transaction.TransactionID);
      setTransactionImages(response.data);
    } catch (error) {
      // No images found or error - this is fine, just don't show images
      setTransactionImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.tool?.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.tool?.SerialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_type?.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.Comments?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      typeFilter === 'all' || 
      transaction.TransactionTypeID === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTransactionIcon = (typeName: string) => {
    switch (typeName) {
      case 'Check Out':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'Check In':
        return <User className="h-4 w-4 text-green-600" />;
      case 'Transfer':
        return <ArrowRight className="h-4 w-4 text-purple-600" />;
      case 'Maintenance':
        return <Wrench className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!hasPermission('view_transactions')) {
    return (
      <div className="text-center py-8">
        <ArrowRight className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view transactions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Transactions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by tool, type, or comments..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                {transactionTypes.map(type => (
                  <option key={type.TypeID} value={type.TypeID}>
                    {type.Name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.TransactionID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.transaction_type?.Name || '')}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.transaction_type?.Name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{transaction.TransactionID}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.tool?.Name || 'Unknown Tool'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.tool?.SerialNumber || 'No Serial'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.from_employee ? (
                        <div>
                          <div>{transaction.from_employee.FirstName} {transaction.from_employee.LastName}</div>
                          <div className="text-xs text-gray-500">Employee</div>
                        </div>
                      ) : transaction.from_toolbox ? (
                        <div>
                          <div>{transaction.from_toolbox.Name}</div>
                          <div className="text-xs text-gray-500">Toolbox</div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Warehouse</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.to_employee ? (
                        <div>
                          <div>{transaction.to_employee.FirstName} {transaction.to_employee.LastName}</div>
                          <div className="text-xs text-gray-500">Employee</div>
                        </div>
                      ) : transaction.to_toolbox ? (
                        <div>
                          <div>{transaction.to_toolbox.Name}</div>
                          <div className="text-xs text-gray-500">Toolbox</div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Warehouse</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(transaction.TransactionDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.TransactionDate).toLocaleTimeString()}
                    </div>
                    {transaction.ExpectedReturnDate && (
                      <div className="text-xs text-blue-600">
                        Due: {new Date(transaction.ExpectedReturnDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.to_status?.Name === 'Available' 
                        ? 'bg-green-100 text-green-800' 
                        : transaction.to_status?.Name === 'In Use'
                        ? 'bg-yellow-100 text-yellow-800'
                        : transaction.to_status?.Name === 'Maintenance'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.to_status?.Name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleTransactionDetailsClick(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View transaction details and images"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <ArrowRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">No transactions match your current filters.</p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showTransactionDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ArrowRight className="h-5 w-5 text-blue-600 mr-2" />
                  Transaction Details
                </h3>
                <button
                  onClick={() => setShowTransactionDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Transaction Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Transaction Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center">
                        {getTransactionIcon(selectedTransaction.transaction_type?.Name || '')}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {selectedTransaction.transaction_type?.Name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            #{selectedTransaction.TransactionID}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">Date:</span>
                          <div className="text-gray-700">
                            {new Date(selectedTransaction.TransactionDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(selectedTransaction.TransactionDate).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-900">Status:</span>
                          <div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedTransaction.to_status?.Name === 'Available' ? 'bg-green-100 text-green-800' :
                              selectedTransaction.to_status?.Name === 'In Use' ? 'bg-blue-100 text-blue-800' :
                              selectedTransaction.to_status?.Name === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              selectedTransaction.to_status?.Name === 'Lost' ? 'bg-red-100 text-red-800' :
                              selectedTransaction.to_status?.Name === 'Broken' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedTransaction.to_status?.Name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedTransaction.ExpectedReturnDate && (
                        <div>
                          <span className="font-medium text-gray-900">Expected Return:</span>
                          <div className="text-blue-600 text-sm">
                            {new Date(selectedTransaction.ExpectedReturnDate).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {selectedTransaction.Comments && (
                        <div>
                          <span className="font-medium text-gray-900">Comments:</span>
                          <div className="text-gray-700 text-sm mt-1 p-2 bg-white rounded border">
                            {selectedTransaction.Comments}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Tool & Movement</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div>
                        <span className="font-medium text-gray-900">Tool:</span>
                        <div className="text-gray-700">
                          {selectedTransaction.tool?.Name || 'Unknown Tool'}
                        </div>
                        <div className="text-gray-500 text-sm">
                          Serial: {selectedTransaction.tool?.SerialNumber || 'No Serial'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-900">From:</span>
                          <div className="text-gray-700 text-sm">
                            {selectedTransaction.from_employee ? (
                              <div>
                                <div>{selectedTransaction.from_employee.FirstName} {selectedTransaction.from_employee.LastName}</div>
                                <div className="text-xs text-gray-500">Employee</div>
                              </div>
                            ) : selectedTransaction.from_toolbox ? (
                              <div>
                                <div>{selectedTransaction.from_toolbox.Name}</div>
                                <div className="text-xs text-gray-500">Toolbox</div>
                              </div>
                            ) : (
                              <div className="text-gray-500">Warehouse</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="font-medium text-gray-900">To:</span>
                          <div className="text-gray-700 text-sm">
                            {selectedTransaction.to_employee ? (
                              <div>
                                <div>{selectedTransaction.to_employee.FirstName} {selectedTransaction.to_employee.LastName}</div>
                                <div className="text-xs text-gray-500">Employee</div>
                              </div>
                            ) : selectedTransaction.to_toolbox ? (
                              <div>
                                <div>{selectedTransaction.to_toolbox.Name}</div>
                                <div className="text-xs text-gray-500">Toolbox</div>
                              </div>
                            ) : (
                              <div className="text-gray-500">Warehouse</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Transaction Images */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center mb-3">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Transaction Images
                    </h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {imagesLoading ? (
                        <div className="flex items-center justify-center h-48">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : transactionImages.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {transactionImages.map((image: any, index: number) => (
                            <div key={image.ImageID || index} className="space-y-2">
                              <img
                                src={image.ImageURL.startsWith('http') ? image.ImageURL : `http://localhost:8000${image.ImageURL}`}
                                alt={`Transaction image ${index + 1}`}
                                className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden text-sm text-red-600 text-center">
                                Failed to load image
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                <div>
                                  Uploaded: {new Date(image.UploadedAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                          <ImageIcon className="h-12 w-12 mb-2" />
                          <p className="text-sm">No images attached</p>
                          <p className="text-xs">Images can be added when creating transactions</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTransactionDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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

export default TransactionsTab;
