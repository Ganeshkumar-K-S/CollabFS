'use client'

import { useAuth } from '../hooks/useAuthGuard'
import Header from './Header'

export default function AuthMonitor() {
    const { isLoading, isAuthenticated, isProtectedRoute, isPublicRoute, isRootRoute } = useAuth()

    // Don't render anything while loading
    if (isLoading) {
        return null
    }

    // Don't render Header on public routes or root route
    if (isPublicRoute || isRootRoute) {
        return null
    }

    // Show Header only on protected routes when authenticated
    if (isAuthenticated && isProtectedRoute) {
        return <Header />
    }

    // Don't render anything for other cases
    return null
}