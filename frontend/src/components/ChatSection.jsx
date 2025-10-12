
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { askQuestion } from '../services/api';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const ChatSection = ({ messages, onAddMessage, currentSessionId, onNewChat, loading, onMessageSent }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    onAddMessage(userMessage);
    
    const questionText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      let sessionToUse = currentSessionId;
      
      // If no current session exists, create one first
      if (!sessionToUse) {
        try {
          const newSessionResponse = await axios.post(`${API_BASE_URL}/chat/new`, {
            title: "New Chat"
          });
          sessionToUse = newSessionResponse.data.session_id;
          // Update the current session in the parent component
          if (onNewChat) {
            onNewChat(sessionToUse);
          }
        } catch (sessionError) {
          console.error('Error creating session:', sessionError);
          // Continue without session if creation fails
        }
      }

      // Send the question with the session ID
      const response = await askQuestion(questionText, sessionToUse);
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        sources: response.data.sources || [],
        responseType: response.data.response_type || 'general'
      };
      onAddMessage(assistantMessage);
      
      // Notify parent that a message was sent (for sidebar refresh)
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I encountered an error while processing your question. Please try again.',
        error: true
      };
      onAddMessage(errorMessage);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';         
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8`}>
        <div className={`flex max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-4' : 'mr-4'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isUser 
                ? 'bg-purple-200' 
                : 'bg-green-200'
            }`}>
              {isUser ? <User className="w-6 h-6 text-purple-700" /> : <Bot className="w-6 h-6 text-green-700" />}
            </div>
          </div>

          {/* Message Content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-6 py-3 rounded-3xl shadow-lg backdrop-blur-sm ${
              isUser 
                ? 'bg-purple-200 text-purple-800 font-medium' 
                : message.error 
                  ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-800 border border-red-200'
                  : 'bg-white/80 text-gray-800 border border-gray-200/50'
            } ${isUser ? 'rounded-br-lg' : 'rounded-bl-lg'}`}>
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 rounded-t-3xl flex-shrink-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Universal AI Assistant
          </h2>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-purple-200 rounded-3xl flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to assist you!</h3>
            <p className="text-gray-600 max-w-md mb-8">
              What's on your mind today?
            </p>
          </div>
        ) : (
          <div>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-8">
                <div className="flex max-w-4xl">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-200 shadow-lg">
                      <Bot className="w-6 h-6 text-green-700" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-3xl rounded-bl-lg border border-gray-200/50 shadow-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 via-blue-50/50 to-purple-50/50 rounded-b-3xl flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything... I'll search documents or use my knowledge!"
              disabled={isLoading}
              className="w-full px-6 py-4 border border-gray-300/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 backdrop-blur-sm shadow-lg text-gray-800 placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-8 py-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5" />
            <span className="font-medium">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;
