import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

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

export const askQuestion = async (question) => {
  const formData = new FormData();
  formData.append('question', question);

  return api.post('/ask/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getChatHistory = async () => {
  return api.get('/chat_history/');
};

export const saveChat = async (chatData) => {
  return api.post('/save_chat/', chatData);
};

export const testConnection = async () => {
  return api.get('/test');
};

export default api;