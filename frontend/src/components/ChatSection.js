import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Sparkles, Brain, Zap, BookOpen } from 'lucide-react';
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
        sources: response.data.sources || [],
        responseType: response.data.response_type || 'general'
      };
      onAddMessage(assistantMessage);
    } catch (error) {
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
    
    const getResponseTypeIcon = (responseType) => {
      switch(responseType) {
        case 'document_based':
          return <FileText className="w-4 h-4 text-blue-600" />;
        case 'general_knowledge':
          return <Brain className="w-4 h-4 text-purple-600" />;
        default:
          return <Sparkles className="w-4 h-4 text-green-600" />;
      }
    };

    const getResponseTypeBadge = (responseType) => {
      switch(responseType) {
        case 'document_based':
          return (
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <FileText className="w-3 h-3" />
              <span>From Documents</span>
            </div>
          );
        case 'general_knowledge':
          return (
            <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <Brain className="w-3 h-3" />
              <span>General Knowledge</span>
            </div>
          );
        default:
          return null;
      }
    };
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8`}>
        <div className={`flex max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-4' : 'mr-4'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isUser 
                ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500' 
                : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500'
            }`}>
              {isUser ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            </div>
          </div>

          {/* Message Content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            {/* Response Type Badge */}
            {!isUser && message.responseType && (
              <div className="mb-2">
                {getResponseTypeBadge(message.responseType)}
              </div>
            )}
            
            <div className={`px-6 py-4 rounded-3xl shadow-lg backdrop-blur-sm ${
              isUser 
                ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white' 
                : message.error 
                  ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-800 border border-red-200'
                  : 'bg-white/80 text-gray-800 border border-gray-200/50'
            } ${isUser ? 'rounded-br-lg' : 'rounded-bl-lg'}`}>
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>

            {/* Sources */}
            {/* {message.sources && message.sources.length > 0 && (
              <div className="mt-3 max-w-lg">
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center mb-3">
                    <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Sources Referenced
                    </span>
                  </div>
                  <div className="space-y-2">
                    {message.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 rounded-xl border border-blue-100">
                        📄 {source}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>
      </div>
    );
  };

  const quickPrompts = [
    "What can you help me with?",
    "Explain machine learning",
    "Tell me about recent technology trends",
    "How does AI work?"
  ];

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 flex flex-col h-[700px]">
      {/* Header */}
      <div className="p-8 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 rounded-t-3xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Universal AI Assistant
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            I can answer questions from your uploaded documents or provide general knowledge. Ask me anything!
          </p>
          
          {/* Capability indicators */}
          <div className="flex justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100/50 rounded-full">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Document Search</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100/50 rounded-full">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">AI Knowledge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-bounce"></div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to assist you!</h3>
            <p className="text-gray-600 max-w-md mb-8">
              Ask me questions about your documents or anything else. I combine document knowledge with AI intelligence.
            </p>
            
            {/* Quick prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInput(prompt)}
                  className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 text-sm text-gray-700 hover:text-blue-700 font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
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
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-3xl rounded-bl-lg border border-gray-200/50 shadow-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* <div ref={messagesEndRef} /> */}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 via-blue-50/50 to-purple-50/50 rounded-b-3xl">
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
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
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