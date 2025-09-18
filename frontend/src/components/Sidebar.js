import React from 'react';
import { X, Trash2, Download, History } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, onClearChat, onDownloadHistory, hasMessages }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Chat Options</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <button
            onClick={onClearChat}
            disabled={!hasMessages}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              hasMessages 
                ? 'hover:bg-red-50 text-red-600 border border-red-200' 
                : 'text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear Chat</span>
          </button>
          
          <button
            onClick={onDownloadHistory}
            disabled={!hasMessages}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              hasMessages 
                ? 'hover:bg-blue-50 text-blue-600 border border-blue-200' 
                : 'text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            <Download className="w-5 h-5" />
            <span>Download History</span>
          </button>
        </div>
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 text-center">
              Upload PDFs and start chatting with your documents!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;