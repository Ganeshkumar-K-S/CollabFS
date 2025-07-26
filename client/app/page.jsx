'use client';

import AuthPage from '@/components/AuthPage';
import Header from '@/components/Header';
import RightSide from '@/components/RightSide';
import React, { useState } from 'react';

export default function CollabFSLanding() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="px-6">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-screen text-black px-4 flex flex-col lg:flex-row items-center justify-center gap-8 max-w-7xl mx-auto lg:items-center lg:justify-center">

            
            {/* Left Side - Auth Page */}
            <div className="flex justify-start lg:justify-center">
              <div className="w-full max-w-md">
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
            </div>

            {/* Right Side - RightSide Component */}
            <div className="flex justify-end lg:justify-center">
              <RightSide />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
