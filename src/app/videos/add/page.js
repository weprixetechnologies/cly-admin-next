'use client';

import { useState } from 'react';
import axiosInstance from '../../../utils/axiosInstance';

const AddHomepageVideoPage = () => {
    const [title, setTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

    const storageZone = 'cly-bunny';
    const storageRegion = 'storage.bunnycdn.com';
    const pullZoneUrl = 'https://cly-pull-bunny.b-cdn.net';
    const apiKey = '22cfd8b3-8021-40a3-b100a9d48bc0-7dc3-4654'; // ⚠️ Dev only

    const generateRandomAlphanumeric = () => {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const uploadToBunny = async (file) => {
        const originalName = file.name;
        const lastDotIndex = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
        const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

        const randomSuffix = generateRandomAlphanumeric();
        const newFileName = `${nameWithoutExt}_${randomSuffix}${extension}`;
        const fileName = encodeURIComponent(newFileName);

        // Store videos under /videos/ prefix in Bunny storage
        const objectKey = `videos/${fileName}`;
        const uploadUrl = `https://${storageRegion}/${storageZone}/${objectKey}`;
        const publicUrl = `${pullZoneUrl}/${objectKey}`;

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!videoFile) {
            setMessage({ type: 'error', text: 'Please select an MP4 video to upload.' });
            return;
        }

        if (videoFile.type !== 'video/mp4') {
            setMessage({ type: 'error', text: 'Only MP4 videos are allowed.' });
            return;
        }

        if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
            setMessage({ type: 'error', text: 'Video is too large. Maximum size is 100MB.' });
            return;
        }

        setLoading(true);

        try {
            // Upload to Bunny storage
            const videoUrl = await uploadToBunny(videoFile);

            // Save metadata in backend
            await axiosInstance.post('/videos', {
                title: title || null,
                videoUrl,
                isActive,
                sortOrder: Number(sortOrder) || 0
            });

            setMessage({ type: 'success', text: 'Homepage video added successfully!' });
            setTitle('');
            setVideoFile(null);
            setIsActive(true);
            setSortOrder(0);
        } catch (error) {
            console.error('Error adding homepage video:', error);
            const apiMessage = error.response?.data?.message;
            setMessage({
                type: 'error',
                text: apiMessage || error.message || 'Failed to add homepage video.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Homepage Reels</h1>
                    <p className="text-gray-600">
                        Upload portrait MP4 videos (Instagram Reels style) to show on the homepage.
                    </p>
                </div>

                {message.text && (
                    <div
                        className={`mb-6 p-4 rounded-md ${
                            message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title (optional)
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Give this reel a title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Video File (MP4, portrait recommended)
                            </label>
                            <input
                                type="file"
                                accept="video/mp4"
                                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Recommended aspect ratio 9:16 (portrait). Maximum size 100MB.
                            </p>
                            {videoFile && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    id="isActive"
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Active on homepage
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Lower numbers appear first.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setTitle('');
                                    setVideoFile(null);
                                    setIsActive(true);
                                    setSortOrder(0);
                                    setMessage({ type: '', text: '' });
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Uploading...' : 'Add Video'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddHomepageVideoPage;

