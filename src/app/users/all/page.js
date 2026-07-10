'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../utils/cookies';
import axios from '../../../utils/axiosInstance';
import * as XLSX from 'xlsx';

export default function AllUsers() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    
    // Bulk Enroll Modal States
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [unenrolledUsers, setUnenrolledUsers] = useState([]);
    const [isFetchingUnenrolled, setIsFetchingUnenrolled] = useState(false);
    
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        fetchUsers();
    }, [router]);

    useEffect(() => {
        filterUsers();
        loadStats();
    }, [allUsers, filter, searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/admin/users/all');
            if (data.success) {
                setAllUsers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filteredUsers = [...allUsers];

        // Filter by approval status
        if (filter !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.approval_status === filter);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredUsers = filteredUsers.filter(user =>
                user.name.toLowerCase().includes(term) ||
                user.emailID.toLowerCase().includes(term) ||
                user.username.toLowerCase().includes(term) ||
                user.phoneNumber.includes(term) ||
                (user.gstin && user.gstin.toLowerCase().includes(term))
            );
        }

        setUsers(filteredUsers);
    };

    const loadStats = async () => {
        try {
            setStatsLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            if (filter !== 'all') {
                params.append('approvalStatus', filter);
            }
            const { data } = await axios.get(`/admin/users/stats?${params.toString()}`);
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (!confirm('Delete this user permanently?')) return;
        try {
            const { data } = await axios.delete(`/users/${uid}`);
            if (data.success) {
                setAllUsers(prev => prev.filter(u => u.uid !== uid));
                alert('User deleted');
            } else {
                alert(data.message || 'Failed to delete user');
            }
        } catch (e) {
            console.error('Delete user failed', e);
            alert('Failed to delete user');
        }
    };

    const handleResetPassword = async (uid, newPassword) => {
        try {
            const response = await axios.put(`/admin/users/${uid}/reset-password`, {
                password: newPassword
            });
            if (response.data.success) {
                alert('Password reset successfully');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            alert(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const handleMakeAffiliate = async (uid, name) => {
        if (!confirm(`Make ${name} an affiliate?`)) return;
        try {
            const { data } = await axios.post(`/affiliate/admin/enroll/${uid}`);
            if (data.success) {
                alert(`Successfully enrolled ${name} as an affiliate!`);
            }
        } catch (error) {
            console.error('Error enrolling affiliate:', error);
            alert(error.response?.data?.message || 'Failed to enroll affiliate');
        }
    };

    const handleOpenBulkModal = async () => {
        setIsBulkModalOpen(true);
        setIsFetchingUnenrolled(true);
        try {
            const { data } = await axios.get('/affiliate/admin/enroll-all');
            if (data.success) {
                setUnenrolledUsers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching unenrolled users:', error);
            alert('Failed to fetch unenrolled users.');
            setIsBulkModalOpen(false);
        } finally {
            setIsFetchingUnenrolled(false);
        }
    };

    const handleConfirmBulkEnroll = async () => {
        try {
            const { data } = await axios.post('/affiliate/admin/enroll-all');
            if (data.success) {
                alert(data.message || `Successfully enrolled ${data.count} users!`);
                setIsBulkModalOpen(false);
                // Optionally refresh or reset
            }
        } catch (error) {
            console.error('Error in bulk enroll:', error);
            alert(error.response?.data?.message || 'Failed to enroll users');
        }
    };

    const handleBulkMakeAffiliate = async () => {
        if (!confirm('This will enroll all non-affiliate users into the affiliate program. Proceed?')) return;
        try {
            const { data } = await axios.post('/affiliate/admin/enroll-all');
            if (data.success) {
                alert(data.message || `Successfully enrolled ${data.count} users!`);
            }
        } catch (error) {
            console.error('Error in bulk enroll:', error);
            alert(error.response?.data?.message || 'Failed to enroll users');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const exportToExcel = () => {
        if (users.length === 0) {
            alert('No users to export');
            return;
        }

        // Prepare data for Excel export
        const excelData = users.map((user) => ({
            'UID': user.uid || '',
            'Name': user.name || '',
            'Username': user.username || '',
            'Email': user.emailID || '',
            'Phone Number': user.phoneNumber || '',
            'GSTIN': user.gstin || '',
            'Status': user.approval_status || '',
            'Role': user.role || '',
            'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
            'Approved By': user.approved_by || '',
            'Approved At': user.approved_at ? new Date(user.approved_at).toLocaleDateString() : '',
        }));

        // Create a new workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

        // Set column widths
        const columnWidths = [
            { wch: 15 }, // UID
            { wch: 25 }, // Name
            { wch: 20 }, // Username
            { wch: 30 }, // Email
            { wch: 15 }, // Phone Number
            { wch: 20 }, // GSTIN
            { wch: 12 }, // Status
            { wch: 12 }, // Role
            { wch: 18 }, // Registration Date
            { wch: 20 }, // Approved By
            { wch: 18 }, // Approved At
        ];
        worksheet['!cols'] = columnWidths;

        // Generate filename with current date
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const filename = `user-list-${dateStr}.xlsx`;

        // Write the file
        XLSX.writeFile(workbook, filename);
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="px-4 sm:px-6 py-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">All Users</h1>
                    <p className="text-xs sm:text-sm text-gray-600">Manage all registered users</p>
                </div>
            </header>

            <main className="p-4 sm:p-6">
                {/* Stats Section */}
                {stats && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 sm:mb-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium">Total Users</p>
                                        <p className="text-3xl font-bold mt-2">{stats.total}</p>
                                    </div>
                                    <div className="bg-blue-400/20 rounded-full p-3">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm font-medium">Approved</p>
                                        <p className="text-3xl font-bold mt-2">{stats.approved}</p>
                                    </div>
                                    <div className="bg-green-400/20 rounded-full p-3">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-yellow-100 text-sm font-medium">Pending</p>
                                        <p className="text-3xl font-bold mt-2">{stats.pending}</p>
                                    </div>
                                    <div className="bg-yellow-400/20 rounded-full p-3">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-red-100 text-sm font-medium">Rejected</p>
                                        <p className="text-3xl font-bold mt-2">{stats.rejected}</p>
                                    </div>
                                    <div className="bg-red-400/20 rounded-full p-3">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Active Users</p>
                                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</p>
                                    </div>
                                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Admin Users</p>
                                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.admin}</p>
                                    </div>
                                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Regular Users</p>
                                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.regular}</p>
                                    </div>
                                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-cyan-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Recent (7 days)</p>
                                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.recent}</p>
                                    </div>
                                    <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Users ({users.length})
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleOpenBulkModal}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                    Bulk Make Affiliate
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    disabled={users.length === 0}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Excel
                                </button>
                            </div>
                        </div>

                        {/* Search and Filter Controls */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search users by name, email, username, phone, or GSTIN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Users</option>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {users.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">👥</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                            <p className="text-gray-500">
                                {filter === 'all' ? 'No users have registered yet.' : `No ${filter} users found.`}
                            </p>
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
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registration Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Approved By
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
                                                <div>
                                                    <div className="text-sm text-gray-900">{user.emailID}</div>
                                                    <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                                                    {user.gstin && (
                                                        <div className="text-xs text-gray-400">GSTIN: {user.gstin}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.approval_status)}`}>
                                                    {user.approval_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.approved_by || '-'}
                                                {user.approved_at && (
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(user.approved_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => router.push(`/users/edit/${user.uid}`)}
                                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newPassword = prompt(`Enter new password for ${user.name} (min 6 characters):`);
                                                        if (newPassword) {
                                                            if (newPassword.length < 6) {
                                                                alert('Password must be at least 6 characters long');
                                                                return;
                                                            }
                                                            handleResetPassword(user.uid, newPassword);
                                                        }
                                                    }}
                                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700"
                                                >
                                                    Reset Password
                                                </button>
                                                <button
                                                    onClick={() => handleMakeAffiliate(user.uid, user.name)}
                                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                                                >
                                                    Make Affiliate
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.uid)}
                                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Bulk Enroll Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
                            {/* Close Button */}
                            <button
                                onClick={() => setIsBulkModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Bulk Enroll Affiliates
                                        </h3>
                                        <div className="mt-4">
                                            {isFetchingUnenrolled ? (
                                                <div className="flex justify-center items-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                                    <span className="ml-3 text-gray-600">Fetching users...</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                        Found <strong>{unenrolledUsers.length}</strong> user(s) who are not currently enrolled in the affiliate program.
                                                    </p>
                                                    {unenrolledUsers.length > 0 && (
                                                        <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto border border-gray-200">
                                                            <ul className="text-sm text-gray-700 divide-y divide-gray-200">
                                                                {unenrolledUsers.map(u => (
                                                                    <li key={u.uid} className="py-2 flex justify-between">
                                                                        <span className="font-medium">{u.name}</span>
                                                                        <span className="text-gray-500">{u.emailID}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    disabled={isFetchingUnenrolled || unenrolledUsers.length === 0}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-purple-300"
                                    onClick={handleConfirmBulkEnroll}
                                >
                                    Enroll All
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setIsBulkModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}