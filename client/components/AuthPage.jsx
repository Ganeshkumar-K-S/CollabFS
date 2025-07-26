'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotForm from './ForgotForm';
import ResetForm from './ResetForm';
import ConfirmOTPForm from './ConfirmOTPForm';

export default function AuthPage(props) {
  const router = useRouter();
  const {
    type,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isSignup,
    setIsSignup,
  } = props;

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
    <div className="w-full max-w-md text-foreground font-sans">
      <div className="bg-white rounded-xl border border-border p-6 space-y-6 text-left">
        {/* Auth Toggle - Only show for login/signup */}
        {showToggle && (
          <div className="flex space-x-1 bg-muted rounded-md p-1">
            <button
              onClick={handleSignInClick}
              className={`flex-1 py-2 px-4 rounded-md text-sm transition-all duration-200 ${
                type === 'login'
                  ? "bg-white text-black shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={handleSignUpClick}
              className={`flex-1 py-2 px-4 rounded-md text-sm transition-all duration-200 ${
                type === 'signup'
                  ? "bg-white text-black shadow"
                  : "text-muted-foreground hover:text-foreground"
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