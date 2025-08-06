'use client'

import { useAuth } from '@/hooks/useAuthGuard'

export default function Page() {
    const { isLoading, isAuthenticated } = useAuth()

    // Show loading state while auth is being determined
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading CollabFS...</h2>
                    <p className="text-gray-600">Checking your session...</p>
                </div>
            </div>
        )
    }

    // Show redirecting state - the useAuthGuard hook will handle the actual redirect
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
                <p className="text-gray-600">
                    {isAuthenticated ? 'Taking you to your dashboard...' : 'Taking you to login...'}
                </p>
            </div>
        </div>
    )
}