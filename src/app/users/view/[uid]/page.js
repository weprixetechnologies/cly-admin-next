'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import axiosInstance from '../../../../utils/axiosInstance';

export default function ViewUser() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        if (isAuthenticated && params.uid) {
            fetchUser();
        }
    }, [isAuthenticated, params.uid]);

    const fetchUser = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get(`/users/${params.uid}`);
            setUser(response.data.user);
        } catch (error) {
            console.error('Error fetching user:', error);
            setError('Failed to load user data');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            banned: 'bg-red-100 text-red-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    };

    const getRoleBadge = (role) => {
        const roleClasses = {
            admin: 'bg-purple-100 text-purple-800',
            manager: 'bg-blue-100 text-blue-800',
            user: 'bg-gray-100 text-gray-800'
        };
        return roleClasses[role] || 'bg-gray-100 text-gray-800';
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/users/all')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
                    <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push('/users/all')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/users/all')}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800">User Details</h1>
                        </div>
                        <button
                            onClick={() => router.push(`/users/edit/${user.uid}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Edit User
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white rounded-lg shadow">
                    {/* User Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 h-16 w-16">
                                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-2xl font-medium text-gray-700">
                                        {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{user.name || 'N/A'}</h2>
                                <p className="text-slate-600">@{user.username}</p>
                                <div className="flex space-x-2 mt-2">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                    </span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                                        {user.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Username</dt>
                                        <dd className="text-sm text-gray-900">{user.username}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Email</dt>
                                        <dd className="text-sm text-gray-900">{user.emailID}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Phone Number</dt>
                                        <dd className="text-sm text-gray-900">{user.phoneNumber || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">GSTIN</dt>
                                        <dd className="text-sm text-gray-900">{user.gstin || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Account Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Role</dt>
                                        <dd className="text-sm text-gray-900">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Status</dt>
                                        <dd className="text-sm text-gray-900">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Outstanding Amount</dt>
                                        <dd className="text-sm text-gray-900">₹{user.outstanding || 0}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Last Login</dt>
                                        <dd className="text-sm text-gray-900">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Created At</dt>
                                    <dd className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleString()}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Last Updated</dt>
                                    <dd className="text-sm text-gray-900">{new Date(user.updatedAt).toLocaleString()}</dd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
