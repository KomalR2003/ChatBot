import React from 'react';
import { Menu, Brain } from 'lucide-react';

const Header = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-lg sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center py-6">
          {/* Menu button moved to left corner */}
          <button
            onClick={onToggleSidebar}
            className="p-3 rounded-xl hover:bg-gray-100/50 transition-all duration-200 hover:scale-105 active:scale-95 mr-4"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          {/* Logo and title in center */}
          <div className="flex items-center space-x-4 flex-1 justify-center">
            <div className="relative">
              <div className="p-3 bg-purple-200 rounded-2xl shadow-lg">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black">
               ChatBot
              </h1>
              <p className="text-sm text-gray-600 font-medium">Intelligent Assistant </p>
            </div>
          </div>
          
          {/* Right side spacer to balance the layout */}
          <div className="w-[60px]"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;