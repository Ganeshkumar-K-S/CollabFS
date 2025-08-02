'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isUserLoggedIn, getUserData, setUserData } from '@/utils/localStorage';
import { jwtDecode } from 'jwt-decode';

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isChecking, setIsChecking] = useState(true);
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        const username = searchParams.get('username');

        if (token) {
            try {
                // Decode token and store in localStorage
                const decoded = jwtDecode(token);
                const { id } = decoded;

                setUserData({
                    userEmail: email,
                    username: username,
                    jwtToken: token,
                });

                // Clean up URL
                const cleanPath = window.location.pathname;
                window.history.replaceState({}, document.title, cleanPath);

                setDebugInfo(`Token saved for ${email}`);

                router.replace('/home'); // Go to home
            } catch (err) {
                console.error('JWT decode error:', err);
                router.replace('/auth/login');
            } finally {
                setIsChecking(false);
            }
        } else {
            // No token — fallback
            const userData = getUserData();
            const loggedIn = isUserLoggedIn();

            if (loggedIn) {
                router.replace('/home');
            } else {
                router.replace('/auth/login');
            }

            setDebugInfo(`No token, checking local storage. User: ${userData?.userEmail || 'none'}`);
            setIsChecking(false);
        }
    }, [searchParams, router]);

    if (isChecking) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                    {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-gray-400 mt-2">{debugInfo}</p>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
