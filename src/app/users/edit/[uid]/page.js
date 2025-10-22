'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import axiosInstance from '../../../../utils/axiosInstance';

export default function EditUser() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        gstin: '',
        outstanding: '',
        status: 'active',
        role: 'user',
        photo: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        if (isAuthenticated && params.uid) {
            fetchUser();
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
            const response = await axiosInstance.get(`/users/${params.uid}`);
            const userData = response.data.user;
            console.log('=== INITIAL USER DATA ===');
            console.log('User data from backend:', userData);
            console.log('Photo URL from backend:', userData.photo);
            setUser(userData);
            setFormData({
                name: userData.name || '',
                phoneNumber: userData.phoneNumber || '',
                gstin: userData.gstin || '',
                outstanding: userData.outstanding || '',
                status: userData.status || 'active',
                role: userData.role || 'user',
                photo: userData.photo || ''
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            setError('Failed to load user data');
        } finally {
            setIsLoading(false);
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
            const response = await axiosInstance.put(`/users/${params.uid}`, {
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

        try {
            await axiosInstance.put(`/users/${params.uid}`, formData);
            setSuccess('User updated successfully!');
            setTimeout(() => {
                router.push('/users/all');
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update user');
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
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">User Information</h2>
                        <p className="text-sm text-slate-600">Edit user details below. Email cannot be changed.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* User Info Display */}
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    value={formData.outstanding}
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
            </main>
        </>
    );
}
