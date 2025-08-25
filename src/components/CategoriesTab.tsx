import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useRBAC } from '../contexts/RBACContext';

interface ToolCategory {
  CategoryID: number;
  Name: string;
  Description?: string;
}

interface Tool {
  ToolID: number;
  SerialNumber: string;
  Name: string;
  CategoryID?: number;
  IsActive: boolean;
}

interface CategoriesTabProps {
  categories: ToolCategory[];
  tools: Tool[];
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onUpdate: (categoryId: number, data: any) => Promise<void>;
  onDelete: (categoryId: number) => Promise<void>;
  resetForm: () => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  tools,
  showModal,
  setShowModal,
  form,
  setForm,
  onSubmit,
  onUpdate,
  onDelete,
}) => {
  const { hasPermission } = useRBAC();
  const [editingCategory, setEditingCategory] = useState<ToolCategory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ Name: '', Description: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ToolCategory | null>(null);

  const handleEditClick = (category: ToolCategory) => {
    setEditingCategory(category);
    setEditForm({ Name: category.Name, Description: category.Description || '' });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await onUpdate(editingCategory.CategoryID, editForm);
      setShowEditModal(false);
      setEditingCategory(null);
      setEditForm({ Name: '', Description: '' });
    }
  };

  const handleDeleteClick = (category: ToolCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      await onDelete(categoryToDelete.CategoryID);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const getToolsInCategory = (categoryId: number) => {
    return tools.filter(tool => tool.CategoryID === categoryId && tool.IsActive);
  };
  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Tool Categories
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage tool categories for better organization
              </p>
            </div>
            {hasPermission('create_categories') && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.CategoryID} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    {category.Name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {category.Description || 'No description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {hasPermission('update_categories') && (
                  <button
                    onClick={() => handleEditClick(category)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit Category"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                {hasPermission('delete_categories') && (
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Category</h3>
                <button
                  onClick={() => setShowModal(false)}
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
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={form.Description}
                    onChange={(e) => setForm({...form, Description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
                 </div>
       )}

       {/* Edit Category Modal */}
       {showEditModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium text-gray-900">Edit Category</h3>
                 <button
                   onClick={() => setShowEditModal(false)}
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
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Description</label>
                   <textarea
                     value={editForm.Description}
                     onChange={(e) => setEditForm({...editForm, Description: e.target.value})}
                     rows={3}
                     className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                   />
                 </div>
                 
                 <div className="flex justify-end space-x-3">
                   <button
                     type="button"
                     onClick={() => setShowEditModal(false)}
                     className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                   >
                     Update Category
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

       {/* Delete Category Confirmation Modal */}
       {showDeleteModal && categoryToDelete && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center mb-4">
                 <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                   <AlertTriangle className="h-6 w-6 text-red-600" />
                 </div>
               </div>
               
               <div className="text-center">
                 {(() => {
                   const affectedTools = getToolsInCategory(categoryToDelete.CategoryID);
                   const toolCount = affectedTools.length;
                   
                   if (toolCount > 0) {
                     return (
                       <>
                         <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                           Cannot Delete Category
                         </h3>
                         <div className="mt-2">
                           <p className="text-sm text-gray-500 mb-3">
                             The category <strong>"{categoryToDelete.Name}"</strong> cannot be deleted because it is currently being used by {toolCount} tool{toolCount !== 1 ? 's' : ''}.
                           </p>
                           
                           <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                             <div className="flex">
                               <AlertTriangle className="h-5 w-5 text-red-400" />
                               <div className="ml-3 text-left">
                                 <h4 className="text-sm font-medium text-red-800">
                                   {toolCount} tool{toolCount !== 1 ? 's are' : ' is'} using this category
                                 </h4>
                                 <div className="mt-2 text-sm text-red-700">
                                   <p>
                                     The following tool{toolCount !== 1 ? 's' : ''} must be reassigned to a different category first:
                                   </p>
                                   <ul className="mt-1 list-disc list-inside max-h-24 overflow-y-auto">
                                     {affectedTools.slice(0, 10).map(tool => (
                                       <li key={tool.ToolID} className="text-xs">
                                         {tool.Name} ({tool.SerialNumber})
                                       </li>
                                     ))}
                                     {toolCount > 10 && (
                                       <li className="text-xs font-medium">
                                         ...and {toolCount - 10} more tool{toolCount - 10 !== 1 ? 's' : ''}
                                       </li>
                                     )}
                                   </ul>
                                   <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                                     <p className="font-medium text-xs">
                                       💡 To delete this category:
                                     </p>
                                     <ol className="text-xs mt-1 list-decimal list-inside">
                                       <li>Go to the <strong>Tools</strong> tab</li>
                                       <li>Edit each tool listed above</li>
                                       <li>Change their category to a different one</li>
                                       <li>Then return here to delete this category</li>
                                     </ol>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </>
                     );
                   } else {
                     return (
                       <>
                         <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                           Delete Category
                         </h3>
                         <div className="mt-2">
                           <p className="text-sm text-gray-500 mb-3">
                             Are you sure you want to delete the category <strong>"{categoryToDelete.Name}"</strong>?
                           </p>
                           <p className="text-sm text-gray-500">
                             This action cannot be undone.
                           </p>
                         </div>
                       </>
                     );
                   }
                 })()}
               </div>
               
               {(() => {
                 const affectedTools = getToolsInCategory(categoryToDelete.CategoryID);
                 const toolCount = affectedTools.length;
                 
                 if (toolCount > 0) {
                   // Category has tools - only show Close button
                   return (
                     <div className="mt-5 sm:mt-6">
                       <button
                         onClick={() => setShowDeleteModal(false)}
                         className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                       >
                         Close
                       </button>
                     </div>
                   );
                 } else {
                   // Category is empty - show Delete and Cancel buttons
                   return (
                     <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                       <button
                         onClick={handleDeleteConfirm}
                         className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                       >
                         Delete Category
                       </button>
                       <button
                         onClick={() => setShowDeleteModal(false)}
                         className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                       >
                         Cancel
                       </button>
                     </div>
                   );
                 }
               })()}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default CategoriesTab;
