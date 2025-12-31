'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link');
            router.push('/forgot-password');
            return;
        }
        verifyToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const verifyToken = async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.cursiveletters.in/api';
            const res = await fetch(`${apiBase}/password-reset/verify/${token}`);
            const data = await res.json();
            if (data.success) {
                setTokenValid(true);
                setEmail(data.data.email);
            } else {
                setError(data.message || 'Invalid or expired reset link');
            }
        } catch (e) {
            setError('Failed to verify reset link');
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.cursiveletters.in/api';
            const res = await fetch(`${apiBase}/password-reset/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });
            const data = await res.json();
            if (data.success) {
                router.push('/login');
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (e) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="text-gray-600">Verifying link…</div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="text-red-600 mb-4">{error || 'Invalid or expired reset link'}</div>
                    <button onClick={() => router.push('/forgot-password')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Request new link</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6">
                <h1 className="text-2xl font-bold text-gray-900 text-center">Reset Password</h1>
                <p className="text-sm text-gray-600 text-center mt-2">for <span className="font-medium">{email}</span></p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">New password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                            placeholder="Re-enter new password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Resetting…' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordContent />
        </Suspense>
    );
}


