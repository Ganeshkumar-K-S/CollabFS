'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotForm({
  email,
  setEmail
}) {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

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

  const handleSubmit = () => {
    console.log("Forgot password for:", email);
    setIsSubmitted(true);
    setTimeLeft(120);
    setCanResend(false);
    // Add your forgot password logic here
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleVerifyOtp = () => {
    console.log("Verifying OTP:", otp);
    setIsVerified(true);
    // Navigate to reset password page with proper parameter
    router.push('/auth/change?from=forgot');
  };

  const handleResendOtp = () => {
    console.log("Resending OTP");
    setTimeLeft(120);
    setCanResend(false);
    setOtp('');
    // Add your OTP resend logic here
  };

  const handleBackToSignIn = () => {
    router.push('/auth/login');
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setIsVerified(false);
    setOtp('');
    setTimeLeft(120);
    setCanResend(false);
  };

  // Final success state - OTP verified (optional, since we're navigating)
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
          <h2 className="text-xl font-semibold text-foreground">Email Verified!</h2>
          <p className="text-sm text-muted-foreground">
            Redirecting to reset password...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Forgot Password?</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you instructions to reset your password
        </p>
      </div>

      {/* Email Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-foreground">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitted}
            className={`w-full font-sans px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground text-sm ${
              isSubmitted ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={(!email || !email.includes('@')) || isSubmitted}
          className={`w-full py-2 rounded-md text-sm transition-colors ${
            (email && email.includes('@') && !isSubmitted)
              ? "bg-black hover:bg-gray-900 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitted ? "Code Sent!" : "Send OTP"}
        </button>
      </div>

      {/* OTP Section - Only visible after email is submitted */}
      {isSubmitted && (
        <div className="space-y-4 border-t border-border pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-foreground">Verify Your Email</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-foreground">Enter OTP Code</label>
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
                onClick={handleResendOtp}
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
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className={`w-full py-2 rounded-md text-sm transition-colors ${
                otp.length === 6
                  ? "bg-black hover:bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Verify Code
            </button>

            {/* Try Different Email */}
            <button
              onClick={handleTryAgain}
              className="w-full border border-border hover:bg-muted text-foreground py-2 rounded-md text-sm transition-colors"
            >
              Try Different Email
            </button>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Check your spam folder if you don't see the email
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Remember your password? 
          <button 
            onClick={handleBackToSignIn}
            className="text-primary hover:text-primary/80 ml-1 font-medium"
          >
            Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
}