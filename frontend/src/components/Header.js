import React from 'react';
import { Menu, Sparkles, Brain, Zap } from 'lucide-react';

const Header = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-lg sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 ">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="p-3 rounded-xl hover:bg-gray-100/50 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Universal AI
                </h1>
                <p className="text-sm text-gray-600 font-medium">Intelligent Assistant • Always Learning</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
           
         
            {/* Status Indicator */}
            
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;