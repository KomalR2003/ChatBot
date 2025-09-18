import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText } from 'lucide-react';
import { askQuestion } from '../services/api';

const ChatSection = ({ messages, onAddMessage }) => {
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
    setInput('');
    setIsLoading(true);

    try {
      const response = await askQuestion(input.trim());
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        sources: response.data.sources || []
      };
      onAddMessage(assistantMessage);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
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
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : 'bg-gradient-to-r from-green-500 to-teal-600'
            }`}>
              {isUser ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            </div>
          </div>

          {/* Message Content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-6 py-4 rounded-2xl shadow-sm ${
              isUser 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                : message.error 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-gray-50 text-gray-800'
            } ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}>
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 max-w-md">
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Sources
                    </span>
                  </div>
                  <div className="space-y-1">
                    {message.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Bot className="w-6 h-6 mr-2 text-green-600" />
          Chat with your documents
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about your uploaded PDF documents
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Ready to help!</h3>
            <p className="text-gray-500 max-w-md">
              Upload some PDF documents and start asking questions. I'll help you find information from your documents.
            </p>
          </div>
        ) : (
          <div>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="flex max-w-3xl">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-600">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
      <div className="p-6 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;