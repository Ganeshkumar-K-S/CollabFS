'use client';

import React from 'react';
import GoogleIcon from './GoogleIcon'; // Adjust path as needed
import Divider from './Divider'; // Adjust path as needed

export default function SignupForm({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onConfirm,
}) {
  const handleGoogleAuth = () => {
    console.log("Google OAuth2 login");
  };

  const handleSignup = () => {
    console.log("Sign up:", { email, password, confirmPassword });
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <div className="w-full max-w-md text-foreground font-sans">
      <div className="bg-white rounded-xl border border-border p-6 space-y-6 text-left">
        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors justify-center"
        >
          <GoogleIcon />
          <span className="text-sm">Continue with Google</span>
        </button>

        {/* Divider */}
        <Divider />

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

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground text-sm"
          />

          <button
            onClick={handleSignup}
            className="w-full bg-black hover:bg-gray-900 text-white py-2 rounded-md text-sm transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}