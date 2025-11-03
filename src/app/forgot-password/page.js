'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://72.60.219.181:3300/api';
            const res = await fetch(`${apiBase}/password-reset/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.message || 'Failed to send reset link');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
                    <p className="text-gray-600 mt-2">If an account exists for <span className="font-medium">{email}</span>, you'll receive a password reset link shortly.</p>
                    <button onClick={() => router.push('/login')} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Back to login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6">
                <h1 className="text-2xl font-bold text-gray-900 text-center">Forgot Password</h1>
                <p className="text-sm text-gray-600 text-center mt-2">Enter your email and we'll send you a reset link.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Sending…' : 'Send Reset Link'}
                    </button>
                    <div className="text-center">
                        <button type="button" onClick={() => router.push('/login')} className="text-sm text-blue-600 hover:text-blue-800 underline">Back to login</button>
                    </div>
                </form>
            </div>
        </div>
    );
}


