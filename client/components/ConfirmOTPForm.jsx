'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setUserData, getData, setTempData, getTempData, clearTempData, clearAllTempData } from '../utils/localStorage';

export default function ConfirmOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const source = searchParams.get('from') || 'none';
  const isFromSignup = source === 'signup';

  // API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const AUTH_API_KEY = process.env.NEXT_PUBLIC_AUTH_API_KEY || 'your-api-key';

  // Get email from localStorage
  useEffect(() => {
    const storedEmail = getData('userEmail');
    setEmail(storedEmail);
  }, []);

  useEffect(() => {
    const source = searchParams.get('from');
    if (source !== 'signup') {
      router.replace('/auth/signup');
    }
  }, [searchParams, router]);

  // Send initial OTP when component mounts
  useEffect(() => {
    const sendInitialOTP = async () => {
      try {
        if (!email) {
          console.error('No email found in local storage');
          router.replace('/auth/signup');
          return;
        }

        // Send OTP when component first loads
        await sendOTP(email);
        console.log('Initial OTP sent to:', email);

      } catch (error) {
        console.error('Failed to send initial OTP:', error);
        alert('Failed to send verification code. Please try again.');
        router.replace('/auth/signup');
      }
    };

    // Only send OTP if we're on the signup flow and email is available
    if (isFromSignup && email) {
      sendInitialOTP();
    }
  }, [isFromSignup, router, email]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendOTP = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/email/signup/sendotp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AUTH_API_KEY
        },
        body: JSON.stringify({ email: email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send OTP');
      }

      const data = await response.json();
      console.log('OTP sent successfully:', data.message);
      return data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const handleConfirmOTP = async () => {
    console.log("Confirming OTP:", otp, "Source:", source);
    setIsVerifying(true);
    
    try {
      const signupEmail = getData('userEmail');
      const signupUsername = getData('username');
      const signupHashedPassword = getData('hashedPassword');
      
      if (!signupEmail || !signupUsername || !signupHashedPassword) {
        throw new Error('Signup data not found. Please start signup again.');
      }
      
      // Call the setuserid API endpoint
      const response = await fetch(`${API_BASE_URL}/auth/email/setuserid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AUTH_API_KEY
        },
        body: JSON.stringify({
          email: signupEmail,
          username: signupUsername,
          pwd: signupHashedPassword,
          otp: otp
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'OTP verification failed');
      }

      const data = await response.json();
      
      if (data.success) {
        // Store complete user data in localStorage
        // Based on your backend response structure
        const userData = {
          email: data.email,
          username: data.username,
          hashedPassword: data.hashedPassword,
          jwtToken: data.token
        };
        
        setUserData(userData);
        console.log("Account created successfully, user data stored, redirecting...");
        router.push('/home');
      } else {
        throw new Error(data.message || 'Account creation failed');
      }
      
    } catch (error) {
      console.error('OTP verification and account creation failed:', error);
      setIsVerifying(false);
      
      // Handle error (show toast or alert, but don't redirect back)
      alert(error.message || 'Verification failed. Please try again.');
      
      // Only clear temp data and redirect if it's a critical error (not just wrong OTP)
      if (error.message && error.message.includes('Signup data not found')) {
        clearAllTempData();
        router.push('/auth/signup?error=verification_failed');
      }
    }
  };

  const handleResend = async () => {
    console.log("Resending OTP for signup");
    setIsResending(true);
    
    try {
      // Get email from localStorage
      const signupEmail = getData('userEmail');
      
      if (!signupEmail) {
        throw new Error('Email not found. Please start signup again.');
      }
      
      // Call the send OTP API
      await sendOTP(signupEmail);
      
      // Reset timer and state
      setTimeLeft(120);
      setCanResend(false);
      
      // Store resend attempt
      setTempData('lastOtpResend', Date.now().toString());
      
      console.log('Signup OTP resent to:', signupEmail);
      
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      alert(error.message || 'Failed to resend OTP. Please try again.');
      setTimeLeft(0);
      setCanResend(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Verify Your Email
        </h2>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit verification code to your email
        </p>
        <p className="text-sm font-medium text-foreground">{email}</p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-foreground">Enter Verification Code</label>
          <input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={handleOtpChange}
            className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground text-lg text-center font-mono tracking-widest"
            maxLength={6}
          />
        </div>

        {/* Timer and Resend */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {canResend ? "Didn't receive code?" : `Resend in ${formatTime(timeLeft)}`}
          </span>
          <button
            onClick={handleResend}
            disabled={!canResend || isResending}
            className={`font-medium transition-colors flex items-center gap-1 ${
              (canResend && !isResending)
                ? "text-primary hover:text-primary/80 cursor-pointer"
                : "text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isResending ? (
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
          onClick={handleConfirmOTP}
          disabled={otp.length !== 6 || isVerifying}
          className={`w-full py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2 ${
            (otp.length === 6 && !isVerifying)
              ? "bg-black hover:bg-gray-900 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isVerifying ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Check your spam folder if you don't see the email
        </p>
      </div>
    </div>
  );
}