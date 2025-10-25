'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import axiosInstance from '../../../../utils/axiosInstance';

export default function EditUser() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        emailID: '',
        phoneNumber: '',
        gstin: '',
        outstanding: 0,
        status: 'active',
        role: 'user',
        photo: '',
        approval_status: 'pending'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [userStatistics, setUserStatistics] = useState({
        totalOrders: 0,
        totalOutstanding: 0,
        totalPaid: 0,
        remainingBalance: 0
    });
    const [statisticsLoading, setStatisticsLoading] = useState(false);
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        if (isAuthenticated && params.uid) {
            fetchUser();
            fetchUserOrders();
            fetchUserStatistics();
        }
    }, [isAuthenticated, params.uid]);

    // Debug formData changes
    useEffect(() => {
        console.log('=== FORMDATA CHANGED ===');
        console.log('Current formData:', formData);
        console.log('Photo in formData:', formData.photo);
    }, [formData]);

    const fetchUser = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get(`/admin/users/${params.uid}`);
            const userData = response.data.data;
            console.log('=== INITIAL USER DATA ===');
            console.log('User data from backend:', userData);
            console.log('Photo URL from backend:', userData.photo);
            setUser(userData);
            setFormData({
                name: userData.name || '',
                emailID: userData.emailID || '',
                phoneNumber: userData.phoneNumber || '',
                gstin: userData.gstin || '',
                outstanding: userData.outstanding || 0,
                status: userData.status || 'active',
                role: userData.role || 'user',
                photo: userData.photo || '',
                approval_status: userData.approval_status || 'pending'
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            setError('Failed to load user data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserOrders = async () => {
        try {
            setOrdersLoading(true);
            const response = await axiosInstance.get(`/admin/users/${params.uid}/orders`);
            if (response.data.success) {
                setUserOrders(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching user orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchUserStatistics = async () => {
        try {
            setStatisticsLoading(true);
            const response = await axiosInstance.get(`/admin/users/${params.uid}/statistics`);
            if (response.data.success) {
                setUserStatistics(response.data.data || {
                    totalOrders: 0,
                    totalOutstanding: 0,
                    totalPaid: 0,
                    remainingBalance: 0
                });
            }
        } catch (error) {
            console.error('Error fetching user statistics:', error);
        } finally {
            setStatisticsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess('');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size too large. Maximum size is 5MB.');
                return;
            }

            setSelectedFile(file);
            setError('');
            setSuccess('');

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError('');
        setSuccess('');

        try {
            // Bunny CDN configuration (same as products)
            const storageZone = 'ithyaraa';
            const storageRegion = 'sg.storage.bunnycdn.com';
            const pullZoneUrl = 'https://ithyaraa.b-cdn.net';
            const apiKey = '7017f7c4-638b-48ab-add3858172a8-f520-4b88'; // ⚠️ Dev only

            // Upload function (exactly like products)
            const uploadToBunny = async (file) => {
                const fileName = encodeURIComponent(file.name);
                const uploadUrl = `https://${storageRegion}/${storageZone}/${fileName}`;
                const publicUrl = `${pullZoneUrl}/${fileName}`;

                const res = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                        AccessKey: apiKey,
                        'Content-Type': file.type,
                    },
                    body: file,
                });

                if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
                return { imgUrl: publicUrl, imgAlt: file.name };
            };

            // Upload to Bunny CDN
            const uploadResult = await uploadToBunny(selectedFile);
            const publicUrl = uploadResult.imgUrl;

            console.log('Upload successful! Public URL:', publicUrl);

            // Update user profile with photo URL
            const response = await axiosInstance.put(`/admin/users/${params.uid}`, {
                photo: publicUrl
            });

            if (response.data.success) {
                // Update both formData and user state
                setFormData(prev => ({
                    ...prev,
                    photo: publicUrl
                }));

                setUser(prev => ({
                    ...prev,
                    photo: publicUrl
                }));
                setSuccess('Profile photo uploaded successfully!');
                setSelectedFile(null);
                setPhotoPreview(null);
                // Clear the file input
                const fileInput = document.getElementById('photo-upload');
                if (fileInput) fileInput.value = '';
            } else {
                setError(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            setError(error.message || 'Failed to upload photo');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        // Check authentication status
        console.log('Authentication status:', isAuthenticated);
        console.log('User data:', user);

        try {
            console.log('Sending form data:', formData);
            console.log('Request URL:', `/admin/users/${params.uid}`);
            console.log('Axios instance base URL:', axiosInstance.defaults.baseURL);
            console.log('Axios instance headers:', axiosInstance.defaults.headers);

            const response = await axiosInstance.put(`/admin/users/${params.uid}`, formData);
            console.log('Response received:', response);
            setSuccess('User updated successfully!');
            setTimeout(() => {
                router.push('/users/all');
            }, 2000);
        } catch (error) {
            console.error('Full error object:', error);
            console.error('Error type:', typeof error);
            console.error('Error constructor:', error.constructor.name);
            console.error('Error keys:', Object.keys(error));
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Error response:', error.response);
            console.error('Error config:', error.config);
            console.error('Error request:', error.request);

            let errorMessage = 'Failed to update user';

            if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
                errorMessage = 'Network error. Please check if the server is running.';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Cannot connect to server. Please check if the backend is running.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.status) {
                errorMessage = `Request failed with status ${error.response.status}`;
            } else {
                errorMessage = `Unknown error: ${JSON.stringify(error)}`;
            }

            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
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
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/users/all')}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Edit User</h1>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {/* User Statistics Cards */}
                <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">User Statistics</h2>
                    {statisticsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Orders</p>
                                        <p className="text-2xl font-semibold text-gray-900">{userStatistics.totalOrders}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                                        <p className="text-2xl font-semibold text-gray-900">₹{userStatistics.totalOutstanding.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Paid</p>
                                        <p className="text-2xl font-semibold text-gray-900">₹{userStatistics.totalPaid.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Remaining Balance</p>
                                        <p className="text-2xl font-semibold text-gray-900">₹{userStatistics.remainingBalance.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">User Information</h2>
                        <p className="text-sm text-slate-600">Edit user details below. Email cannot be changed.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* User Info Display */}
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <div className="text-sm text-slate-800 bg-slate-50 px-3 py-2 border border-slate-300 rounded-md font-medium">
                                        {user.username}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <div className="text-sm text-slate-800 bg-slate-50 px-3 py-2 border border-slate-300 rounded-md font-medium">
                                        {user.emailID}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Approval Status</label>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                                            user.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {user.approval_status}
                                        </span>
                                        {user.approved_by && (
                                            <span className="text-xs text-slate-500">
                                                by {user.approved_by}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Photo Section */}
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                            <h3 className="text-lg font-medium text-slate-700 mb-4">Profile Photo</h3>

                            <div className="flex items-start space-x-6">
                                {/* Current Photo Display */}
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300">
                                        {formData.photo ? (
                                            <img
                                                src={formData.photo}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-center">Current Photo</p>
                                    {formData.photo && (
                                        <p className="text-xs text-blue-600 mt-1 text-center break-all">
                                            {formData.photo}
                                        </p>
                                    )}
                                </div>

                                {/* Photo Upload Section */}
                                <div className="flex-1">
                                    <div className="space-y-4">
                                        {/* File Input */}
                                        <div>
                                            <label htmlFor="photo-upload" className="block text-sm font-medium text-slate-700 mb-2">
                                                Upload New Photo
                                            </label>
                                            <input
                                                type="file"
                                                id="photo-upload"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleFileSelect}
                                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                JPEG, PNG, WebP up to 5MB
                                            </p>
                                        </div>

                                        {/* Photo Preview */}
                                        {photoPreview && (
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                                                    <img
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">Preview</p>
                                                    <p className="text-xs text-slate-500">{selectedFile?.name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Button */}
                                        {selectedFile && (
                                            <button
                                                type="button"
                                                onClick={handlePhotoUpload}
                                                disabled={isUploading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-400 text-sm font-medium"
                                            >
                                                {isUploading ? 'Uploading...' : 'Upload Photo'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 placeholder-slate-500"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 placeholder-slate-500"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div>
                                <label htmlFor="gstin" className="block text-sm font-medium text-slate-700 mb-2">
                                    GSTIN
                                </label>
                                <input
                                    type="text"
                                    id="gstin"
                                    name="gstin"
                                    value={formData.gstin}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 placeholder-slate-500"
                                    placeholder="Enter GSTIN number"
                                />
                            </div>

                            <div>
                                <label htmlFor="outstanding" className="block text-sm font-medium text-slate-700 mb-2">
                                    Outstanding Amount
                                </label>
                                <input
                                    type="number"
                                    id="outstanding"
                                    name="outstanding"
                                    value={formData.outstanding || 0}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 placeholder-slate-500"
                                    placeholder="Enter outstanding amount"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 bg-white"
                                >
                                    <option value="user" className="text-slate-800">User</option>
                                    <option value="manager" className="text-slate-800">Manager</option>
                                    <option value="admin" className="text-slate-800">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 bg-white"
                                >
                                    <option value="active" className="text-slate-800">Active</option>
                                    <option value="inactive" className="text-slate-800">Inactive</option>
                                    <option value="banned" className="text-slate-800">Banned</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="approval_status" className="block text-sm font-medium text-slate-700 mb-2">
                                    Approval Status
                                </label>
                                <select
                                    id="approval_status"
                                    name="approval_status"
                                    value={formData.approval_status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 bg-white"
                                >
                                    <option value="pending" className="text-slate-800">Pending</option>
                                    <option value="approved" className="text-slate-800">Approved</option>
                                    <option value="rejected" className="text-slate-800">Rejected</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    Controls whether the user can log in to the system
                                </p>
                            </div>
                        </div>

                        {/* Error and Success Messages */}
                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
                                {success}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => router.push('/users/all')}
                                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-400"
                            >
                                {isSaving ? 'Updating...' : 'Update User'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* User Orders Section */}
                <div className="bg-white rounded-lg shadow mt-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">User Orders</h2>
                        <p className="text-sm text-slate-600">All orders placed by this user</p>
                    </div>

                    {ordersLoading ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading orders...</p>
                        </div>
                    ) : userOrders.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="text-gray-400 text-4xl mb-2">📦</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders</h3>
                            <p className="text-gray-500">This user hasn't placed any orders yet.</p>
                        </div>
                    ) : (
                        <div className="p-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {userOrders.map((order) => (
                                        <tr key={order.orderID} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.orderID}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.orderStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                                                    order.orderStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.orderStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col space-y-1">
                                                    <span className="text-sm text-gray-900">{order.paymentMode}</span>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.payment_status === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : order.payment_status === 'partially_paid'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {order.payment_status === 'paid'
                                                            ? 'PAID'
                                                            : order.payment_status === 'partially_paid'
                                                                ? 'PARTIALLY PAID'
                                                                : 'NOT PAID'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.items} items
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                ₹{order.order_amount || '0.00'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => router.push(`/orders/view/${order.orderID}`)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
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
        </>
    );
}
