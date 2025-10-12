import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  History,
  Settings,
  Shield,
  Plus,
  MoreVertical,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const Sidebar = ({
  isOpen,
  onClose,
  onOpenAdminPanel,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onSessionDelete,
  refreshTrigger,
}) => {
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" }); // ✅ for success/error messages

  // Fetch chat sessions initially and on refresh
  useEffect(() => {
    fetchChatSessions();
  }, [refreshTrigger]);

  // Fetch sessions when sidebar opens (mobile)
  useEffect(() => {
    if (isOpen) fetchChatSessions();
  }, [isOpen]);

  // ✅ Fetch chat sessions
  const fetchChatSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/sessions`);
      setChatSessions(response.data);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      setChatSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete one chat by ID + show message
  const deleteSession = async (sessionId) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this chat?");
      if (!confirmed) return;

      await axios.delete(`${API_BASE_URL}/chat/${sessionId}`);

      setChatSessions((prev) =>
        prev.filter((session) => session.session_id !== sessionId)
      );

      if (onSessionDelete) onSessionDelete(sessionId);
      setShowDeleteMenu(null);

      // ✅ Show success message
      showTemporaryMessage("Chat deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting session:", error);
      showTemporaryMessage("Failed to delete chat. Please try again.", "error");
    }
  };

  // ✅ Display message for 3 seconds
  const showTemporaryMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleNewChat = () => {
    onNewChat();
  };

  const handleSessionClick = (sessionId) => {
    onSessionSelect(sessionId);
    if (window.innerWidth < 1024) onClose();
  };

  // Format last update time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24)
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    if (diffInHours < 48) return "Yesterday";
    if (diffInHours < 168)
      return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Mobile overlay
  const MobileOverlay = () => (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
      onClick={onClose}
    />
  );

  // Sidebar main content
  const SidebarContent = () => (
    <div className="h-full bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-200 rounded-xl shadow-lg">
              <History className="w-5 h-5 text-purple-700" />
            </div>
            <h2 className="text-xl font-bold">Chat History</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* ✅ Message (success / error) */}
      {message.text && (
        <div
          className={`mx-4 mt-3 text-sm text-center py-2 px-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Chat Sessions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No chat history yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Start a conversation to see it here
            </p>
          </div>
        ) : (
          chatSessions.map((session) => (
            <div key={session.session_id} className="relative group">
              <div
                onClick={() => handleSessionClick(session.session_id)}
                className={`w-full p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-blue-50 border ${
                  currentSessionId === session.session_id
                    ? "bg-blue-100 border-blue-300 shadow-md"
                    : "bg-white/60 border-gray-200/50 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-medium text-gray-800 truncate pr-2 mb-1"
                      title={session.title}
                    >
                      {session.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {formatDate(session.updated_at)}
                    </p>
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteMenu(
                          showDeleteMenu === session.session_id
                            ? null
                            : session.session_id
                        );
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all duration-200"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {showDeleteMenu === session.session_id && (
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.session_id);
                          }}
                          className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50 flex-shrink-0">
        <div className="space-y-3">
          <button
            onClick={onOpenAdminPanel}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-purple-50 text-purple-600 border border-purple-200/50 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Admin Panel</span>
          </button>
        </div>

        <div className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-2xl border border-gray-200/50 shadow-lg">
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-200 rounded-2xl mx-auto mb-2 flex items-center justify-center shadow-lg">
              <Settings className="w-5 h-5 text-purple-700" />
            </div>
            <h4 className="font-semibold text-gray-800 text-sm mb-1">
              Universal AI
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your conversations are saved automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && <MobileOverlay />}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
