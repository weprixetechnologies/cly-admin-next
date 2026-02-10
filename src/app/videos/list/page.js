'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '../../../utils/axiosInstance';

const ListHomepageVideosPage = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [previewVideo, setPreviewVideo] = useState(null);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await axiosInstance.get('/videos');
            setVideos(res.data?.data || []);
        } catch (err) {
            console.error('Error fetching homepage videos:', err);
            setError('Failed to load videos. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleToggleActive = async (video) => {
        try {
            setActionMessage('');
            await axiosInstance.put(`/videos/${video.videoID}`, {
                isActive: !video.isActive
            });
            setActionMessage('Status updated.');
            setVideos((prev) =>
                prev.map((v) =>
                    v.videoID === video.videoID ? { ...v, isActive: !video.isActive } : v
                )
            );
        } catch (err) {
            console.error('Error updating video status:', err);
            setActionMessage('Failed to update status.');
        }
    };

    const handleDelete = async (video) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete this video?\n\n${video.title || video.videoUrl}`
        );
        if (!confirmDelete) return;

        try {
            setActionMessage('');
            await axiosInstance.delete(`/videos/${video.videoID}`);
            setActionMessage('Video deleted.');
            setVideos((prev) => prev.filter((v) => v.videoID !== video.videoID));
        } catch (err) {
            console.error('Error deleting video:', err);
            setActionMessage('Failed to delete video.');
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Homepage Reels</h1>
                        <p className="text-gray-600">
                            Manage the portrait videos shown in the homepage reels section.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchVideos}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {actionMessage && !error && (
                    <div className="mb-4 p-3 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700">
                        {actionMessage}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-4">
                    {loading ? (
                        <div className="py-10 text-center text-gray-500 text-sm">
                            Loading videos...
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 text-sm">
                            No homepage videos found. Add one from &quot;Videos &gt; Add Video&quot;.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Title</th>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">URL</th>
                                        <th className="px-4 py-2 text-center font-semibold text-gray-700">Active</th>
                                        <th className="px-4 py-2 text-center font-semibold text-gray-700">Sort</th>
                                        <th className="px-4 py-2 text-center font-semibold text-gray-700">Created</th>
                                        <th className="px-4 py-2 text-center font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {videos.map((video) => (
                                        <tr key={video.videoID} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewVideo(video)}
                                                    className="text-blue-600 hover:underline font-medium"
                                                >
                                                    {video.title || 'Untitled Reel'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">
                                                {video.videoUrl}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        video.isActive
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                    }`}
                                                >
                                                    {video.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-center text-gray-700">
                                                {video.sortOrder ?? 0}
                                            </td>
                                            <td className="px-4 py-2 text-center text-gray-500 text-xs whitespace-nowrap">
                                                {video.createdAt
                                                    ? new Date(video.createdAt).toLocaleDateString()
                                                    : ''}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewVideo(video)}
                                                        className="px-2 py-1 text-xs font-medium rounded-md border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleActive(video)}
                                                        className="px-2 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100"
                                                    >
                                                        {video.isActive ? 'Set Inactive' : 'Set Active'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(video)}
                                                        className="px-2 py-1 text-xs font-medium rounded-md border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                                                    >
                                                        Delete
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
            </div>
            {/* Preview Modal */}
            {previewVideo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    onClick={() => setPreviewVideo(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-800">
                                {previewVideo.title || 'Reel Preview'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setPreviewVideo(null)}
                                className="text-gray-400 hover:text-gray-700"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="bg-black" style={{ aspectRatio: '9 / 16' }}>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video
                                src={previewVideo.videoUrl}
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                                muted
                                playsInline
                            />
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                                {previewVideo.videoUrl}
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewVideo(null)}
                                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListHomepageVideosPage;

