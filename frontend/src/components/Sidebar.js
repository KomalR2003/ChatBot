import React from 'react';
import { X, Trash2, Download, History, Settings, Shield } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, onClearChat, onDownloadHistory, onOpenAdminPanel, hasMessages }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 border-r border-gray-200/50">
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <History className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Menu
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100/50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Chat Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Chat Actions</h3>
            
            <button
              onClick={onClearChat}
              disabled={!hasMessages}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                hasMessages 
                  ? 'hover:bg-red-50 text-red-600 border border-red-200/50 hover:shadow-lg hover:scale-105 active:scale-95' 
                  : 'text-gray-400 cursor-not-allowed border border-gray-200/50 bg-gray-50/50'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Clear Chat History</span>
            </button>
            
            <button
              onClick={onDownloadHistory}
              disabled={!hasMessages}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                hasMessages 
                  ? 'hover:bg-blue-50 text-blue-600 border border-blue-200/50 hover:shadow-lg hover:scale-105 active:scale-95' 
                  : 'text-gray-400 cursor-not-allowed border border-gray-200/50 bg-gray-50/50'
              }`}
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Download History</span>
            </button>
          </div>

          {/* Admin Section */}
          <div className="space-y-3 pt-4 border-t border-gray-200/50">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Administration</h3>
            
            <button
              onClick={onOpenAdminPanel}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-purple-50 text-purple-600 border border-purple-200/50 hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Admin Panel</span>
            </button>
          </div>
        </div>
        
        {/* Bottom Info Card */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-5 rounded-2xl border border-gray-200/50 shadow-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Universal AI</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ask questions about your documents or get answers from my general knowledge base!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;