'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Wifi, WifiOff } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getData } from '@/utils/localStorage'; // your util
import ProfilePicture from '@/components/ProfilePicture'; // your component

const ChatPage = ({ apiBaseUrl = "ws://localhost:8000" }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showOptions, setShowOptions] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(null);
    const [currentUser, setCurrentUser] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');
    const [onlineCount, setOnlineCount] = useState(0);

    const pathName = usePathname();
    const groupId = pathName.split('/')[2];
    const messagesEndRef = useRef(null);
    const websocketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Mock data for group chat info
    const groupChatInfo = {
        name: 'Group Chat',
        membersOnline: onlineCount
    };

    // Get user from localStorage
    useEffect(() => {
        const username = getData('username') || getData('userName') || 'Anonymous';
        const userId = getData('userId') || '';
        setCurrentUser(username);
        setCurrentUserId(userId);
    }, []);

    // Fetch message history
    const fetchMessageHistory = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${apiBaseUrl.replace('ws://', 'http://')}/chat/history/${groupId}`, {
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_CHAT_API_KEY || '',
                },
            });
            const history = await res.json();
            const transformed = history.map((msg, i) => ({
                id: i + 1,
                userId: msg.user,
                username: msg.username,
                message: msg.message,
                timestamp: msg.timestamp,
                isCurrentUser: msg.user === currentUserId,
            }));
            setMessages(transformed);
            setConnectionError(null);
        } catch (err) {
            setConnectionError('Could not load message history.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch online members
    const fetchOnlineMembers = async () => {
        try {
            const res = await fetch(`${apiBaseUrl.replace('ws://', 'http://')}/chat/onlinemembers/${groupId}`, {
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_CHAT_API_KEY || '',
                },
            });
            const json = await res.json();
            setOnlineCount(json.online);
        } catch {
            setOnlineCount(0);
        }
    };

    // Connect WebSocket
    const connectWebSocket = () => {
        try {
            const wsUrl = `${apiBaseUrl}/chat/ws/${groupId}`;
            websocketRef.current = new WebSocket(wsUrl);

            websocketRef.current.onopen = () => {
                setIsConnected(true);
                setConnectionError(null);
                fetchOnlineMembers();
            };

            websocketRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const isSelf = data.user === currentUserId;
                    if (!isSelf) {
                        const msg = {
                            id: Date.now(),
                            userId: data.user,
                            username: data.username,
                            message: data.message,
                            timestamp: new Date(),
                            isCurrentUser: false,
                        };
                        setMessages((prev) => [...prev, msg]);
                    }
                } catch (err) {
                    console.error('Failed to parse message:', err);
                }
            };

            websocketRef.current.onclose = (e) => {
                setIsConnected(false);
                if (e.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
                }
            };

            websocketRef.current.onerror = () => {
                setConnectionError('WebSocket connection error.');
            };
        } catch {
            setConnectionError('Failed to connect to server.');
        }
    };

    // Init
    useEffect(() => {
        if (currentUser && currentUserId) {
            fetchMessageHistory();
            connectWebSocket();
        }

        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (websocketRef.current) websocketRef.current.close(1000, 'Unmount');
        };
    }, [groupId, currentUser, currentUserId]);

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

    const handleSendMessage = () => {
        if (!newMessage.trim() || !websocketRef.current || !isConnected) return;
        const data = {
            user: currentUserId,
            username: currentUser,
            message: newMessage.trim(),
        };

        const msg = {
            id: Date.now(),
            userId: currentUserId,
            username: currentUser,
            message: newMessage.trim(),
            timestamp: new Date(),
            isCurrentUser: true,
        };

        websocketRef.current.send(JSON.stringify(data));
        setMessages((prev) => [...prev, msg]);
        setNewMessage('');
    };

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
        if (message && navigator.clipboard) {
            navigator.clipboard.writeText(message.message).then(() => {
                console.log('Message copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy message:', err);
            });
        }
    };

    // Handle double click to copy
    const handleDoubleClick = (messageId) => {
        handleCopyMessage(messageId);
    };

    // Retry connection
    const retryConnection = () => {
        setConnectionError(null);
        connectWebSocket();
    };

    if (isLoading || !currentUserId) {
        return (
            <div className="flex flex-col h-full bg-orange-50 items-center justify-center">
                <div className="text-orange-600">
                    {!currentUserId ? 'Loading user data...' : 'Loading chat history...'}
                </div>
            </div>
        );
    }

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
                                {onlineCount} online • Logged in as {currentUser}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isConnected ? (
                            <>
                                <Wifi className="w-4 h-4 text-green-500" />
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-600 font-medium">Connected</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-red-500" />
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-sm text-red-600 font-medium">Disconnected</span>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Connection Error Banner */}
                {connectionError && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg flex items-center justify-between">
                        <span className="text-red-700 text-sm">{connectionError}</span>
                        <button
                            onClick={retryConnection}
                            className="text-red-700 text-sm underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}
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
                                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                                rows={1}
                                disabled={!isConnected || !currentUserId}
                                className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none text-orange-900 placeholder-orange-400 ${
                                    isConnected && currentUserId
                                        ? 'bg-white border-orange-300' 
                                        : 'bg-gray-100 border-gray-300 cursor-not-allowed'
                                }`}
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
                        disabled={!newMessage.trim() || !isConnected || !currentUserId}
                        className={`p-3 rounded-full transition-all ${
                            newMessage.trim() && isConnected && currentUserId
                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                                : 'bg-orange-200 text-orange-400 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Status indicator */}
                <div className="mt-2 h-4">
                    {!isConnected && currentUserId && (
                        <div className="text-xs text-orange-600">
                            Reconnecting...
                        </div>
                    )}
                    {!currentUserId && (
                        <div className="text-xs text-red-600">
                            Username not found in localStorage
                        </div>
                    )}
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