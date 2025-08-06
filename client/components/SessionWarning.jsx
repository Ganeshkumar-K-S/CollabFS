// components/SessionWarning.jsx (Optional - Add to AuthMonitor if needed)
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuthGuard'

export default function SessionWarning() {
  const { isAuthenticated, isPublicRoute } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!isAuthenticated || isPublicRoute) return

    const checkSessionWarning = () => {
      const lastActivity = localStorage.getItem('lastActivity')
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity)
        const minutesSinceActivity = timeSinceActivity / (1000 * 60)
        const warningThreshold = 25 // Show warning 5 minutes before 30-minute timeout

        if (minutesSinceActivity >= warningThreshold && minutesSinceActivity < 30) {
          const remainingMinutes = Math.ceil(30 - minutesSinceActivity)
          setTimeLeft(remainingMinutes)
          setShowWarning(true)
        } else {
          setShowWarning(false)
        }
      }
    }

    const interval = setInterval(checkSessionWarning, 30000) // Check every 30 seconds
    checkSessionWarning() // Check immediately

    return () => clearInterval(interval)
  }, [isAuthenticated, isPublicRoute])

  const extendSession = () => {
    localStorage.setItem('lastActivity', Date.now().toString())
    setShowWarning(false)
  }

  if (!showWarning) return null

  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-md p-4 shadow-lg z-50 max-w-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Session Expiring Soon
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''} due to inactivity.
            </p>
          </div>
          <div className="mt-3">
            <button
              onClick={extendSession}
              className="bg-yellow-100 px-3 py-1 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
            >
              Stay Logged In
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setShowWarning(false)}
              className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}