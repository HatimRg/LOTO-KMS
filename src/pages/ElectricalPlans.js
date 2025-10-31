import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, AlertCircle, Upload, Download, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Footer from '../components/Footer';
import db from '../utils/database';

const { ipcRenderer } = window;

function ElectricalPlans() {
  const { userMode } = useApp();
  const { showToast } = useToast();
  const pdfInputRef = useRef(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [version, setVersion] = useState('');
  const [viewingPlan, setViewingPlan] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Only show loading spinner on initial load, not on updates (preserves scroll)
    const isInitialLoad = plans.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    const result = await db.getPlans();
    if (result.success) {
      setPlans(result.data);
    }
    
    if (isInitialLoad) {
      setLoading(false);
    }
  };

  // Handle PDF file selection (browser compatible)
  const handlePDFSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast('Please select a PDF file', 'error');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedFile({
        name: file.name,
        data: e.target?.result,
        type: file.type
      });
      showToast(`PDF selected: ${file.name}`, 'success');
    };
    reader.onerror = () => {
      showToast('Failed to read PDF file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showToast('Please select a PDF file', 'error');
      return;
    }

    try {
      let filePath = '';
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${selectedFile.name}`;
      
      if (ipcRenderer) {
        // Electron mode: Save via IPC
        const saveResult = await ipcRenderer.invoke('save-file', {
          fileName: fileName,
          fileData: selectedFile.data,
          type: 'plan'
        });
        
        if (saveResult.success) {
          filePath = saveResult.path;
        } else {
          showToast('Failed to save PDF file', 'error');
          return;
        }
      } else {
        // Browser mode: Store data URL
        filePath = selectedFile.data;
      }
      
      // Add to database
      const result = await db.addPlan({
        filename: selectedFile.name,
        file_path: filePath,
        version: version || null
      });
      
      if (result.success) {
        showToast('Electrical plan uploaded successfully', 'success');
        setShowModal(false);
        setSelectedFile(null);
        setVersion('');
        loadData();
      } else {
        showToast('Failed to save plan to database', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast(`Upload error: ${error.message}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      const result = await db.deletePlan(id);
      if (result.success) {
        showToast('Plan deleted successfully', 'success');
        loadData();
      } else {
        showToast('Failed to delete plan', 'error');
      }
    }
  };

  const handleDownload = async (plan) => {
    if (!plan.file_path) {
      showToast('No file available', 'error');
      return;
    }

    try {
      // Check if it's a data URL (browser mode)
      if (plan.file_path.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = plan.file_path;
        a.download = plan.filename || 'electrical_plan.pdf';
        a.click();
        showToast('Plan downloaded', 'success');
      } else if (ipcRenderer) {
        // Electron mode
        const result = await ipcRenderer.invoke('read-file', plan.file_path);
        if (result.success) {
          const blob = new Blob([Buffer.from(result.data, 'base64')], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = plan.filename || 'electrical_plan.pdf';
          a.click();
          window.URL.revokeObjectURL(url);
          showToast('Plan downloaded', 'success');
        } else {
          showToast('Failed to download plan', 'error');
        }
      } else {
        showToast('Download not available', 'error');
      }
    } catch (error) {
      console.error('Error downloading plan:', error);
      showToast('Error downloading plan', 'error');
    }
  };

  const handleView = async (plan) => {
    if (!plan.file_path) {
      showToast('No file available', 'error');
      return;
    }

    try {
      // Check if it's a data URL (browser mode)
      if (plan.file_path.startsWith('data:')) {
        setViewingPlan({
          ...plan,
          url: plan.file_path
        });
      } else if (ipcRenderer) {
        // Electron mode - read file and create blob URL
        const result = await ipcRenderer.invoke('read-file', plan.file_path);
        if (result.success) {
          const blob = new Blob([Buffer.from(result.data, 'base64')], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          setViewingPlan({
            ...plan,
            url: url
          });
        } else {
          showToast('Failed to load plan', 'error');
        }
      } else {
        showToast('Plan viewing not available', 'error');
      }
    } catch (error) {
      console.error('Error viewing plan:', error);
      showToast('Error loading plan', 'error');
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay - Only on initial load */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      {/* Hidden PDF Input */}
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handlePDFSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
          <FileText className="w-7 h-7 text-purple-600" />
          <span>Electrical Plan Viewer</span>
        </h1>
        {userMode === 'Editor' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Plan</span>
          </button>
        )}
      </div>

      {/* Plans Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No electrical plans uploaded yet. {userMode === 'Editor' && 'Upload one to get started!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="w-8 h-8 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-medium text-gray-900 dark:text-white break-words line-clamp-2" 
                        title={plan.filename}
                      >
                        {plan.filename}
                      </h3>
                      {plan.version && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Version: {plan.version}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Uploaded: {new Date(plan.uploaded_at).toLocaleDateString()}
                </p>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleView(plan)}
                    className="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg flex items-center justify-center space-x-1 text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownload(plan)}
                    className="flex-1 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg flex items-center justify-center space-x-1 text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  {userMode === 'Editor' && (
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Upload Electrical Plan
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select PDF File
                </label>
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Upload className="w-5 h-5" />
                  <span>{selectedFile ? `✓ ${selectedFile.name}` : 'Click to upload PDF'}</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version (Optional)
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g., v1.0, 2024-01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedFile(null);
                    setVersion('');
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {viewingPlan.filename}
                </h2>
                {viewingPlan.version && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    {viewingPlan.version}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(viewingPlan)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    if (viewingPlan.url && !viewingPlan.url.startsWith('data:')) {
                      window.URL.revokeObjectURL(viewingPlan.url);
                    }
                    setViewingPlan(null);
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* PDF Content */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={viewingPlan.url}
                className="w-full h-full"
                title="Electrical Plan Viewer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default ElectricalPlans;
