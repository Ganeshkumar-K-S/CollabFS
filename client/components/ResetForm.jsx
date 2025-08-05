'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setUserData , getTempData , clearAllTempData } from '../utils/localStorage'; // Adjust import based on your temp storage implementation

export default function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // API configuration (same as ForgotForm)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_KEY = process.env.NEXT_PUBLIC_AUTH_API_KEY;
  const [password, setPassword] = useState('');
  // Check if user came from forgot password flow
  const source = searchParams.get('from') || 'none';
  const fromForgot = source === 'forgot';

  useEffect(() => {
    console.log("Checking authorization for reset page...");
    const otpVerified = getTempData('otpVerified');
    const verifiedEmail = getTempData('verifiedEmail');

    if (!fromForgot || !otpVerified || !verifiedEmail) {
      console.log("Unauthorized access to reset page. Missing data:", {
        fromForgot,
        otpVerified,
        verifiedEmail
      });
      router.push('/auth/forgot');
      return;
    }

    // Check if OTP verification is still valid (e.g., within 10 minutes)
    const verifiedAt = getTempData('verifiedAt');
    if (verifiedAt) {
      const timeDiff = Date.now() - parseInt(verifiedAt);
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
      
      if (timeDiff > tenMinutes) {
        console.log("OTP verification expired. Redirecting to forgot password...");
        clearAllTempData();
        router.push('/auth/forgot');
        return;
      }
    }
    
    console.log("Authorization check passed!");
  }, [fromForgot, router, getTempData, clearAllTempData]);

  // API function to update password
  const updatePassword = async (email, otp, newPassword) => {
    try {

      const response = await fetch(`${API_BASE_URL}/auth/updatepassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
          pwd: newPassword
        })
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        throw new Error("Invalid JSON response from server");
      }

      console.log('Update password API response:', responseData);

      if (!response.ok) {
        // Handle FastAPI error response
        if (responseData.detail) {
          throw new Error(
            typeof responseData.detail === "string"
              ? responseData.detail
              : responseData.detail[0]?.msg || "Failed to update password"
          );
        } else {
          throw new Error("Failed to update password");
        }
      }

      return responseData;

    } catch (error) {
      console.error('Update password API error:', error);
      throw error;
    }
  };

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
  const isFormValid = isPasswordValid && passwordsMatch;

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async () => {
    setError('');
    
    try {
      // Final validation
      if (!isPasswordValid) {
        throw new Error("Password doesn't meet all requirements");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      setIsUpdating(true);
      console.log("Updating password...");
      
      // Get reset data from temp storage
      const verifiedEmail = getTempData('verifiedEmail');
      const resetEmail = getTempData('resetEmail');
      const verifiedOtp = getTempData('verifiedOtp');
      
      // Use either verifiedEmail or resetEmail (fallback)
      const emailToUse = verifiedEmail || resetEmail;
      
      console.log("Retrieved temp data for password reset:", {
        verifiedEmail,
        resetEmail,
        emailToUse,
        verifiedOtp
      });
      
      if (!emailToUse || !verifiedOtp) {
        throw new Error("Session expired. Please start the reset process again.");
      }

      // Call the actual API to update password
      console.log("Calling update password API...");
      const response = await updatePassword(emailToUse, verifiedOtp, password);
      
      console.log("Password updated successfully:", response);
      
      setUserData({
        email: emailToUse,
        hashedPassword: response.pwd,
        token: response.token,
        id: response.user_id,
        username: response.username || '' // Assuming username is part of the response
      });

      setSuccess(true);
      
      // Clear all temp data
      clearAllTempData();
      
      // Navigate to home page after showing success message
      setTimeout(() => {
        router.push('/home');
      }, 2000);
      
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackToLogin = () => {
    clearAllTempData();
    router.push('/auth/login');
  };

  // Success state
  if (success) {
    return (
      <div className="space-y-6 font-sans">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Password Updated Successfully!</h2>
          <p className="text-sm text-gray-600">
            Your password has been updated. Redirecting to login...
          </p>
          <div className="flex items-center justify-center mt-4">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Reset Your Password</h2>
        <p className="text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Password Form */}
      <div className="space-y-4">
        {/* New Password */}
        <div className="space-y-2">
          <label className="text-sm text-gray-900">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={handlePasswordChange}
              className={`w-full font-sans px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm ${
                isUpdating ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              disabled={isUpdating}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors ${
                isUpdating ? 'cursor-not-allowed opacity-60' : ''
              }`}
              disabled={isUpdating}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-sm text-gray-900">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className={`w-full font-sans px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm ${
                isUpdating ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              disabled={isUpdating}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors ${
                isUpdating ? 'cursor-not-allowed opacity-60' : ''
              }`}
              disabled={isUpdating}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-500">Passwords don't match</p>
          )}
          {confirmPassword && passwordsMatch && isPasswordValid && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Passwords match!
            </p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-gray-50 rounded-md p-4">
          <p className="text-xs font-medium text-gray-900 mb-3">Password requirements:</p>
          <div className="grid grid-cols-1 gap-2">
            <div className={`flex items-center gap-2 text-xs transition-colors ${
              passwordValidation.minLength ? 'text-green-600' : 'text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                passwordValidation.minLength ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              At least 8 characters
            </div>
            <div className={`flex items-center gap-2 text-xs transition-colors ${
              passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                passwordValidation.hasUppercase ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              One uppercase letter (A-Z)
            </div>
            <div className={`flex items-center gap-2 text-xs transition-colors ${
              passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                passwordValidation.hasLowercase ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              One lowercase letter (a-z)
            </div>
            <div className={`flex items-center gap-2 text-xs transition-colors ${
              passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                passwordValidation.hasNumber ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              One number (0-9)
            </div>
            <div className={`flex items-center gap-2 text-xs transition-colors ${
              passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                passwordValidation.hasSpecialChar ? 'bg-green-600' : 'bg-gray-400'
              }`}></div>
              One special character (!@#$%^&*)
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isUpdating}
          className={`w-full py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2 ${
            isFormValid && !isUpdating
              ? "bg-black hover:bg-gray-900 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
              Updating Password...
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="text-center space-y-2">
        <p className="text-xs text-gray-600">
          Make sure to use a strong password you haven't used before
        </p>
        <button
          onClick={handleBackToLogin}
          disabled={isUpdating}
          className={`text-xs font-medium transition-colors ${
            isUpdating
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}