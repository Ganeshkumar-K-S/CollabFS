'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Mock data for group chat info
    const groupChatInfo = {
        name: 'Group Chat',
        membersOnline: onlineCount
    };

    // Get user from localStorage
    useEffect(() => {
        const username = getData('username') || getData('userName') || 'Anonymous';
        const userId = getData('userId') || '';
        console.log('User data loaded:', { username, userId }); // Debug log
        setCurrentUser(username);
        setCurrentUserId(userId);
    }, []);

    // Fetch message history
    const fetchMessageHistory = useCallback(async () => {
        if (!groupId) return;
        
        try {
            setIsLoading(true);
            const httpUrl = apiBaseUrl.replace('ws://', 'http://').replace('wss://', 'https://');
            console.log('Fetching history from:', `${httpUrl}/chat/history/${groupId}`); // Debug log
            
            const res = await fetch(`${httpUrl}/chat/history/${groupId}`, {
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_CHAT_API_KEY || '',
                },
            });
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const history = await res.json();
            const transformed = history.map((msg, i) => ({
                id: msg.id || i + 1,
                userId: msg.user,
                username: msg.username,
                message: msg.message,
                timestamp: msg.timestamp, // Keep ISO format from backend
                isCurrentUser: msg.user === currentUserId,
            }));
            setMessages(transformed);
            setConnectionError(null);
            console.log('Message history loaded:', transformed.length, 'messages'); // Debug log
        } catch (err) {
            console.error('Error fetching message history:', err);
            setConnectionError('Could not load message history: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl, groupId, currentUserId]);

    // Fetch online members
    const fetchOnlineMembers = useCallback(async () => {
        if (!groupId) return;
        
        try {
            const httpUrl = apiBaseUrl.replace('ws://', 'http://').replace('wss://', 'https://');
            const res = await fetch(`${httpUrl}/chat/onlinemembers/${groupId}`, {
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_CHAT_API_KEY || '',
                },
            });
            const json = await res.json();
            setOnlineCount(json.online || 0);
        } catch (err) {
            console.error('Error fetching online members:', err);
            setOnlineCount(0);
        }
    }, [apiBaseUrl, groupId]);

    // Connect WebSocket
    const connectWebSocket = useCallback(() => {
        if (!groupId || !currentUserId) {
            console.log('Cannot connect: missing groupId or currentUserId');
            return;
        }

        // Close existing connection
        if (websocketRef.current) {
            websocketRef.current.close();
        }

        try {
            const wsUrl = `${apiBaseUrl}/chat/ws/${groupId}`;
            console.log('Connecting to WebSocket:', wsUrl); // Debug log
            
            websocketRef.current = new WebSocket(wsUrl);

            websocketRef.current.onopen = () => {
                console.log('WebSocket connected'); // Debug log
                setIsConnected(true);
                setConnectionError(null);
                reconnectAttempts.current = 0;
                fetchOnlineMembers();
                
                // Send user identification if your server expects it
                const identificationMessage = {
                    type: 'identify',
                    user: currentUserId,
                    username: currentUser
                };
                websocketRef.current.send(JSON.stringify(identificationMessage));
            };

            websocketRef.current.onmessage = (event) => {
                try {
                    console.log('Received WebSocket message:', event.data); // Debug log
                    const data = JSON.parse(event.data);
                    
                    // Handle different message types
                    if (data.type === 'message') {
                        console.log('Processing message:', data); // Debug log
                        const msg = {
                            id: data.id || Date.now(),
                            userId: data.user,
                            username: data.username,
                            message: data.message,
                            timestamp: data.timestamp, // ISO format from backend
                            isCurrentUser: data.user === currentUserId,
                        };
                        
                        // Add message to state
                        setMessages((prev) => {
                            // Check if message already exists to prevent duplicates
                            const messageExists = prev.some(m => m.id === msg.id);
                            if (messageExists) {
                                console.log('Duplicate message, skipping:', msg.id);
                                return prev;
                            }
                            console.log('Adding new message to UI:', msg);
                            return [...prev, msg];
                        });
                    } else if (data.type === 'online_count') {
                        console.log('Updating online count:', data.count); // Debug log
                        setOnlineCount(data.count);
                    } else {
                        // Handle legacy format or unknown types
                        console.log('Unknown message type or legacy format:', data);
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err, 'Raw data:', event.data);
                }
            };

            websocketRef.current.onclose = (e) => {
                console.log('WebSocket closed:', e.code, e.reason); // Debug log
                setIsConnected(false);
                
                // Only attempt reconnection if it wasn't a clean close and we haven't exceeded max attempts
                if (e.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000); // Exponential backoff
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connectWebSocket();
                    }, delay);
                } else if (reconnectAttempts.current >= maxReconnectAttempts) {
                    setConnectionError('Connection failed after multiple attempts. Please refresh the page.');
                }
            };

            websocketRef.current.onerror = (error) => {
                console.error('WebSocket error:', error); // Debug log
                setConnectionError('WebSocket connection error. Check server status.');
            };
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setConnectionError('Failed to connect to server: ' + err.message);
        }
    }, [apiBaseUrl, groupId, currentUserId, currentUser, fetchOnlineMembers]);

    // Init
    useEffect(() => {
        if (currentUser && currentUserId && groupId) {
            console.log('Initializing chat for:', { currentUser, currentUserId, groupId }); // Debug log
            fetchMessageHistory();
            connectWebSocket();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (websocketRef.current) {
                websocketRef.current.close(1000, 'Component unmounting');
            }
        };
    }, [groupId, currentUser, currentUserId, fetchMessageHistory, connectWebSocket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Format timestamp - matches backend ISO format
    const formatTimestamp = (timestamp) => {
        try {
            const now = new Date();
            const messageDate = new Date(timestamp);
            
            // Check if the date is valid
            if (isNaN(messageDate.getTime())) {
                return 'Invalid date';
            }
            
            const isToday = now.toDateString() === messageDate.toDateString();
            const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === messageDate.toDateString();
            
            if (isToday) {
                return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (isYesterday) {
                return 'Yesterday ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                return messageDate.toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        } catch (error) {
            console.error('Error formatting timestamp:', error, 'Timestamp:', timestamp);
            return 'Invalid date';
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !websocketRef.current || !isConnected) {
            console.log('Cannot send message:', { 
                hasMessage: !!newMessage.trim(), 
                hasWebSocket: !!websocketRef.current, 
                isConnected 
            });
            return;
        }

        const messageData = {
            type: 'message', // Add message type
            user: currentUserId,
            username: currentUser,
            message: newMessage.trim(),
            timestamp: new Date().toISOString()
        };

        try {
            console.log('Sending message via WebSocket:', messageData); // Debug log
            websocketRef.current.send(JSON.stringify(messageData));
            
            // Don't add message to UI here - wait for server confirmation
            // The server will broadcast the message back to all clients including sender
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
            setConnectionError('Failed to send message. Please try again.');
        }
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
        reconnectAttempts.current = 0;
        connectWebSocket();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-orange-50 items-center justify-center">
                <div className="text-orange-600">
                    Loading chat...
                </div>
            </div>
        );
    }

    if (!currentUserId) {
        return (
            <div className="flex flex-col h-full bg-orange-50 items-center justify-center">
                <div className="text-red-600">
                    User data not found. Please check localStorage for 'username' and 'userId'.
                </div>
            </div>
        );
    }

    if (!groupId) {
        return (
            <div className="flex flex-col h-full bg-orange-50 items-center justify-center">
                <div className="text-red-600">
                    Invalid group ID in URL path.
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
                                <span className="text-sm text-red-600 font-medium">
                                    {reconnectAttempts.current > 0 ? `Reconnecting (${reconnectAttempts.current}/${maxReconnectAttempts})` : 'Disconnected'}
                                </span>
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
                                disabled={!isConnected}
                                className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none text-orange-900 placeholder-orange-400 ${
                                    isConnected
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
                        disabled={!newMessage.trim() || !isConnected}
                        className={`p-3 rounded-full transition-all ${
                            newMessage.trim() && isConnected
                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                                : 'bg-orange-200 text-orange-400 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Status indicator */}
                <div className="mt-2 h-4">
                    {!isConnected && (
                        <div className="text-xs text-orange-600">
                            {reconnectAttempts.current > 0 ? 'Reconnecting...' : 'Connecting...'}
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