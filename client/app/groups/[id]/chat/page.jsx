'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Copy } from 'lucide-react';
import ProfilePicture from '@/components/ProfilePicture';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      username: 'John Doe',
      message: 'Hey everyone! How is the project going?',
      timestamp: new Date('2024-08-03T10:30:00'),
      isCurrentUser: false
    },
    {
      id: 2,
      username: 'You',
      message: 'Going great! Just finished the login component.',
      timestamp: new Date('2024-08-03T10:32:15'),
      isCurrentUser: true
    },
    {
      id: 3,
      username: 'Sarah Smith',
      message: 'Awesome work! I\'ve been working on the database schema. Should be ready for testing soon.',
      timestamp: new Date('2024-08-03T10:35:22'),
      isCurrentUser: false
    },
    {
      id: 4,
      username: 'You',
      message: 'Perfect timing! Let me know when you need help with testing.',
      timestamp: new Date('2024-08-03T10:36:45'),
      isCurrentUser: true
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [showOptions, setShowOptions] = useState(null);
  const messagesEndRef = useRef(null);
  const currentUser = 'You';

  // Mock data for group chat info
  const groupChatInfo = {
    name: 'Project Team Chat',
    membersOnline: 3,
    totalMembers: 5
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const isToday = now.toDateString() === messageDate.toDateString();
    
    if (isToday) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        username: currentUser,
        message: newMessage.trim(),
        timestamp: new Date(),
        isCurrentUser: true
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy message handler
  const handleCopyMessage = (messageId) => {
    setShowOptions(null);
    const message = messages.find(m => m.id === messageId);
    navigator.clipboard.writeText(message.message);
    // You could add a toast notification here
  };

  // Handle double click to copy
  const handleDoubleClick = (messageId) => {
    const message = messages.find(m => m.id === messageId);
    navigator.clipboard.writeText(message.message);
    // You could add a toast notification here
  };

  return (
    <div className="flex flex-col h-full bg-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {groupChatInfo.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-orange-900">
                {groupChatInfo.name}
              </h1>
              <p className="text-sm text-orange-600">
                {groupChatInfo.membersOnline} of {groupChatInfo.totalMembers} members online
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-orange-600 font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 group ${
              message.isCurrentUser ? 'flex-row-reverse space-x-reverse justify-start' : 'justify-start'
            }`}
          >
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <ProfilePicture userName={message.username} size="36" />
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
              message.isCurrentUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
            }`}>
              {/* Username */}
              <div className={`mb-1 ${message.isCurrentUser ? 'text-right' : ''}`}>
                <span className="text-sm font-medium text-orange-800">
                  {message.username}
                </span>
              </div>

              {/* Message Bubble - Enhanced Cloud Style */}
              <div className="relative">
                <div
                  className={`relative px-5 py-3 shadow-lg transform transition-all duration-200 hover:scale-105 cursor-pointer ${
                    message.isCurrentUser
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-3xl rounded-br-lg shadow-orange-200'
                      : 'bg-gradient-to-br from-white to-gray-50 text-orange-900 border border-orange-100 rounded-3xl rounded-bl-lg shadow-gray-200'
                  }`}
                  style={{
                    boxShadow: message.isCurrentUser 
                      ? '0 8px 25px rgba(251, 146, 60, 0.3), 0 3px 10px rgba(251, 146, 60, 0.2)' 
                      : '0 8px 25px rgba(0, 0, 0, 0.1), 0 3px 10px rgba(0, 0, 0, 0.05)'
                  }}
                  onDoubleClick={() => handleDoubleClick(message.id)}
                  title="Double-click to copy message"
                >
                  {/* Cloud-like decorative elements */}
                  <div className={`absolute -top-1 ${message.isCurrentUser ? '-right-1' : '-left-1'} w-3 h-3 rounded-full ${
                    message.isCurrentUser ? 'bg-orange-500' : 'bg-white border border-orange-100'
                  }`}></div>
                  <div className={`absolute -top-2 ${message.isCurrentUser ? 'right-2' : 'left-2'} w-2 h-2 rounded-full ${
                    message.isCurrentUser ? 'bg-orange-400' : 'bg-gray-50 border border-orange-50'
                  }`}></div>
                  
                  <p className="text-sm leading-relaxed break-words relative z-10">
                    {message.message}
                  </p>
                  
                  {/* Subtle inner glow */}
                  <div className={`absolute inset-0 rounded-3xl ${
                    message.isCurrentUser ? 'rounded-br-lg' : 'rounded-bl-lg'
                  } ${
                    message.isCurrentUser 
                      ? 'bg-gradient-to-t from-transparent to-white opacity-10' 
                      : 'bg-gradient-to-t from-transparent to-orange-50 opacity-50'
                  }`}></div>
                </div>

                {/* Direct Copy Button - Right Bottom */}
                <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyMessage(message.id)}
                    className="p-1.5 rounded-full transition-all hover:scale-110 bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                    title="Copy message"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Alternative: Dropdown Copy Option (Less Accessible) */}
                <div className={`absolute top-0 ${
                  message.isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                } opacity-0 group-hover:opacity-100 transition-opacity hidden`}>
                  <div className="relative">
                    <button
                      onClick={() => setShowOptions(showOptions === message.id ? null : message.id)}
                      className="p-1 rounded-full hover:bg-orange-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-orange-600" />
                    </button>

                    {/* Copy Option Dropdown */}
                    {showOptions === message.id && (
                      <div className={`absolute top-8 ${
                        message.isCurrentUser ? 'right-0' : 'left-0'
                      } w-32 bg-white rounded-lg shadow-lg border border-orange-200 py-1 z-10`}>
                        <button
                          onClick={() => handleCopyMessage(message.id)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 w-full text-left"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className={`mt-1 ${message.isCurrentUser ? 'text-right' : ''}`}>
                <span className="text-xs text-orange-500">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-orange-100 border-t border-orange-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 bg-white border border-orange-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none text-orange-900 placeholder-orange-400"
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all ${
              newMessage.trim()
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                : 'bg-orange-200 text-orange-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Typing indicator area */}
        <div className="mt-2 h-4">
          {/* You can add typing indicators here */}
        </div>
      </div>

      {/* Click outside to close options */}
      {showOptions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowOptions(null)}
        />
      )}
    </div>
  );
};

export default ChatPage;