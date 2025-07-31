'use client';
import { usePathname } from 'next/navigation';
import AuthPage from '@/components/AuthPage';
import Header from '@/components/Header';
import Carousel from '@/components/Carousel';
import React, { useState, createContext, useContext } from 'react';
import TextContent from './TextContent';

// Create Auth Context for state management
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthWrapper');
  }
  return context;
};

export default function AuthWrapper() {
  const pathname = usePathname();
  const currentRoute = pathname.split('/')[2] || 'login';
  
  // Authentication state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignup, setIsSignup] = useState(currentRoute === 'signup');
  
  // User data state (replaces localStorage)
  const [userData, setUserData] = useState({
    email: '',
    username: '',
    hashedPassword: '',
    jwtToken: ''
  });
  
  // Temporary data for password reset flows
  const [tempData, setTempData] = useState({});
  
  // Helper functions to replace localStorage utilities
  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };
  
  const updateUserField = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };
  
  const clearUserData = () => {
    setUserData({
      email: '',
      username: '',
      hashedPassword: '',
      jwtToken: ''
    });
  };
  
  const isUserLoggedIn = () => {
    return !!userData.jwtToken;
  };
  
  const setTempDataValue = (key, value) => {
    setTempData(prev => ({ ...prev, [key]: value }));
  };
  
  const getTempDataValue = (key) => {
    return tempData[key] || '';
  };
  
  const clearTempDataValue = (key) => {
    setTempData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  };
  
  const clearAllTempData = () => {
    setTempData({});
  };
  
  const authContextValue = {
    // Form state
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isSignup,
    setIsSignup,
    
    // User data
    userData,
    updateUserData,
    updateUserField,
    clearUserData,
    isUserLoggedIn,
    
    // Temp data
    setTempData: setTempDataValue,
    getTempData: getTempDataValue,
    clearTempData: clearTempDataValue,
    clearAllTempData
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Side: TextContent above AuthPage */}
            <div className="space-y-6">
              <div>
                <TextContent />
              </div>
              
              <div>
                <AuthPage 
                  type={currentRoute}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  isSignup={isSignup}
                  setIsSignup={setIsSignup}
                />
              </div>
            </div>
            
            {/* Right Side: Carousel (visible on all screens) */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                <Carousel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthContext.Provider>
  );
}