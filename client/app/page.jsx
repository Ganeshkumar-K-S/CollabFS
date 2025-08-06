'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserData, clearUserData, isUserLoggedIn } from '../utils/localStorage'

export default function Page() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    const validateAndRedirect = () => {
        try {
            if (isUserLoggedIn()) {
                // User is logged in with valid token, redirect to home
                console.log('Valid token found, redirecting to home')
                router.push('/home')
            } else {
                // Token is invalid, expired, or missing - redirect to auth
                console.log('Invalid or expired token, redirecting to auth')
                router.push('/auth')
            }
        } catch (error) {
            console.error('Error during token validation:', error)
            // On error, clear data and redirect to auth
            clearUserData()
            router.push('/auth')
        } finally {
            setIsLoading(false)
        }
    }

    // Initial token check on component mount
    useEffect(() => {
        validateAndRedirect()
    }, [router])

    // Periodic token expiry check (every 5 minutes)
    useEffect(() => {
        const checkTokenExpiry = () => {
            if (!isUserLoggedIn()) {
                console.log('Token expired during session, logging out')
                router.push('/auth')
            }
        }

        // Check token expiry every 5 minutes (300000ms)
        const interval = setInterval(checkTokenExpiry, 300000)

        // Cleanup interval on component unmount
        return () => clearInterval(interval)
    }, [router])

    // Show loading while checking localStorage
    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-5"></div>
                <p className="text-slate-600 text-base">Loading your account...</p>
            </div>
        )
    }

    return null
}