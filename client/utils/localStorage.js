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
    } catch (error) {
        console.error('Failed to clear user data:', error);
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
            clearUserData(); // Clear invalid token
            return false;
        }
        
        // Try to decode and check expiration
        try {
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < currentTime) {
                console.log('JWT token has expired');
                clearUserData(); // Clear expired token
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