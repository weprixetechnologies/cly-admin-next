'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthTokens } from '../../utils/cookies';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [fpEmail, setFpEmail] = useState('');
    const [fpLoading, setFpLoading] = useState(false);
    const [fpMessage, setFpMessage] = useState('');
    const router = useRouter();
    const { setAuthenticated } = useAuth();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault(); // ✅ Prevent page reload
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://72.60.219.181:3300/api/auth/login/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailID: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (data.success === true) {
                // Store tokens
                await setAuthTokens(data.tokens.accessToken, data.tokens.refreshToken);

                // Update AuthContext state immediately
                setAuthenticated(data.user);

                // Redirect to dashboard using router
                router.push('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error(error);
            setError('Login failed');
        } finally {
            setIsLoading(false);
        }
    };


    const clearEmail = () => {
        setFormData(prev => ({ ...prev, email: '' }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const testError = () => {
        setError('This is a test error - no API call made');
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Cursive Letters Seller
                    </h1>
                    <p className="text-slate-600 text-sm">
                        Please fill your detail to access your account.
                    </p>
                </div>

                {/* Login Container */}
                <div className="space-y-6">
                    {/* Email/Phone Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                            Enter your Phone/email
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                                placeholder="Enter your Phone/email"
                                required
                            />
                            {formData.email && (
                                <button
                                    type="button"
                                    onClick={clearEmail}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                            Enter Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                                placeholder="Enter Password"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    {/* Test Button - Remove after testing */}
                    {/* <button
                        type="button"
                        onClick={testError}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 mb-2"
                    >
                        Test Error (No API)
                    </button> */}

                    {/* Login Button */}
                    <button
                        type="button"
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>

                    {/* Additional Links */}
                    <div className="flex justify-end text-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForgot((prev) => !prev);
                                setFpMessage('');
                            }}
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            {showForgot ? 'Hide Forgot Password' : 'Forgot Password?'}
                        </button>
                    </div>

                    {showForgot && (
                        <div className="mt-4 border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">Reset your password</h3>
                            {fpMessage && (
                                <div className="text-sm mb-3 px-3 py-2 rounded border" style={{
                                    color: fpMessage.startsWith('Success') ? '#166534' : '#991b1b',
                                    background: fpMessage.startsWith('Success') ? '#dcfce7' : '#fee2e2',
                                    borderColor: fpMessage.startsWith('Success') ? '#86efac' : '#fecaca'
                                }}>
                                    {fpMessage}
                                </div>
                            )}
                            <label className="block text-sm text-slate-700 mb-1">Email address</label>
                            <input
                                type="email"
                                value={fpEmail}
                                onChange={(e) => setFpEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                                placeholder="you@example.com"
                            />
                            <button
                                type="button"
                                disabled={fpLoading}
                                onClick={async () => {
                                    setFpMessage('');
                                    if (!fpEmail.trim()) {
                                        setFpMessage('Please enter your email address');
                                        return;
                                    }
                                    try {
                                        setFpLoading(true);
                                        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://72.60.219.181:3300/api';
                                        const res = await fetch(`${apiBase}/password-reset/request`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: fpEmail.trim() })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setFpMessage('Success: If an account exists, a reset link has been sent.');
                                        } else {
                                            setFpMessage(data.message || 'Failed to send reset link');
                                        }
                                    } catch (e) {
                                        setFpMessage('Something went wrong. Please try again.');
                                    } finally {
                                        setFpLoading(false);
                                    }
                                }}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-md transition-colors"
                            >
                                {fpLoading ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Register Link */}
                <div className="mt-6 text-center">
                    <p className="text-slate-600 text-sm">
                        Don't have an account?{' '}
                        <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                            Register here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
