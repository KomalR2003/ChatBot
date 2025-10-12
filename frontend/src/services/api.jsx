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

// 🧠 Chat session management
export const createNewChat = async (title = "New Chat") => {
  return api.post('/chat/new', { title });
};

export const getChatSessions = async () => {
  return api.get('/chat/sessions');
};

export const getChatSession = async (sessionId) => {
  return api.get(`/chat/${sessionId}`);
};

// ✅ Delete a single chat by ID
export const deleteChatSession = async (sessionId) => {
  if (!sessionId) throw new Error("Session ID is missing");
  return api.delete(`/chat/${sessionId}`);
};

// ❌ Remove or ignore this
// export const clearAllChats = async () => {
//   return api.delete('/chat/clear-all');
// };

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

export const testConnection = async () => {
  return api.get('/test');
};

export default api;
