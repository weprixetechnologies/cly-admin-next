'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';

export default function AddUser() {
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        emailID: '',
        phoneNumber: '',
        gstin: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        status: 'active'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess('');
    };

    const togglePasswordVisibility = (field) => {
        if (field === 'password') {
            setShowPassword(!showPassword);
        } else {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        try {
            // Generate UID
            const uid = `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const userData = {
                ...formData,
                uid,
                outstanding: 0.00
            };

            // Remove confirmPassword from the data
            delete userData.confirmPassword;

            const response = await axiosInstance.post('/auth/register/user', userData);

            setSuccess('User created successfully!');
            setTimeout(() => {
                router.push('/users/all');
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create user');
        } finally {
            setIsLoading(false);
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

    return (
        <>
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-800">Add User</h1>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">User Information</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-[#c0c0c0]"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>

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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-[#c0c0c0]"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="emailID" className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    id="emailID"
                                    name="emailID"
                                    value={formData.emailID}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-[#c0c0c0]"
                                    placeholder="Enter email address"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-[#c0c0c0]"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-[#c0c0c0]"
                                    placeholder="Enter GSTIN number"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 bg-white"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 bg-white"
                                >
                                    <option value="active" className="text-slate-800">Active</option>
                                    <option value="inactive" className="text-slate-800">Inactive</option>
                                    <option value="banned" className="text-slate-800">Banned</option>
                                </select>
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-[#c0c0c0]"
                                        placeholder="Enter password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('password')}
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

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-[#c0c0c0]"
                                        placeholder="Confirm password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirmPassword')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? (
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
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-400"
                            >
                                {isLoading ? 'Creating User...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
