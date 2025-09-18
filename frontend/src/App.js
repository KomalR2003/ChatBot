import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import ChatSection from './components/ChatSection';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';

function App() {
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

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
    element.download = `chat_history_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onClearChat={clearChat}
        onDownloadHistory={downloadHistory}
        onOpenAdminPanel={() => {
          setAdminPanelOpen(true);
          setSidebarOpen(false);
        }}
        hasMessages={messages.length > 0}
      />

      {/* Admin Panel */}
      <AdminPanel 
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ChatSection 
            messages={messages} 
            onAddMessage={addMessage} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;