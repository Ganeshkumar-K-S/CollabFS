'use client';

import React from "react";

export default function Login_Signup({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isSignup,
  setIsSignup,
}) {
  const handleGoogleAuth = () => {
    console.log("Google OAuth2 login");
  };

  const handleEmailLogin = () => {
    if (isSignup) {
      console.log("Sign up:", { email, password, confirmPassword });
    } else {
      console.log("Login:", { email, password });
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
  };

  return (
    <div className="w-full max-w-md text-foreground font-sans">
      <div className="bg-white rounded-xl border border-border p-6 space-y-6 text-left">
        {/* Auth Toggle */}
        <div className="flex space-x-1 bg-muted rounded-md p-1">
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm transition-all duration-200 ${
              !isSignup
                ? "bg-white text-black shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm transition-all duration-200 ${
              isSignup
                ? "bg-white text-black shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors justify-center"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-muted-foreground">OR</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground text-sm"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground text-sm"
          />

          {isSignup && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground text-sm"
            />
          )}

          {!isSignup && (
            <div className="flex justify-end">
              <button
                onClick={handleForgotPassword}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            onClick={handleEmailLogin}
            className="w-full bg-black hover:bg-gray-900 text-white py-2 rounded-md text-sm transition-colors"
          >
            {isSignup ? 'Sign Up' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
