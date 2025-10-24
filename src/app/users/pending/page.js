'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../utils/cookies';
import axios from '../../../utils/axiosInstance';

export default function PendingUsers() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [actionLoading, setActionLoading] = useState({});
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        fetchPendingUsers();
    }, [router]);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/admin/users/pending');
            if (data.success) {
                setUsers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (uid) => {
        try {
            setActionLoading(prev => ({ ...prev, [uid]: 'approving' }));
            const { data } = await axios.put(`/admin/users/${uid}/approve`);
            if (data.success) {
                setUsers(users.filter(user => user.uid !== uid));
                alert('User approved successfully');
            }
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
        } finally {
            setActionLoading(prev => ({ ...prev, [uid]: false }));
        }
    };

    const handleReject = async (uid) => {
        if (!confirm('Are you sure you want to reject this user?')) return;

        try {
            setActionLoading(prev => ({ ...prev, [uid]: 'rejecting' }));
            const { data } = await axios.put(`/admin/users/${uid}/reject`);
            if (data.success) {
                setUsers(users.filter(user => user.uid !== uid));
                alert('User rejected successfully');
            }
        } catch (error) {
            console.error('Error rejecting user:', error);
            alert('Failed to reject user');
        } finally {
            setActionLoading(prev => ({ ...prev, [uid]: false }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading pending users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-800">Pending User Approvals</h1>
                    <p className="text-sm text-gray-600">Review and approve new user registrations</p>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Pending Users ({users.length})
                        </h2>
                    </div>

                    {users.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">👥</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending users</h3>
                            <p className="text-gray-500">All user registrations have been processed.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registration Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.uid} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        @{user.username}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        UID: {user.uid}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.emailID}</div>
                                                <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                                                {user.gstin && (
                                                    <div className="text-xs text-gray-400">GSTIN: {user.gstin}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleApprove(user.uid)}
                                                        disabled={actionLoading[user.uid]}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {actionLoading[user.uid] === 'approving' ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                Approving...
                                                            </>
                                                        ) : (
                                                            'Approve'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(user.uid)}
                                                        disabled={actionLoading[user.uid]}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {actionLoading[user.uid] === 'rejecting' ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                Rejecting...
                                                            </>
                                                        ) : (
                                                            'Reject'
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
