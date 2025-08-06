'use client'
import { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
    isUserLoggedIn, 
    logout, 
    checkSessionActivity,
    refreshUserActivity,
    validateTokenAndAutoLogout 
} from '../utils/localStorage'

// Auth Context
const AuthContext = createContext(null)

export const useAuthGuard = (options = {}) => {
    const {
        redirectPath = '/auth/login',
        checkInterval = 120000, // 2 minutes
        inactivityTimeout = 30, // 30 minutes
        protectedRoutes = [
            '/home',
            '/profile', 
            '/starred',
            '/storage',
            '/groups'
        ],
        publicRoutes = [
            '/auth',
            '/auth/login',
            '/auth/signup',
            '/auth/forgot',
            '/auth/confirm',
            '/auth/change'
        ],
        enableGlobalMonitoring = false
    } = options

    const router = useRouter()
    const pathname = usePathname()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hasInitialized, setHasInitialized] = useState(false)
    const intervalRef = useRef(null)
    const isRedirectingRef = useRef(false) // Prevent multiple redirects

    // Check if current route needs authentication
    const isProtectedRoute = useCallback(() => {
        return protectedRoutes.some(route => pathname.startsWith(route))
    }, [pathname, protectedRoutes])

    const isPublicRoute = useCallback(() => {
        return publicRoutes.some(route => pathname.startsWith(route))
    }, [pathname, publicRoutes])

    const isRootRoute = useCallback(() => {
        return pathname === '/'
    }, [pathname])

    // Auto-logout callback function
    const handleAutoLogout = useCallback(() => {
        console.log('Auto-logout triggered from:', pathname)
        setIsAuthenticated(false)
        
        // Clear any intervals
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        
        // Only redirect if we're not already on a public route and not already redirecting
        if (!isPublicRoute() && !isRedirectingRef.current) {
            isRedirectingRef.current = true
            router.push(redirectPath)
        }
    }, [router, redirectPath, pathname, isPublicRoute])

    // Check authentication status
    const checkAuth = useCallback(() => {
        try {
            const authenticated = validateTokenAndAutoLogout(handleAutoLogout)
            const isActiveSession = checkSessionActivity()
            const finalAuthState = authenticated && isActiveSession
            
            console.log('Auth check result:', { authenticated, isActiveSession, finalAuthState, pathname })
            
            if (authenticated && !isActiveSession) {
                console.log('Token valid but session inactive due to inactivity')
                handleAutoLogout()
                return false
            }
            
            return finalAuthState
        } catch (error) {
            console.error('Error checking authentication:', error)
            logout(handleAutoLogout)
            return false
        }
    }, [handleAutoLogout, pathname])

    // Single redirect function
    const performRedirect = useCallback((targetPath, reason) => {
        if (isRedirectingRef.current) {
            return // Prevent multiple redirects
        }
        
        isRedirectingRef.current = true
        console.log(`Redirecting to ${targetPath} - Reason: ${reason}`)
        
        // Reset the redirect flag after navigation
        setTimeout(() => {
            isRedirectingRef.current = false
        }, 1000)
        
        router.push(targetPath)
    }, [router])

    // Initial auth check and routing logic
    useEffect(() => {
        if (hasInitialized) return

        console.log('Initializing auth check for pathname:', pathname)
        
        const authResult = checkAuth()
        setIsAuthenticated(authResult)
        setIsLoading(false)
        setHasInitialized(true)
        
        // Handle initial routing
        if (authResult) {
            // User is authenticated
            if (isRootRoute()) {
                performRedirect('/home', 'Authenticated user on root - redirecting to home')
            } else if (isPublicRoute()) {
                performRedirect('/home', 'Authenticated user on public route - redirecting to home')
            }
        } else {
            // User is not authenticated
            if (isProtectedRoute() || isRootRoute()) {
                performRedirect(redirectPath, 'Unauthenticated user on protected/root route')
            }
        }
    }, []) // Empty dependency array - only run on mount

    // Handle pathname changes after initialization
    useEffect(() => {
        if (!hasInitialized || isLoading || isRedirectingRef.current) return

        console.log('Pathname changed to:', pathname, 'Auth state:', isAuthenticated)
        
        // Reset redirect flag when pathname changes naturally
        isRedirectingRef.current = false
        
        // Handle routing for pathname changes
        if (isAuthenticated) {
            if (isRootRoute()) {
                performRedirect('/home', 'Authenticated user navigated to root')
            } else if (isPublicRoute()) {
                performRedirect('/home', 'Authenticated user navigated to public route')
            }
        } else {
            if (isProtectedRoute() || isRootRoute()) {
                performRedirect(redirectPath, 'Unauthenticated user navigated to protected/root route')
            }
        }
    }, [pathname, isAuthenticated, hasInitialized, isLoading])

    // Periodic auth check for protected routes or global monitoring
    useEffect(() => {
        if (isAuthenticated && hasInitialized && (isProtectedRoute() || enableGlobalMonitoring)) {
            intervalRef.current = setInterval(() => {
                console.log('Performing periodic auth check on:', pathname)
                const stillAuthenticated = checkAuth()
                if (stillAuthenticated !== isAuthenticated) {
                    setIsAuthenticated(stillAuthenticated)
                }
                if (!stillAuthenticated) {
                    console.log('Periodic check failed - user no longer authenticated')
                }
            }, checkInterval)

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
            }
        }
    }, [isAuthenticated, hasInitialized, checkAuth, checkInterval, isProtectedRoute, enableGlobalMonitoring, pathname])

    // Track user activity on protected routes
    useEffect(() => {
        if (isAuthenticated && hasInitialized && (isProtectedRoute() || enableGlobalMonitoring)) {
            const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
            
            const refreshActivity = () => {
                refreshUserActivity()
            }

            activityEvents.forEach(event => {
                document.addEventListener(event, refreshActivity, { passive: true })
            })

            return () => {
                activityEvents.forEach(event => {
                    document.removeEventListener(event, refreshActivity)
                })
            }
        }
    }, [isAuthenticated, hasInitialized, isProtectedRoute, enableGlobalMonitoring])

    // Listen for storage changes (cross-tab logout)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'jwtToken' && !e.newValue) {
                console.log('Token removed in another tab - logging out')
                handleAutoLogout()
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [handleAutoLogout])

    // Manual logout function
    const logoutUser = useCallback(() => {
        logout(() => {
            setIsAuthenticated(false)
            setHasInitialized(false)
            isRedirectingRef.current = false
            
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            
            router.push(redirectPath)
        })
    }, [router, redirectPath])

    return {
        isAuthenticated,
        isLoading,
        logout: logoutUser,
        checkAuth,
        isProtectedRoute: isProtectedRoute(),
        isPublicRoute: isPublicRoute(),
        isRootRoute: isRootRoute(),
        hasInitialized
    }
}

// Context Provider for Global Auth State
export const AuthProvider = ({ children }) => {
    const auth = useAuthGuard({ 
        enableGlobalMonitoring: true,
        redirectPath: '/auth/login',
        checkInterval: 120000,
        inactivityTimeout: 30,
        protectedRoutes: [
            '/home',
            '/profile', 
            '/starred',
            '/storage',
            '/groups'
        ],
        publicRoutes: [
            '/auth',
            '/auth/login',
            '/auth/signup',
            '/auth/forgot',
            '/auth/confirm',
            '/auth/change'
        ]
    })

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    )
}

// Hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}