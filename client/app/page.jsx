'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    // Functions to handle localStorage
    const setUserData = (userData) => {
        localStorage.setItem('userEmail', userData.email || '')
        localStorage.setItem('username', userData.username || '')
        localStorage.setItem('hashedPassword', userData.hashedPassword || '')
        localStorage.setItem('jwtToken', userData.jwtToken || '')
    }

    const getUserData = () => {
        return {
            email: localStorage.getItem('userEmail') || '',
            username: localStorage.getItem('username') || '',
            hashedPassword: localStorage.getItem('hashedPassword') || '',
            jwtToken: localStorage.getItem('jwtToken') || ''
        }
    }

    const clearUserData = () => {
        localStorage.removeItem('userEmail')
        localStorage.removeItem('username')
        localStorage.removeItem('hashedPassword')
        localStorage.removeItem('jwtToken')
    }

    useEffect(() => {
        // Check if user data exists in localStorage
        const userData = getUserData()
        
        if (userData.jwtToken) {
            // User has a token, redirect to home
            router.push('/home')
        } else {
            // No token found, redirect to auth
            router.push('/auth')
        }
        
        setIsLoading(false)
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