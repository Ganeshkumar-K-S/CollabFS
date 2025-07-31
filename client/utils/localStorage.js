// utils/localStorage.js
export const setUserData = (userData) => {
    if (userData.email) localStorage.setItem('userEmail', userData.email)
    if (userData.username) localStorage.setItem('username', userData.username)
    if (userData.hashedPassword) localStorage.setItem('hashedPassword', userData.hashedPassword)
    if (userData.jwtToken) localStorage.setItem('jwtToken', userData.jwtToken)
}

export const getUserData = () => {
    return {
        email: localStorage.getItem('userEmail') || '',
        username: localStorage.getItem('username') || '',
        hashedPassword: localStorage.getItem('hashedPassword') || '',
        jwtToken: localStorage.getItem('jwtToken') || ''
    }
}

export const updateUserField = (field, value) => {
    localStorage.setItem(field, value)
}

export const clearUserData = () => {
    localStorage.removeItem('userEmail')
    localStorage.removeItem('username')
    localStorage.removeItem('hashedPassword')
    localStorage.removeItem('jwtToken')
}

export const isUserLoggedIn = () => {
    return !!localStorage.getItem('jwtToken')
}

// Temporary storage for password reset/change flows
export const setTempData = (key, value) => {
    localStorage.setItem(`temp_${key}`, value)
}

export const getTempData = (key) => {
    return localStorage.getItem(`temp_${key}`) || ''
}

export const clearTempData = (key) => {
    localStorage.removeItem(`temp_${key}`)
}

export const clearAllTempData = () => {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
        if (key.startsWith('temp_')) {
            localStorage.removeItem(key)
        }
    })
}