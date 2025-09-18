import React from 'react';
import { Menu, Bot, MessageSquare } from 'lucide-react';

const Header = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RAG Chatbot
                </h1>
                <p className="text-sm text-gray-500">AI-Powered Document Assistant</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Ready to help</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;