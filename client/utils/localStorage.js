// utils/localStorage.js

export const setUserData = (userData) => {
    try {
        if (userData.email) localStorage.setItem('userEmail', userData.email)
        if (userData.username) localStorage.setItem('username', userData.username)
        if (userData.hashedPassword) localStorage.setItem('hashedPassword', userData.hashedPassword)
        if (userData.jwtToken) localStorage.setItem('jwtToken', userData.jwtToken)
        if(userData.id) localStorage.setItem('userId', userData.id);
        if(userData.otp) localStorage.setItem('otp', userData.otp);
        console.log('User data saved to localStorage:', userData);
    } catch (error) {
        console.error('Failed to save user data to localStorage:', error);
    }
}

export const getUserData = () => {
    try {
        return {
            email: localStorage.getItem('userEmail') || '',
            username: localStorage.getItem('username') || '',
            hashedPassword: localStorage.getItem('hashedPassword') || '',
            jwtToken: localStorage.getItem('jwtToken') || '',
            id: localStorage.getItem('userId') || ''
        }
    } catch (error) {
        console.error('Failed to get user data from localStorage:', error);
        return {
            email: '',
            username: '',
            hashedPassword: '',
            jwtToken: ''
        };
    }
}

export const updateUserField = (field, value) => {
    try {
        localStorage.setItem(field, value)
    } catch (error) {
        console.error('Failed to update user field:', error);
    }
}

export const clearUserData = () => {
    try {
        localStorage.clear();
        console.log('User data cleared from localStorage');
    } catch (error) {
        console.error('Failed to clear user data:', error);
    }
};

// Enhanced logout function with cleanup and optional callback
export const logout = (callback) => {
    try {
        clearUserData();
        clearAllTempData();
        console.log('User logged out successfully');
        
        // Execute callback if provided (e.g., redirect to auth page)
        if (callback && typeof callback === 'function') {
            callback();
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
};

export const isUserLoggedIn = () => {
    try {
        const token = localStorage.getItem('jwtToken');

        if (!token) {
            console.log('No JWT token found');
            return false;
        }
        
        // Basic JWT structure validation
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.log('Invalid JWT token structure');
            logout(); // Auto-logout on invalid token
            return false;
        }
        
        // Try to decode and check expiration
        try {
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < currentTime) {
                console.log('JWT token has expired - auto-logging out');
                logout(); // Auto-logout on token expiration
                return false;
            }
            
            console.log('User is logged in with valid token');
            return true;
        } catch (decodeError) {
            console.log('Failed to decode JWT token, but token exists');
            // If we can't decode but token exists, assume it's valid
            // Your backend might use a different JWT format
            return true;
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
}

// Enhanced function to check token validity and auto-logout if expired
export const validateTokenAndAutoLogout = (onLogout) => {
    const isValid = isUserLoggedIn();
    
    if (!isValid && onLogout) {
        // Token is invalid/expired, trigger logout callback
        onLogout();
    }
    
    return isValid;
};

// Function to get token expiry time (useful for setting up timers)
export const getTokenExpiryTime = () => {
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) return null;
        
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return null;
        
        const payload = JSON.parse(atob(tokenParts[1]));
        return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
        console.error('Error getting token expiry:', error);
        return null;
    }
};

// Function to get remaining time until token expires (in seconds)
export const getTokenTimeRemaining = () => {
    const expiryTime = getTokenExpiryTime();
    if (!expiryTime) return 0;
    
    const currentTime = Date.now();
    const remainingTime = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
    
    return remainingTime;
};

export const getData = (key) => {
    try {
        return localStorage.getItem(key) || '';
    } catch (error) {
        console.error('Failed to get data from localStorage:', error);
        return '';
    }
}

// Temporary storage for password reset/change flows
export const setTempData = (key, value) => {
    try {
        localStorage.setItem(`temp_${key}`, value)
    } catch (error) {
        console.error('Failed to set temp data:', error);
    }
}

export const getTempData = (key) => {
    try {
        return localStorage.getItem(`temp_${key}`) || ''
    } catch (error) {
        console.error('Failed to get temp data:', error);
        return '';
    }
}

export const clearTempData = (key) => {
    try {
        localStorage.removeItem(`temp_${key}`)
    } catch (error) {
        console.error('Failed to clear temp data:', error);
    }
}

export const clearAllTempData = () => {
    try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
            if (key.startsWith('temp_')) {
                localStorage.removeItem(key)
            }
        })
        console.log('All temporary data cleared');
    } catch (error) {
        console.error('Failed to clear temp data:', error);
    }
}

// Checks if the user is active recently (dummy logic, customize as needed)
export const checkSessionActivity = () => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return false;

    const now = Date.now();
    const diffInMinutes = (now - parseInt(lastActivity)) / (1000 * 60);

    // For example, user is inactive if 30+ minutes passed
    return diffInMinutes < 30;
}

// Refresh activity timestamp (e.g., call on route change or interaction)
export const refreshUserActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
}
