'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
    getUserData, 
    clearUserData, 
    isUserLoggedIn, 
    performLogout, 
    checkSessionActivity,
    refreshUserActivity 
} from '../utils/localStorage'

export default function Page() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    // Auto-logout callback function
    const handleAutoLogout = useCallback(() => {
        console.log('Auto-logout triggered - redirecting to auth page')
        router.push('/auth')
    }, [router])

    const validateAndRedirect = () => {
        try {
            // Check if user is logged in with callback for auto-logout
            const isValid = isUserLoggedIn(handleAutoLogout)
            
            // Also check session activity (optional - 30 minutes inactivity)
            const isActiveSession = checkSessionActivity(30, handleAutoLogout)
            
            if (isValid && isActiveSession) {
                // User is logged in with valid token, redirect to home
                console.log('Valid token found, redirecting to home')
                router.push('/home')
            } else {
                // Token is invalid, expired, or missing - redirect to auth
                console.log('Invalid, expired token, or inactive session - redirecting to auth')
                router.push('/auth')
            }
        } catch (error) {
            console.error('Error during token validation:', error)
            // On error, clear data and redirect to auth
            performLogout(handleAutoLogout)
        } finally {
            setIsLoading(false)
        }
    }

    // Token expiry and session check
    const checkTokenAndSession = useCallback(() => {
        const isValid = isUserLoggedIn(handleAutoLogout)
        const isActiveSession = checkSessionActivity(30, handleAutoLogout)
        
        if (!isValid || !isActiveSession) {
            console.log('Token expired or session inactive during periodic check')
            // Auto-logout callback will handle the redirect
        }
    }, [handleAutoLogout])

    // Initial token check on component mount
    useEffect(() => {
        validateAndRedirect()
    }, [])

    // Periodic token expiry and session activity check (every 2 minutes)
    useEffect(() => {
        // Check token expiry and session activity every 2 minutes (120000ms)
        const interval = setInterval(checkTokenAndSession, 120000)

        // Cleanup interval on component unmount
        return () => clearInterval(interval)
    }, [checkTokenAndSession])

    // Track user activity to prevent session timeout during active use
    useEffect(() => {
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
        
        const refreshActivity = () => {
            refreshUserActivity()
        }

        // Add event listeners for user activity
        activityEvents.forEach(event => {
            document.addEventListener(event, refreshActivity, true)
        })

        // Cleanup event listeners
        return () => {
            activityEvents.forEach(event => {
                document.removeEventListener(event, refreshActivity, true)
            })
        }
    }, [])

    // Listen for storage changes (if user logs out in another tab)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'jwtToken' && !e.newValue) {
                console.log('Token removed in another tab - logging out')
                router.push('/auth')
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
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