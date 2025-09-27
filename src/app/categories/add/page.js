'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/utils/axiosInstance';

export default function AddCategory() {
    const [formData, setFormData] = useState({
        categoryName: '',
        image: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
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
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }

        try {
            // Bunny CDN configuration (same as products)
            const storageZone = 'cly-images';
            const storageRegion = 'storage.bunnycdn.com';
            const pullZoneUrl = 'https://cly-pull.b-cdn.net';
            const apiKey = 'b4381f39-9ab4-4c9f-989f88a76c2f-809a-4c75';

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

            // Update form data with image URL
            setFormData(prev => ({
                ...prev,
                image: publicUrl
            }));

            setSuccess('Image uploaded successfully!');
            setSelectedFile(null);
            setImagePreview(null);
            // Clear the file input
            const fileInput = document.getElementById('image-upload');
            if (fileInput) fileInput.value = '';
        } catch (error) {
            setError(error.message || 'Failed to upload image');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axiosInstance.post('/categories', formData);

            if (response.data.success) {
                setSuccess('Category created successfully!');
                setTimeout(() => {
                    router.push('/categories/list');
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to create category');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create category');
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
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/categories/list')}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Add Category</h1>
                    </div>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Category Information</h2>
                        <p className="text-sm text-slate-600">Create a new product category below.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Category Image Section */}
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                            <h3 className="text-lg font-medium text-slate-700 mb-4">Category Image</h3>

                            <div className="flex items-start space-x-6">
                                {/* Current Image Display */}
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-200 border-2 border-slate-300">
                                        {formData.image ? (
                                            <img
                                                src={formData.image}
                                                alt="Category"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-center">Category Image</p>
                                </div>

                                {/* Image Upload Section */}
                                <div className="flex-1">
                                    <div className="space-y-4">
                                        {/* File Input */}
                                        <div>
                                            <label htmlFor="image-upload" className="block text-sm font-medium text-slate-700 mb-2">
                                                Upload Category Image
                                            </label>
                                            <input
                                                type="file"
                                                id="image-upload"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleFileSelect}
                                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                JPEG, PNG, WebP up to 5MB
                                            </p>
                                        </div>

                                        {/* Image Preview */}
                                        {imagePreview && (
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 border border-slate-300">
                                                    <img
                                                        src={imagePreview}
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
                                                onClick={handleImageUpload}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                                            >
                                                Upload Image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Name */}
                        <div>
                            <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700 mb-2">
                                Category Name *
                            </label>
                            <input
                                type="text"
                                id="categoryName"
                                name="categoryName"
                                value={formData.categoryName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 placeholder-slate-500"
                                placeholder="Enter category name"
                                required
                            />
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
                                onClick={() => router.push('/categories/list')}
                                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-400"
                            >
                                {isLoading ? 'Creating...' : 'Create Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}