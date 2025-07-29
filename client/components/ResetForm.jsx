'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetForm({
  password,
  setPassword
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if user came from forgot password flow
  const source = searchParams.get('from') || 'none';
  const fromForgot = source === 'forgot';

  useEffect(() => {
    // If not from forgot password, redirect to forgot page
    if (!fromForgot) {
      console.log("Unauthorized access to reset page. Redirecting to forgot password...");
      router.push('/auth/forgot');
      return;
    }
  }, [fromForgot, router]);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    setIsUpdating(true);
    console.log("Updating password:", password);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      console.log("Password updated successfully");
      // Navigate to home page
      router.push('/');
    }, 2000);
  };

  const isFormValid = password && confirmPassword && password === confirmPassword && password.length >= 8;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Reset Your Password</h2>
        <p className="text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

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
              onChange={(e) => setPassword(e.target.value)}
              className="w-full font-sans px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm"
              disabled={isUpdating}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isUpdating}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {password && password.length < 8 && (
            <p className="text-xs text-red-500">Password must be at least 8 characters</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-sm text-gray-900">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full font-sans px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm"
              disabled={isUpdating}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isUpdating}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-500">Passwords don't match</p>
          )}
          {confirmPassword && password === confirmPassword && password.length >= 8 && (
            <p className="text-xs text-green-600">Passwords match!</p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs font-medium text-gray-900 mb-2">Password requirements:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : ''}`}>
              <span className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-green-600' : 'bg-gray-400'}`}></span>
              At least 8 characters
            </li>
            <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
              <span className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-600' : 'bg-gray-400'}`}></span>
              One uppercase letter
            </li>
            <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : ''}`}>
              <span className={`w-1 h-1 rounded-full ${/[a-z]/.test(password) ? 'bg-green-600' : 'bg-gray-400'}`}></span>
              One lowercase letter
            </li>
            <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
              <span className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-600' : 'bg-gray-400'}`}></span>
              One number
            </li>
          </ul>
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
              <Loader2 className="animate-spin h-4 w-4" />
              Updating Password...
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-600">
          Make sure to use a strong password you haven't used before
        </p>
      </div>
    </div>
  );
}