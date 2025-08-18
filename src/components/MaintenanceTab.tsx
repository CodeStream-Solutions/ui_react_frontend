import React, { useState, useEffect, useRef } from 'react';
import { toolApi } from '../services/api';
import { X, Upload } from 'lucide-react';

interface Tool {
  ToolID: number;
  Name: string;
  SerialNumber: string;
  CurrentStatus: number;
  ToolboxID: number;
  category?: {
    CategoryID: number;
    Name: string;
  };
  toolbox?: {
    ToolboxID: number;
    Name: string;
  };
  status?: {
    StatusTypeID: number;
    Name: string;
  };
}

interface MaintenanceTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ onSuccess, onError }) => {
  const [toolsInMaintenance, setToolsInMaintenance] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [returnComments, setReturnComments] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  // Image upload state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadToolsInMaintenance();
  }, []);

  const loadToolsInMaintenance = async () => {
    try {
      setLoading(true);
      const response = await toolApi.getToolsInMaintenance();
      setToolsInMaintenance(response.data);
    } catch (error: any) {
      onError('Failed to load tools in maintenance: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReturnFromMaintenance = (tool: Tool) => {
    setSelectedTool(tool);
    setReturnComments('');
    setImageUrls([]);
    setShowReturnModal(true);
  };

  // Image handling functions

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      const validFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          onError(`File ${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          onError(`File ${file.name} is too large (max 5MB)`);
          continue;
        }
        validFiles.push(file);
        formData.append('files', file);
      }

      if (validFiles.length === 0) {
        setUploadingImages(false);
        return;
      }

      const response = await toolApi.uploadFiles(formData);
      if (response.data.uploaded_files && response.data.uploaded_files.length > 0) {
        const newUrls = response.data.uploaded_files.map((file: any) => file.url);
        setImageUrls([...imageUrls, ...newUrls]);
        if (response.data.errors && response.data.errors.length > 0) {
          onError(`Some files had issues: ${response.data.errors.join(', ')}`);
        }
      } else {
        onError('No files were uploaded successfully');
      }
    } catch (error) {
      console.error('File upload error:', error);
      onError('Failed to upload images to server');
    } finally {
      setUploadingImages(false);
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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Create a fake event to reuse handleFileUpload
      const fakeEvent = {
        target: { files: e.dataTransfer.files }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  };

  const confirmReturnFromMaintenance = async () => {
    if (!selectedTool) return;

    try {
      setLoading(true);
      await toolApi.returnFromMaintenance({
        ToolID: selectedTool.ToolID,
        Comments: returnComments,
        ImageURLs: imageUrls.length > 0 ? imageUrls : undefined
      });
      
      onSuccess(`Tool "${selectedTool.Name}" has been returned from maintenance and is now available.`);
      setShowReturnModal(false);
      setSelectedTool(null);
      setReturnComments('');
      setImageUrls([]);
      await loadToolsInMaintenance(); // Refresh the list
    } catch (error: any) {
      onError('Failed to return tool from maintenance: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedTool(null);
    setReturnComments('');
    setImageUrls([]);
  };

  if (loading && toolsInMaintenance.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading tools in maintenance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Tools in Maintenance</h3>
        <button
          onClick={loadToolsInMaintenance}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          ) : (
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {toolsInMaintenance.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tools in maintenance</h3>
          <p className="mt-1 text-sm text-gray-500">
            All tools are currently available or in use.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {toolsInMaintenance.map((tool) => (
              <li key={tool.ToolID}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {tool.Name}
                            </p>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              In Maintenance
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <p>Serial: {tool.SerialNumber}</p>
                            {tool.category && (
                              <>
                                <span className="mx-2">•</span>
                                <p>Category: {tool.category.Name}</p>
                              </>
                            )}
                            {tool.toolbox && (
                              <>
                                <span className="mx-2">•</span>
                                <p>Location: {tool.toolbox.Name}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleReturnFromMaintenance(tool)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Return to Available
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Return from Maintenance Modal */}
      {showReturnModal && selectedTool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Return Tool from Maintenance
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Return <strong>{selectedTool.Name}</strong> (Serial: {selectedTool.SerialNumber}) from maintenance to available status.
                  </p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 text-left">
                    Maintenance Completion Notes
                  </label>
                  <textarea
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Describe what maintenance was completed..."
                  />
                </div>

                {/* Image Upload Section */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 text-left mb-2">
                    Maintenance Images (Optional)
                  </label>
                  
                  {/* File Upload Area */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      isDragOver 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop images here, or{' '}
                      <button
                        type="button"
                        onClick={openFileDialog}
                        className="text-green-600 hover:text-green-700 font-medium"
                        disabled={uploadingImages}
                      >
                        browse files
                      </button>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />



                  {/* Image List */}
                  {imageUrls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Images:</p>
                      {imageUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                            {url}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Status */}
                  {uploadingImages && (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      Uploading images...
                    </div>
                  )}
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    onClick={confirmReturnFromMaintenance}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Return to Available'
                    )}
                  </button>
                  <button
                    onClick={closeReturnModal}
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

export default MaintenanceTab;
