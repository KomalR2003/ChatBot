import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import ChatSection from './components/ChatSection';
import Sidebar from './components/Sidebar';

function App() {
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const downloadHistory = () => {
    if (messages.length === 0) return;
    
    const chatText = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const element = document.createElement('a');
    const file = new Blob([chatText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'chat_history.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onClearChat={clearChat}
        onDownloadHistory={downloadHistory}
        hasMessages={messages.length > 0}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <UploadSection />
            </div>
            
            {/* Chat Section */}
            <div className="lg:col-span-3">
              <ChatSection 
                messages={messages} 
                onAddMessage={addMessage} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;