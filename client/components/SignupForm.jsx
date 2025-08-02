'use client';

import React, { useState , useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import GoogleIcon from './GoogleIcon'; // Adjust path as needed
import Divider from './Divider'; // Adjust path as needed
import { isUserLoggedIn , setTempData, clearAllTempData } from '@/utils/localStorage';
import { useRouter } from 'next/navigation';

export default function SignupForm({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  username,
  setUsername,
  onConfirm,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const API_KEY = process.env.NEXT_PUBLIC_AUTH_API_KEY;

  // Check if user is already logged in on component mount
  useEffect(() => {
    if (isUserLoggedIn()) {
      console.log('User already logged in, redirecting to home');
      router.push('/home');
    }
  }, [router]);

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/auth/login`;
  };

  const handleSignup = async () => {
    // Clear any existing temporary data
    clearAllTempData();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!email || !password || !username) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Check if user exists and get session details
      const signupResponse = await fetch(`${API_BASE_URL}/auth/email/signup`, {
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

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupData.detail || 'Signup failed');
      }

      if (!signupData.success) {
        throw new Error(signupData.message || 'User already exists');
      }

      // Step 2: Send OTP
      const otpResponse = await fetch(`${API_BASE_URL}/auth/email/signup/sendotp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          email: email
        })
      });

      if (!otpResponse.ok) {
        const otpError = await otpResponse.json();
        throw new Error(otpError.detail || 'Failed to send OTP');
      }

      console.log('OTP sent successfully');

      // Store temporary signup data using localStorage utilities
      setTempData('signup_email', email);
      setTempData('signup_password', password);
      setTempData('signup_username', username);
      setTempData('signup_hashed_password', signupData.session_details.hashed_password);
      setTempData('signup_timestamp', Date.now().toString());

      // Prepare temp data object for the callback
      const tempSignupData = {
        email: email,
        pwd: password,
        username: username,
        hashedPassword: signupData.session_details.hashed_password,
        timestamp: Date.now()
      };

      console.log('Temporary signup data stored in localStorage');

      // Pass this data to the next step (OTP verification)
      if (onConfirm) {
        onConfirm(tempSignupData);
      }

    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Signup failed. Please try again.');
      // Clear temporary data on error
      clearAllTempData();
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up temporary data when component unmounts (optional)
  React.useEffect(() => {
    return () => {
      // Optional: Clear temp data on component unmount
      // You might want to keep this data for the OTP verification step
      // clearAllTempData();
    };
  }, []);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) setError('');
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (error) setError('');
  };

  const isFormValid = email && password && confirmPassword && username && !isLoading;

  return (
    <div className="w-full max-w-md text-gray-900 font-sans">
      <div className="bg-white rounded-xl border border-gray-300 p-6 space-y-6 text-left">
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
          className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : (
            <GoogleIcon />
          )}
          <span className="text-sm">
            {isLoading ? 'Signing up...' : 'Continue with Google'}
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
            className="w-full font-sans px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={handleUsernameChange}
            disabled={isLoading}
            className="w-full font-sans px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Password field with eye icon */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              className="w-full font-sans px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Confirm Password field with eye icon */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isLoading}
              className="w-full font-sans px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={handleSignup}
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
                <span>Signing Up...</span>
              </div>
            ) : (
              'Sign Up'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}