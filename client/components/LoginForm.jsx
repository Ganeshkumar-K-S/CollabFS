'use client';

import React , {useState} from 'react';
import { useRouter } from 'next/navigation';
import GoogleIcon from './GoogleIcon'; 
import Divider from './Divider'; 
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  onForgotPassword
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleAuth = () => {
    console.log("Google OAuth2 login");
    // You can add Google auth logic here
    // After successful Google auth, redirect to home
    // router.push('/home');
  };

  const handleEmailLogin = () => {
    console.log("Login:", { email, password });
        
    // Add your login validation/API call here
    // For now, we'll simulate a successful login
    if (email && password) {
      // Simulate API call success
      console.log("Login successful, redirecting to home...");
      router.push('/home');
    } else {
      alert("Please enter both email and password");
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Google OAuth Button */}
      <button
        onClick={handleGoogleAuth}
        className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors justify-center"
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
          className="w-full font-sans px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm"
        />

        {/* Password field with eye icon */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full font-sans px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleForgotPassword}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <button
          onClick={handleEmailLogin}
          disabled={!email || !password}
          className={`w-full py-2 rounded-md text-sm transition-colors ${
            email && password
              ? "bg-black hover:bg-gray-900 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}