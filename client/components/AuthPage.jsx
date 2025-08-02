'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotForm from './ForgotForm';
import ResetForm from './ResetForm';
import ConfirmOTPForm from './ConfirmOTPForm';
import { useAuth } from './AuthWrapper'; // Import the auth context

export default function AuthPage(props) {
  const router = useRouter();
  const auth = useAuth(); 
  const {
    type,
  } = props;

  // Get auth state from context
  const {
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isSignup,
    setIsSignup,
  } = auth;

  const handleSignInClick = () => {
    setIsSignup(false);
    router.push('/auth/login');
  };

  const handleSignUpClick = () => {
    setIsSignup(true);
    router.push('/auth/signup');
  };

  const handleForgotPasswordClick = () => {
    router.push('/auth/forgot');
  };

  const handleConfirmClick = () => {
    router.push('/auth/confirm?from=signup');
  };

  // Show toggle buttons for login and signup pages only
  const showToggle = type === 'login' || type === 'signup';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        
        {/* Auth Toggle - Only show for login/signup */}
        {showToggle && (
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleSignInClick}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isSignup
                  ? 'bg-white text-gray-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={handleSignUpClick}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isSignup
                  ? 'bg-white text-gray-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Render appropriate form based on type */}
        {type === 'login' && (
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onForgotPassword={handleForgotPasswordClick}
          />
        )}

        {type === 'signup' && (
          <SignupForm
            email={email}
            setEmail={setEmail}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            onConfirm={handleConfirmClick}
          />
        )}

        {type === 'forgot' && (
          <ForgotForm
            email={email}
            setEmail={setEmail}
          />
        )}

        {type === 'change' && (
          <ResetForm
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
          />
        )}

        {type === 'confirm' && (
          <ConfirmOTPForm
            email={email}
          />
        )}
      </div>
    </div>
  );
}