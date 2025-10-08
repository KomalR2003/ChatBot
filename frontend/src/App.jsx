import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import ChatSection from './components/ChatSection';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Create a new session automatically when the app starts
  useEffect(() => {
    handleNewChat();
  }, []);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleNewChat = async () => {
    try {
      // Create a new chat session
      const response = await axios.post(`${API_BASE_URL}/chat/new`, {
        title: "New Chat"
      });
      
      const newSessionId = response.data.session_id;
      setMessages([]);
      setCurrentSessionId(newSessionId);
      setRefreshTrigger(prev => prev + 1); // Trigger sidebar refresh
      
      // Close sidebar on mobile after creating new chat
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      // Fallback - just clear current chat
      clearChat();
    }
  };

  const handleSessionSelect = async (sessionId) => {
    if (sessionId === currentSessionId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/${sessionId}`);
      const session = response.data;
      
      // Convert session messages to app format
      const sessionMessages = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        sources: msg.sources || [],
        responseType: msg.response_type || 'general',
        error: false
      }));
      
      setMessages(sessionMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
      // If session doesn't exist or error, start new chat
      handleNewChat();
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSent = () => {
    // Refresh sidebar to update the last message time
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSessionDelete = (deletedSessionId) => {
    // If the deleted session was the current one, create a new session
    if (deletedSessionId === currentSessionId) {
      handleNewChat();
    }
    // Refresh sidebar
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Admin Panel */}
      <AdminPanel 
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
      />

      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onClearChat={clearChat}
          onOpenAdminPanel={() => {
            setAdminPanelOpen(true);
            // Close sidebar on mobile when opening admin panel
            if (window.innerWidth < 1024) {
              setSidebarOpen(false);
            }
          }}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onSessionDelete={handleSessionDelete}
          refreshTrigger={refreshTrigger}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Header - only visible on mobile/tablet */}
          <div className="lg:hidden">
            <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          </div>
          
          {/* Chat Section */}
          <div className="flex-1 p-4 lg:p-8 overflow-hidden">
            <div className="h-full max-w-6xl mx-auto">
              <ChatSection 
                messages={messages} 
                onAddMessage={addMessage}
                currentSessionId={currentSessionId}
                onNewChat={handleNewChat}
                loading={loading}
                onMessageSent={handleMessageSent}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;