'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTempData, setTempData, clearAllTempData } from '../utils/localStorage'; // Adjust import based on your temp storage implementation

export default function ForgotForm() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_KEY = process.env.NEXT_PUBLIC_AUTH_API_KEY;

  const [email, setEmail] = useState('');

  useEffect(() => {
    if (isSubmitted && !isVerified && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, isSubmitted, isVerified]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // API function to send OTP
  const sendOTP = async (emailAddress) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/email/signup/sendotp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({ email: emailAddress })
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        throw new Error("Invalid JSON response from server");
      }

      console.log('Send OTP API response:', responseData);

      if (!response.ok) {
        // Handle FastAPI error response
        if (responseData.detail) {
          throw new Error(
            typeof responseData.detail === "string"
              ? responseData.detail
              : responseData.detail[0]?.msg || "Failed to send OTP"
          );
        } else {
          throw new Error("Failed to send OTP");
        }
      }

      // Check if response indicates success
      if (responseData.message) {
        console.log('OTP sent successfully:', responseData.message);
      }

      return responseData;

    } catch (error) {
      console.error('Send OTP API error:', error);
      throw error;
    }
  };

  // API function to verify OTP (you'll need to create this endpoint in your backend)
  const verifyOTP = async (emailAddress, otpCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/email/verifyotp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({ 
          email: emailAddress,
          otp: otpCode
        })
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        throw new Error("Invalid JSON response from server");
      }

      console.log('Verify OTP API response:', responseData);

      if (!response.ok) {
        // Handle FastAPI error response
        if (responseData.detail) {
          throw new Error(
            typeof responseData.detail === "string"
              ? responseData.detail
              : responseData.detail[0]?.msg || "Invalid verification code"
          );
        } else {
          throw new Error("Invalid verification code");
        }
      }

      return responseData;

    } catch (error) {
      console.error('Verify OTP API error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    console.log("Forgot password for:", email);
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!email || !email.includes('@')) {
        throw new Error("Please enter a valid email address");
      }

      // Clear any existing temp data
      clearAllTempData();

      // Call the actual API to send OTP
      console.log("Sending OTP to email via API...");
      await sendOTP(email);

      // Store email in temp data for the reset flow
      setTempData('resetEmail', email);
      setTempData('otpSentAt', Date.now().toString());

      setIsSubmitted(true);
      setTimeLeft(120);
      setCanResend(false);
      console.log("OTP sent successfully");

    } catch (err) {
      console.error("Send OTP error:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
      // Clear error when user starts typing
      if (error) setError('');
    }
  };

  const handleVerifyOtp = async () => {
    console.log("Verifying OTP:", otp);
    setError('');
    setIsVerifyingOtp(true);

    try {
      if (otp.length !== 6) {
        throw new Error("Please enter a valid 6-digit code");
      }

      // Call the actual API to verify OTP
      console.log("Verifying OTP with server...");
      await verifyOTP(email, otp);

      
      // Store verification status in temp data
      setTempData('otpVerified', 'true');
      setTempData('verifiedAt', Date.now().toString());
      setTempData('verifiedOtp', otp);
      setTempData('verifiedEmail', email);

      console
      setIsVerified(true);
      console.log("OTP verified successfully");

      // Small delay before navigation for better UX
      setTimeout(() => {
        router.push('/auth/change?from=forgot');
      }, 1500);

    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.message || "Verification failed. Please try again.");
      // Clear the OTP field on error so user can try again
      setOtp('');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    console.log("Resending OTP");
    setError('');
    setIsLoading(true);

    try {
      // Call the actual API to resend OTP
      await sendOTP(email);

      setTimeLeft(120);
      setCanResend(false);
      setOtp('');
      
      // Update temp data
      setTempData('otpSentAt', Date.now().toString());
      
      console.log("OTP resent successfully");

    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(err.message || "Failed to resend code. Please try again.");
      setTimeLeft(0);
      setCanResend(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    // Clear any temp data when going back
    clearAllTempData();
    router.push('/auth/login');
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setIsVerified(false);
    setOtp('');
    setTimeLeft(120);
    setCanResend(false);
    setError('');
    // Clear temp data for fresh start
    clearAllTempData();
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Auto-verify when 6 digits are entered (optional UX improvement)
  useEffect(() => {
    if (otp.length === 6 && !isVerifyingOtp && !error && isSubmitted) {
      // Small delay to allow user to see the complete code
      const timer = setTimeout(() => {
        handleVerifyOtp();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [otp, isVerifyingOtp, error, isSubmitted]);

  // Final success state - OTP verified
  if (isVerified) {
    return (
      <div className="space-y-6 font-sans">
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
          <p className="text-sm text-gray-600">
            Redirecting to reset password...
          </p>
          <div className="flex items-center justify-center mt-4">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Forgot Password?</h2>
        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you instructions to reset your password
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Email Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-900">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            disabled={isSubmitted || isLoading}
            className={`w-full font-sans px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm ${
              (isSubmitted || isLoading) ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={(!email || !email.includes('@')) || isSubmitted || isLoading}
          className={`w-full py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2 ${
            (email && email.includes('@') && !isSubmitted && !isLoading)
              ? "bg-black hover:bg-gray-900 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : isSubmitted ? (
            "Code Sent!"
          ) : (
            "Send OTP"
          )}
        </button>
      </div>

      {/* OTP Section - Only visible after email is submitted */}
      {isSubmitted && (
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-gray-900">Verify Your Email</h3>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-900">Enter OTP Code</label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                disabled={isVerifyingOtp}
                className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-lg text-center font-mono tracking-widest ${
                  isVerifyingOtp ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                maxLength={6}
                autoFocus
              />
              {otp.length === 6 && !error && (
                <p className="text-xs text-gray-500 text-center">
                  Verifying automatically...
                </p>
              )}
            </div>

            {/* Timer and Resend */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {canResend ? "Didn't receive code?" : `Resend in ${formatTime(timeLeft)}`}
              </span>
              <button
                onClick={handleResendOtp}
                disabled={!canResend || isLoading}
                className={`font-medium transition-colors flex items-center gap-1 ${
                  (canResend && !isLoading)
                    ? "text-blue-600 hover:text-blue-800 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Resend Code'
                )}
              </button>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isVerifyingOtp}
              className={`w-full py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2 ${
                (otp.length === 6 && !isVerifyingOtp)
                  ? "bg-black hover:bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isVerifyingOtp ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>

            {/* Try Different Email */}
            <button
              onClick={handleTryAgain}
              disabled={isLoading || isVerifyingOtp}
              className={`w-full border border-gray-300 text-gray-900 py-2 rounded-md text-sm transition-colors ${
                (isLoading || isVerifyingOtp)
                  ? 'bg-gray-50 cursor-not-allowed opacity-60'
                  : 'hover:bg-gray-50'
              }`}
            >
              Try Different Email
            </button>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Check your spam folder if you don't see the email
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-600">
          Remember your password? 
          <button 
            onClick={handleBackToSignIn}
            disabled={isLoading || isVerifyingOtp}
            className={`ml-1 font-medium transition-colors ${
              (isLoading || isVerifyingOtp)
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
}