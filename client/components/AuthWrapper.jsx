'use client';

import { usePathname } from 'next/navigation';
import AuthPage from '@/components/AuthPage';
import Header from '@/components/Header';
import Carousel from '@/components/Carousel';
import React, { useState } from 'react';
import TextContent from './TextContent';

export default function AuthWrapper() {
    const pathname = usePathname();
    const currentRoute = pathname.split('/')[2] || 'login';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSignup, setIsSignup] = useState(currentRoute === 'signup');

    return (
        <div className="min-h-screen flex flex-col bg-[#fdfbf7]">
            <Header />
            <main className="flex flex-1 justify-center items-center px-4">
                <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-12">
                    {/* Left Side: TextContent above AuthPage */}
                    <div className="w-full lg:w-1/2 flex flex-col items-center gap-8">
                        <div className="max-w-md w-full">
                            <TextContent />
                        </div>
                        <div className="max-w-md w-full">
                            <AuthPage
                                type={currentRoute}
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

                    {/* Right Side: Carousel (visible on all screens) */}
                    <div className="w-full lg:w-1/2 flex justify-center">
                        <div className="max-w-md w-full">
                            <Carousel />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}