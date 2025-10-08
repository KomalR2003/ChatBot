import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 360000, 
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response received:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// File upload functions
export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  return api.post('/upload_pdfs/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Chat functions
export const askQuestion = async (question, sessionId = null) => {
  const formData = new FormData();
  formData.append('question', question);
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  return api.post('/ask/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Chat session management
export const createNewChat = async (title = "New Chat") => {
  return api.post('/chat/new', { title });
};

export const getChatSessions = async () => {
  return api.get('/chat/sessions');
};

export const getChatSession = async (sessionId) => {
  return api.get(`/chat/${sessionId}`);
};



export const deleteChatSession = async (sessionId) => {
  return api.delete(`/chat/${sessionId}`);
};

export const clearAllChats = async () => {
  return api.delete('/chat/clear-all');
};

// Legacy functions for backward compatibility
export const getChatHistory = async () => {
  return getChatSessions();
};

export const saveChat = async (chatData) => {
  // This function is no longer needed as chats are saved automatically
  // Keeping it for backward compatibility
  return Promise.resolve({ data: { message: "Chat saved automatically" } });
};

export const testConnection = async () => {
  return api.get('/test');
};

export default api;