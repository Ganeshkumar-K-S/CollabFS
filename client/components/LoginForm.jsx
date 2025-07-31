'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleIcon from './GoogleIcon';
import Divider from './Divider';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthWrapper';

export default function LoginForm({
  onForgotPassword
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get auth state and functions from context
  const {
    email,
    setEmail,
    password,
    setPassword,
    updateUserData,
    clearUserData
  } = useAuth();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const API_KEY = process.env.NEXT_PUBLIC_AUTH_API_KEY;

  const handleGoogleAuth = async () => {
    console.log("Google OAuth2 login");
    setIsLoading(true);
    setError('');
    
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = `${API_BASE_URL}/auth/auth`;
      
    } catch (err) {
      console.error("Google auth error:", err);
      setError("Google authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    console.log("Login:", { email, password });
    setIsLoading(true);
    setError('');
    
    try {
      // Basic validation
      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }
      
      if (!email.includes('@')) {
        throw new Error("Please enter a valid email address");
      }
      
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      
      // Call login API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          email: email,
          pwd: password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store user data in memory and context
      const userData = {
        email: data.session_details.email,
        username: data.session_details.username,
        jwtToken: data.token
      };
      
      updateUserData(userData);
      
      console.log("Login successful, redirecting to home...");
      router.push('/home');
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback (if returned from Google auth)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');
    const username = urlParams.get('username');
    
    if (token && email && username) {
      // Update user data and redirect
      const userData = {
        email: email,
        username: username,
        jwtToken: token
      };
      
      updateUserData(userData);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      router.push('/home');
    }
  }, [router, updateUserData]);

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
    // Clear any existing errors
    setError('');
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  const isFormValid = email && password && !isLoading;

  return (
    <div className="space-y-6 font-sans">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className={`w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-md transition-colors justify-center ${
          isLoading
            ? 'bg-gray-100 cursor-not-allowed opacity-60'
            : 'hover:bg-gray-50'
        }`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        ) : (
          <GoogleIcon />
        )}
        <span className="text-sm">
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </span>
      </button>

      {/* Divider */}
      <Divider />

      {/* Email/Password Form */}
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={handleEmailChange}
          disabled={isLoading}
          className={`w-full font-sans px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm ${
            isLoading ? 'bg-gray-50 cursor-not-allowed' : ''
          }`}
        />

        {/* Password field with eye icon */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
            className={`w-full font-sans px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm ${
              isLoading ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors ${
              isLoading ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleForgotPassword}
            disabled={isLoading}
            className={`text-sm text-gray-600 transition-colors ${
              isLoading
                ? 'cursor-not-allowed opacity-60'
                : 'hover:text-gray-900'
            }`}
          >
            Forgot password?
          </button>
        </div>

        <button
          onClick={handleEmailLogin}
          disabled={!isFormValid}
          className={`w-full py-2 rounded-md text-sm transition-colors ${
            isFormValid
              ? "bg-black hover:bg-gray-900 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}