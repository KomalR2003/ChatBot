import React, { useState, useCallback, useEffect } from 'react';
import { 
  X, Upload, File, Trash2, 
  CheckCircle, AlertCircle, FileText, Database,
  Eye, EyeOff, RefreshCw
} from 'lucide-react';

const AdminPanel = ({ isOpen, onClose }) => {
  const [adminKey, setAdminKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // File upload states
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // PDF list states
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [deletingPdf, setDeletingPdf] = useState('');

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch PDFs when admin panel opens or when manage tab is active
  useEffect(() => {
    if (isOpen && adminKey && activeTab === 'manage') {
      fetchUploadedPdfs();
    }
  }, [isOpen, adminKey, activeTab]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const fetchUploadedPdfs = async () => {
    if (!adminKey) return;
    
    setLoadingPdfs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pdfs/?admin_key=${encodeURIComponent(adminKey)}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Invalid admin key');
        }
        throw new Error('Failed to fetch PDFs');
      }
      
      const data = await response.json();
      setUploadedPdfs(data.pdfs || []);
    } catch (error) {
      showMessage('error', error.message || 'Failed to fetch PDFs');
      setUploadedPdfs([]);
    } finally {
      setLoadingPdfs(false);
    }
  };

  // PDF file handling
  const handleFileInput = useCallback((event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size
    }));
    setPdfFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(file => file.type === 'application/pdf');
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size
    }));
    setPdfFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const removeFile = (fileId) => {
    setPdfFiles(files => files.filter(file => file.id !== fileId));
  };

  const uploadPdfFiles = async () => {
    if (!adminKey || pdfFiles.length === 0) return;

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('admin_key', adminKey);
      pdfFiles.forEach(({ file }) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/admin/upload_pdfs/`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      showMessage('success', result.message || `Successfully uploaded ${pdfFiles.length} PDF files!`);
      setPdfFiles([]);
      
      // Refresh PDF list if on manage tab
      if (activeTab === 'manage') {
        fetchUploadedPdfs();
      }
    } catch (error) {
      showMessage('error', error.message || 'PDF upload failed');
    } finally {
      setUploadingPdf(false);
    }
  };

 const deletePdf = async (filename) => {
  if (!adminKey || !filename) return;

  setDeletingPdf(filename);
  try {
    // Use the full_path instead of just filename for more accurate deletion
    const pdfToDelete = uploadedPdfs.find(pdf => pdf.filename === filename);
    const pathToDelete = pdfToDelete ? pdfToDelete.full_path : filename;
    
    const response = await fetch(`${API_BASE_URL}/admin/delete_file/?filename=${encodeURIComponent(pathToDelete)}&admin_key=${encodeURIComponent(adminKey)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Delete failed');
    }

    const result = await response.json();
    showMessage('success', result.message || `Successfully deleted "${filename}"`);
    
    // Remove the item from local state immediately
    setUploadedPdfs(prev => prev.filter(pdf => pdf.filename !== filename));
    
  } catch (error) {
    console.error('Delete error:', error);
    showMessage('error', error.message || 'Failed to delete PDF');
    // Refresh the list to see current state
    fetchUploadedPdfs();
  } finally {
    setDeletingPdf('');
  }
};


  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Admin Panel */}
      <div className="fixed inset-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl z-50 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2  bg-purple-200  rounded-xl shadow-lg">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black text-transparent">
                    Admin Panel
                  </h2>
                  <p className="text-gray-600">Manage PDF documents</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100/50 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            {/* Admin Key Input */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Key
              </label>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin key..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Message Banner */}
          {message && (
            <div className={`px-6 py-4 border-b ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? 
                  <CheckCircle className="w-5 h-5" /> : 
                  <AlertCircle className="w-5 h-5" />
                }
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {!adminKey ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Authentication Required</h3>
                  <p className="text-gray-500">Enter your admin key to access the panel</p>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="px-6 py-4 border-b border-gray-200/50">
                  <div className="flex space-x-1 bg-gray-100/50 rounded-xl p-1">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === 'upload'
                          ? 'bg-white shadow-lg text-purple-600'
                          : 'text-gray-600 hover:text-purple-600'
                      }`}
                    >
                      Upload PDFs
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('manage');
                        fetchUploadedPdfs();
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === 'manage'
                          ? 'bg-white shadow-lg text-purple-600'
                          : 'text-gray-600 hover:text-purple-600'
                      }`}
                    >
                      Manage PDFs
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'upload' && (
                    <div className="space-y-8">
                      {/* PDF Upload Section */}
                      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <FileText className="w-5 h-5 text-red-500 mr-2" />
                          Upload PDF Documents
                        </h3>
                        
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 border-gray-300 hover:border-red-400 hover:bg-red-50"
                        >
                          <input 
                            type="file"
                            accept=".pdf"
                            multiple
                            onChange={handleFileInput}
                            className="hidden"
                            id="pdf-upload"
                          />
                          <label htmlFor="pdf-upload" className="cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">
                              Upload PDF Documents
                            </p>
                            <p className="text-sm text-gray-500">
                              Drag & drop PDF files here, or click to select
                            </p>
                          </label>
                        </div>

                        {pdfFiles.length > 0 && (
                          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                            {pdfFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <File className="w-5 h-5 text-red-500" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-60">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="p-1 hover:bg-red-200 rounded-full transition-colors"
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={uploadPdfFiles}
                          disabled={pdfFiles.length === 0 || uploadingPdf || !adminKey}
                          className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {uploadingPdf ? 'Uploading...' : `Upload ${pdfFiles.length} PDF file${pdfFiles.length !== 1 ? 's' : ''}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'manage' && (
                    <div className="space-y-6">
                      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FileText className="w-5 h-5 text-blue-500 mr-2" />
                            Uploaded PDF Documents
                          </h3>
                          <button
                            onClick={fetchUploadedPdfs}
                            disabled={loadingPdfs}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
                          >
                            <RefreshCw className={`w-4 h-4 ${loadingPdfs ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                          </button>
                        </div>
                        
                        {loadingPdfs ? (
                          <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                            <span className="ml-2 text-gray-600">Loading PDFs...</span>
                          </div>
                        ) : uploadedPdfs.length === 0 ? (
                          <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-600 mb-2">No PDFs Found</h4>
                            <p className="text-gray-500">Upload some PDF documents to see them here</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left p-4 font-medium text-gray-700 border-b">File Name</th>
                                  <th className="text-left p-4 font-medium text-gray-700 border-b">Upload Date</th>
                                  <th className="text-left p-4 font-medium text-gray-700 border-b">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {uploadedPdfs.map((pdf, index) => (
                                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                      <div className="flex items-center space-x-3">
                                        <File className="w-5 h-5 text-red-500" />
                                        <span className="text-gray-800 font-medium truncate max-w-xs">
                                          {pdf.filename}
                                        </span>
                                      </div>
                                    </td>                              
                                    <td className="p-4 text-gray-600">
                                      {pdf.upload_date ? formatDate(pdf.upload_date) : 'N/A'}
                                    </td>
                                    <td className="p-4">
                                      <button
                                        onClick={() => deletePdf(pdf.filename)}
                                        disabled={deletingPdf === pdf.filename}
                                        className="px-3 py-2 bg-red-500  text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
                                      >
                                        {deletingPdf === pdf.filename ? (
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                        <span>{deletingPdf === pdf.filename ? 'Deleting...' : 'Delete'}</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;