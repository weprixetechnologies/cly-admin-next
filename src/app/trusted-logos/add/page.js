'use client';

import { useState } from 'react';
import axiosInstance from '../../../utils/axiosInstance';

const AddTrustedLogoPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        logoUrl: '',
        sortOrder: 0,
        isActive: true
    });
    const [logoFile, setLogoFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // BunnyCDN settings (matching sliders & products)
    const storageZone = 'cly-bunny';
    const storageRegion = 'storage.bunnycdn.com';
    const pullZoneUrl = 'https://cly-pull-bunny.b-cdn.net';
    const apiKey = '22cfd8b3-8021-40a3-b100a9d48bc0-7dc3-4654';

    const generateUniqueId = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${random}`;
    };

    const uploadToBunny = async (file, subFolder) => {
        const fileExtension = file.name.split('.').pop();
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
        const uniqueId = generateUniqueId();
        const uniqueFileName = `${fileNameWithoutExt}-${uniqueId}.${fileExtension}`;
        const safeName = encodeURIComponent(uniqueFileName);

        const path = subFolder ? `${storageZone}/${subFolder}/${safeName}` : `${storageZone}/${safeName}`;
        const uploadUrl = `https://${storageRegion}/${path}`;
        const publicUrl = `${pullZoneUrl}/${subFolder ? `${subFolder}/` : ''}${safeName}`;

        const res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                AccessKey: apiKey,
                'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${errorText}`);
        }

        return publicUrl;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            let finalLogoUrl = formData.logoUrl;

            if (logoFile) {
                finalLogoUrl = await uploadToBunny(logoFile, 'trusted-logos');
            }

            if (!finalLogoUrl) {
                setMessage({ type: 'error', text: 'Please provide a logo image file or image URL.' });
                setLoading(false);
                return;
            }

            await axiosInstance.post('/trusted-logos', {
                name: formData.name,
                logoUrl: finalLogoUrl,
                sortOrder: parseInt(formData.sortOrder) || 0,
                isActive: formData.isActive
            });

            setMessage({ type: 'success', text: 'Company logo added successfully!' });
            setFormData({ name: '', logoUrl: '', sortOrder: 0, isActive: true });
            setLogoFile(null);
        } catch (error) {
            console.error('Error adding trusted logo:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || error.message || 'Failed to add company logo'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-[90%] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Trusted By Company Logo</h1>
                    <p className="text-gray-600">Upload logos for companies/partners displayed in the "Trusted By" carousel</p>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-md ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Company Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Company / Partner Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    id="sortOrder"
                                    name="sortOrder"
                                    value={formData.sortOrder}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">Lower numbers appear first in the carousel.</p>
                            </div>
                        </div>

                        {/* Image Upload / URL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                                    Logo Image URL
                                </label>
                                <input
                                    type="url"
                                    id="logoUrl"
                                    name="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload Image File</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {logoFile && (
                                    <p className="mt-2 text-sm text-gray-600">Selected file: {logoFile.name}</p>
                                )}
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium">
                                Active (Show in homepage Trusted By carousel)
                            </label>
                        </div>

                        {/* Preview */}
                        {(formData.logoUrl || logoFile) && (
                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Image Preview</h3>
                                <div className="w-48 h-24 border rounded-md p-2 flex items-center justify-center bg-gray-50">
                                    <img
                                        src={logoFile ? URL.createObjectURL(logoFile) : formData.logoUrl}
                                        alt="Preview"
                                        className="max-h-full max-w-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => { setFormData({ name: '', logoUrl: '', sortOrder: 0, isActive: true }); setLogoFile(null); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (!logoFile && !formData.logoUrl)}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Add Logo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddTrustedLogoPage;
