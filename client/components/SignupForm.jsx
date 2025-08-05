'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import GoogleIcon from './GoogleIcon'; // Adjust path as needed
import Divider from './Divider'; // Adjust path as needed
import { isUserLoggedIn, setUserData, clearAllTempData, clearUserData } from '@/utils/localStorage';
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
  const [validationErrors, setValidationErrors] = useState([]);
  const router = useRouter();
  const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BACKEND_URL || 'http://localhost:8000';
  const API_KEY = process.env.NEXT_PUBLIC_AUTH_API_KEY;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://127.0.0.1:8000';

  // Password validation rules
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Check if user is already logged in on component mount
  useEffect(() => {
    if (isUserLoggedIn()) {
      console.log('User already logged in, redirecting to home');
      router.push('/home');
    }
  }, [router]);

  // Validate form and set errors
  useEffect(() => {
    const errors = [];

    if (email && !email.includes('@')) {
      errors.push('Please enter a valid email address');
    }

    if (username && username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (username && !/^[a-zA-Z0-9_ ]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and spaces');
    }

    if (password && !isPasswordValid) {
      errors.push('Password does not meet all requirements');
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    setValidationErrors(errors);
  }, [email, username, password, confirmPassword, isPasswordValid]);

  const handleGoogleAuth = () => {
    window.location.href = `${AUTH_BASE_URL}/auth/login`;
  };

  const handleSignup = async () => {
    // Clear any existing temporary data
    clearAllTempData();
    
    // Final validation
    if (!email || !password || !username || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (validationErrors.length > 0) {
      setError('Please fix the errors below before continuing');
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
          pwd: password,
          username: username
        })
      });
      
      let signupData;
      try {
        signupData = await signupResponse.json();
      } catch (err) {
        throw new Error("Invalid JSON response from server");
      }

      console.log('Signup API response:', signupData);

      // Handle FastAPI-raised exception
      if (!signupResponse.ok) {
        // If FastAPI sent {"detail": "..."}
        if (signupData.detail) {
          throw new Error(
            typeof signupData.detail === "string"
              ? signupData.detail
              : signupData.detail[0]?.msg || "Signup failed"
          );
        } else {
          throw new Error("Signup failed");
        }
      }

      // Handle returned error (not exception, but a custom error message)
      if (!signupData.success) {
        throw new Error(signupData.message || "User already exists");
      }

      console.log('Signup successful');

      // Store user data from signup response in localStorage
      const userData = {
        email: email,
        username: username,
        hashedPassword: signupData.session_details.hashed_password,
      };

      // Save user data to localStorage
      setUserData(userData);

      // Navigate to confirmation page
      router.push('/auth/confirm?from=signup');

    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Signup failed. Please try again.');
      
      // Clear temporary data and user data on error
      clearAllTempData();
      clearUserData();
    } finally {
      setIsLoading(false);
    }
  };

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

  const isFormValid = email && password && confirmPassword && username && !isLoading && validationErrors.length === 0;

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

        {/* Password Requirements */}
        {password.length > 0 && (
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-xs font-medium text-gray-900 mb-3">Password requirements:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className={`flex items-center gap-2 text-xs transition-colors ${
                passwordValidation.minLength ? 'text-green-600' : 'text-gray-600'
              }`}>
                {passwordValidation.minLength ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                )}
                At least 8 characters
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors ${
                passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-600'
              }`}>
                {passwordValidation.hasUppercase ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                )}
                One uppercase letter (A-Z)
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors ${
                passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-600'
              }`}>
                {passwordValidation.hasLowercase ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                )}
                One lowercase letter (a-z)
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors ${
                passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-600'
              }`}>
                {passwordValidation.hasNumber ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                )}
                One number (0-9)
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors ${
                passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-600'
              }`}>
                {passwordValidation.hasSpecialChar ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                )}
                One special character (!@#$%^&*)
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-800">Please fix the following issues:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-500">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Password Match Indicator */}
        {password && confirmPassword && (
          <div className={`flex items-center gap-2 text-xs ${
            passwordsMatch ? 'text-green-600' : 'text-red-600'
          }`}>
            {passwordsMatch ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span>Passwords match!</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3" />
                <span>Passwords don't match</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}