import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  X, Upload, File, Trash2, BarChart3, Key, 
  CheckCircle, AlertCircle, FileText, Database,
  Eye, EyeOff, RefreshCw, Download
} from 'lucide-react';
import axios from 'axios';

const AdminPanel = ({ isOpen, onClose }) => {
  const [adminKey, setAdminKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // File upload states
  const [pdfFiles, setPdfFiles] = useState([]);
  const [jsonFiles, setJsonFiles] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingJson, setUploadingJson] = useState(false);
  
  // File deletion states
  const [deleteFilename, setDeleteFilename] = useState('');
  const [deleting, setDeleting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch stats when admin panel opens
  useEffect(() => {
    if (isOpen && adminKey) {
      fetchStats();
    }
  }, [isOpen, adminKey]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const fetchStats = async () => {
    if (!adminKey) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats/`, {
        params: { admin_key: adminKey }
      });
      setStats(response.data);
      showMessage('success', 'Stats loaded successfully');
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Failed to fetch stats');
      if (error.response?.status === 403) {
        setStats(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // PDF upload dropzone
  const onPdfDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size
    }));
    setPdfFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
    onDrop: onPdfDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  // JSON upload dropzone
  const onJsonDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size
    }));
    setJsonFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps: getJsonRootProps, getInputProps: getJsonInputProps, isDragActive: isJsonDragActive } = useDropzone({
    onDrop: onJsonDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: true
  });

  const removeFile = (fileId, type) => {
    if (type === 'pdf') {
      setPdfFiles(files => files.filter(file => file.id !== fileId));
    } else {
      setJsonFiles(files => files.filter(file => file.id !== fileId));
    }
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

      const response = await axios.post(`${API_BASE_URL}/admin/upload_pdfs/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showMessage('success', `Successfully uploaded ${pdfFiles.length} PDF files!`);
      setPdfFiles([]);
      fetchStats(); // Refresh stats
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'PDF upload failed');
    } finally {
      setUploadingPdf(false);
    }
  };

  const uploadJsonFiles = async () => {
    if (!adminKey || jsonFiles.length === 0) return;

    setUploadingJson(true);
    try {
      const formData = new FormData();
      formData.append('admin_key', adminKey);
      jsonFiles.forEach(({ file }) => {
        formData.append('files', file);
      });

      const response = await axios.post(`${API_BASE_URL}/admin/upload_json/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showMessage('success', `Successfully uploaded ${jsonFiles.length} JSON files!`);
      setJsonFiles([]);
      fetchStats(); // Refresh stats
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'JSON upload failed');
    } finally {
      setUploadingJson(false);
    }
  };

  const deleteFile = async () => {
    if (!adminKey || !deleteFilename.trim()) return;

    setDeleting(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/admin/delete_file/`, {
        params: {
          filename: deleteFilename.trim(),
          admin_key: adminKey
        }
      });

      showMessage('success', `Deleted ${response.data.deleted_count} documents for "${deleteFilename}"`);
      setDeleteFilename('');
      fetchStats(); // Refresh stats
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'File deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h2>
                  <p className="text-gray-600">Manage documents and system settings</p>
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
                <button
                  onClick={fetchStats}
                  disabled={!adminKey || loading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Verify</span>
                </button>
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
                  <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                      Upload Files
                    </button>
                    <button
                      onClick={() => setActiveTab('manage')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === 'manage'
                          ? 'bg-white shadow-lg text-purple-600'
                          : 'text-gray-600 hover:text-purple-600'
                      }`}
                    >
                      Manage Files
                    </button>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === 'stats'
                          ? 'bg-white shadow-lg text-purple-600'
                          : 'text-gray-600 hover:text-purple-600'
                      }`}
                    >
                      Statistics
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
                          {...getPdfRootProps()}
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                            isPdfDragActive 
                              ? 'border-red-400 bg-red-50' 
                              : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                          }`}
                        >
                          <input {...getPdfInputProps()} />
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            {isPdfDragActive ? 'Drop PDF files here' : 'Upload PDF Documents'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Drag & drop PDF files here, or click to select
                          </p>
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
                                  onClick={() => removeFile(file.id, 'pdf')}
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

                      {/* JSON Upload Section */}
                      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Database className="w-5 h-5 text-blue-500 mr-2" />
                          Upload JSON Data
                        </h3>
                        
                        <div
                          {...getJsonRootProps()}
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                            isJsonDragActive 
                              ? 'border-blue-400 bg-blue-50' 
                              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <input {...getJsonInputProps()} />
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            {isJsonDragActive ? 'Drop JSON files here' : 'Upload JSON Data'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Drag & drop JSON files here, or click to select
                          </p>
                        </div>

                        {jsonFiles.length > 0 && (
                          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                            {jsonFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <File className="w-5 h-5 text-blue-500" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-60">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFile(file.id, 'json')}
                                  className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                                >
                                  <X className="w-4 h-4 text-blue-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={uploadJsonFiles}
                          disabled={jsonFiles.length === 0 || uploadingJson || !adminKey}
                          className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {uploadingJson ? 'Uploading...' : `Upload ${jsonFiles.length} JSON file${jsonFiles.length !== 1 ? 's' : ''}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'manage' && (
                    <div className="space-y-6">
                      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Trash2 className="w-5 h-5 text-red-500 mr-2" />
                          Delete Documents
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Enter a filename (or part of it) to delete matching documents from the database.
                        </p>
                        
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            value={deleteFilename}
                            onChange={(e) => setDeleteFilename(e.target.value)}
                            placeholder="Enter filename to delete..."
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                          />
                          <button
                            onClick={deleteFile}
                            disabled={!deleteFilename.trim() || deleting || !adminKey}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            {deleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                        
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> This will permanently delete all documents that contain the specified filename in their source path.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'stats' && (
                    <div className="space-y-6">
                      {stats ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-blue-600 font-medium">Total Documents</p>
                                  <p className="text-3xl font-bold text-blue-800">{stats.total_documents}</p>
                                </div>
                                <BarChart3 className="w-12 h-12 text-blue-500" />
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-red-600 font-medium">PDF Documents</p>
                                  <p className="text-3xl font-bold text-red-800">{stats.pdf_documents}</p>
                                </div>
                                <FileText className="w-12 h-12 text-red-500" />
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-purple-600 font-medium">JSON Documents</p>
                                  <p className="text-3xl font-bold text-purple-800">{stats.json_documents}</p>
                                </div>
                                <Database className="w-12 h-12 text-purple-500" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-800">Database Statistics</h3>
                              <button
                                onClick={fetchStats}
                                disabled={loading}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
                              >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                <span>Refresh</span>
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-700">Document Distribution</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">PDF Files</span>
                                    <span className="font-medium">{((stats.pdf_documents / stats.total_documents) * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-red-500 h-2 rounded-full" 
                                      style={{ width: `${(stats.pdf_documents / stats.total_documents) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">JSON Files</span>
                                    <span className="font-medium">{((stats.json_documents / stats.total_documents) * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-purple-500 h-2 rounded-full" 
                                      style={{ width: `${(stats.json_documents / stats.total_documents) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-700">System Status</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-gray-600">Database Connected</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-gray-600">Vector Search Active</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-gray-600">LLM Service Online</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Statistics Available</h3>
                          <p className="text-gray-500">Verify your admin key to view database statistics</p>
                        </div>
                      )}
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