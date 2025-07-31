// auth/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isUserLoggedIn } from '@/utils/localStorage';

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        // Check if user is already logged in
        if (isUserLoggedIn()) {
            router.push('/home');
        } else {
            router.push('/auth/login');
        }
    }, [router]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
}