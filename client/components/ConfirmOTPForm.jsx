'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ConfirmOTPForm({
  email
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [step, setStep] = useState('otp'); // 'otp' or 'username'
  const [usernameError, setUsernameError] = useState('');
  
  // Check if coming from signup or login
  const source = searchParams.get('from') || 'none';
  const isFromSignup = source === 'signup';

  useEffect(() => {
    const source = searchParams.get('from');
      if (source !== 'signup') {
          // Redirect to signup if from is missing or incorrect
          router.replace('/auth/signup');
      }
  }, [searchParams, router]);

  useEffect(() => {
    if (timeLeft > 0 && step === 'otp') {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmOTP = async () => {
    console.log("Confirming OTP:", otp, "Source:", source);
    setIsVerifying(true);
    
    try {
      const endpoint = isFromSignup ? '/api/verify-signup-otp' : '/api/verify-login-otp';
      
      // Simulate OTP verification API call
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, otp, source })
      // });
      
      setTimeout(() => {
        setIsVerifying(false);
        console.log("OTP verified successfully, proceeding to username selection...");
        setStep('username'); // Move to username step
      }, 2000);
      
    } catch (error) {
      console.error('OTP verification failed:', error);
      setIsVerifying(false);
      // Handle error (show toast, etc.)
    }
  };

  const validateUsername = (username) => {
    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (username.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const handleCompleteRegistration = async () => {
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    console.log("Creating account with username:", username);
    setIsCreatingAccount(true);
    setUsernameError('');
    
    try {
      // Complete account creation with username
      const endpoint = '/api/complete-registration';
      
      // Simulate account creation API call
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, username, otp })
      // });
      
      setTimeout(() => {
        setIsCreatingAccount(false);
        console.log("Account created successfully, redirecting...");
        router.push('/home');
      }, 2000);
      
    } catch (error) {
      console.error('Account creation failed:', error);
      setIsCreatingAccount(false);
      setUsernameError('Username may be taken. Please try another.');
    }
  };

  const handleResend = async () => {
    console.log("Resending OTP for signup");
    setTimeLeft(120);
    setCanResend(false);
    
    try {
      const endpoint = '/api/resend-signup-otp';
      
      // Add your OTP resend logic here
      // await fetch(endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, source: 'signup' })
      // });
      
      console.log('Signup OTP resent');
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      setTimeLeft(0);
      setCanResend(true);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, ''); // Only allow letters, numbers, underscores
    setUsername(value);
    if (usernameError) {
      setUsernameError(''); // Clear error when user starts typing
    }
  };

  const handleBackToOTP = () => {
    setStep('otp');
    setUsername('');
    setUsernameError('');
  };

  if (step === 'username') {
    return (
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Choose Your Username
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a unique username for your account
          </p>
          <p className="text-sm font-medium text-foreground">{email}</p>
        </div>

        {/* Username Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-foreground">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={handleUsernameChange}
              className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground ${
                usernameError ? 'border-red-500' : 'border-border'
              }`}
              maxLength={20}
            />
            {usernameError && (
              <p className="text-sm text-red-500">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Complete Registration Button */}
          <button
            onClick={handleCompleteRegistration}
            disabled={username.length < 3 || isCreatingAccount}
            className={`w-full py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2 ${
              (username.length >= 3 && !isCreatingAccount)
                ? "bg-black hover:bg-gray-900 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isCreatingAccount ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Complete Registration'
            )}
          </button>

          {/* Back Button */}
          <button
            onClick={handleBackToOTP}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {isFromSignup ? 'Verify Your Email' : 'Verify Your Email'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isFromSignup 
            ? "We've sent a 6-digit verification code to your email"
            : "We've sent a 6-digit verification code to your email"
          }
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
            disabled={!canResend}
            className={`font-medium transition-colors ${
              canResend
                ? "text-primary hover:text-primary/80 cursor-pointer"
                : "text-muted-foreground cursor-not-allowed"
            }`}
          >
            Resend Code
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
            'Verify Code'
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