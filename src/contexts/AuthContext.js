'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthTokens, clearAuthTokens, isAuthenticated } from '../utils/cookies';
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
    const router = useRouter();

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            // Check if both access token and refresh token cookies are present
            const tokens = getAuthTokens();

            if (tokens.accessToken && tokens.refreshToken) {
                setIsAuthenticatedState(true);
                // You can optionally decode the token to get user info without API call
                // For now, just set authenticated state
            } else {
                setIsAuthenticatedState(false);
                setUser(null);
            }
        } catch (error) {
            setIsAuthenticatedState(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.post('/auth/login/admin', {
                emailID: email,
                password: password
            });

            // Store tokens in cookies
            const { setAuthTokens } = await import('../utils/cookies');
            setAuthTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);

            // Set user data
            setUser(response.data.user || response.data);
            setIsAuthenticatedState(true);

            return { success: true, data: response.data };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setIsLoading(true);
            const response = await fetch('https://api.cursiveletters.in/api/auth/register/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success === true) {
                return { success: true, data: data };
            } else {
                return {
                    success: false,
                    error: data.message || 'Registration failed'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: 'Registration failed'
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        clearAuthTokens();
        setUser(null);
        setIsAuthenticatedState(false);
        router.push('/login');
    };

    const refreshUser = async () => {
        try {
            const response = await axiosInstance.get('/auth/profile');
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to refresh user:', error);
            logout();
            throw error;
        }
    };

    const setAuthenticated = (userData) => {
        setUser(userData);
        setIsAuthenticatedState(true);
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: isAuthenticatedState,
        login,
        register,
        logout,
        refreshUser,
        checkAuthStatus,
        setAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
