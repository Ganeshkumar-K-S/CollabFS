'use client';

import AuthPage from '@/components/AuthPage';
import Header from '@/components/Header';
import RightSide from '@/components/Carousel';
import React, { useState } from 'react';

export default function CollabFSLanding() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-12">
          
          {/* Left Side - Auth Page */}
          <div className="w-full max-w-md flex justify-center">
            <AuthPage
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              isSignup={isSignup}
              setIsSignup={setIsSignup}
            />
          </div>

          {/* Right Side - Carousel */}
          <div className="w-full max-w-md flex justify-center">
            <RightSide />
          </div>

        </div>
      </main>
    </div>
  );
}
