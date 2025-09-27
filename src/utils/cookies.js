/**
 * Cookie utility functions for managing authentication tokens
 */

/**
 * Set a cookie with the given name, value, and options
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options (maxAge, path, secure, sameSite)
 */
export const setCookie = (name, value, options = {}) => {
    const {
        maxAge = 3600, // Default 1 hour
        path = '/',
        secure = false, // Set to true in production
        sameSite = 'strict'
    } = options;

    let cookieString = `${name}=${value}; path=${path}; max-age=${maxAge}; samesite=${sameSite}`;

    if (secure) {
        cookieString += '; secure';
    }

    document.cookie = cookieString;
};

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
};

/**
 * Delete a cookie by setting its expiration to the past
 * @param {string} name - Cookie name
 * @param {string} path - Cookie path (default: '/')
 */
export const deleteCookie = (name, path = '/') => {
    document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

/**
 * Set authentication tokens as cookies
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
export const setAuthTokens = (accessToken, refreshToken) => {
    setCookie('_at', accessToken, { maxAge: 604800 }); // 7 days
    setCookie('_rt', refreshToken, { maxAge: 2592000 }); // 30 days
};

/**
 * Get authentication tokens from cookies
 * @returns {Object} - Object containing accessToken and refreshToken
 */
export const getAuthTokens = () => {
    return {
        accessToken: getCookie('_at'),
        refreshToken: getCookie('_rt')
    };
};

/**
 * Clear authentication tokens from cookies
 */
export const clearAuthTokens = () => {
    deleteCookie('_at');
    deleteCookie('_rt');
};

/**
 * Check if user is authenticated (has access token)
 * @returns {boolean} - True if user is authenticated
 */
export const isAuthenticated = () => {
    return getCookie('_at') !== null;
};
