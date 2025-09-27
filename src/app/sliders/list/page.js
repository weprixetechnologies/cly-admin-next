'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosInstance';

const ListSlidersPage = () => {
    const [desktopSliders, setDesktopSliders] = useState([]);
    const [mobileSliders, setMobileSliders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('desktop');

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        try {
            setLoading(true);
            const [desktopResponse, mobileResponse] = await Promise.all([
                axiosInstance.get('/sliders/desktop'),
                axiosInstance.get('/sliders/mobile')
            ]);

            setDesktopSliders(desktopResponse.data.data || []);
            setMobileSliders(mobileResponse.data.data || []);
        } catch (error) {
            console.error('Error fetching sliders:', error);
            setMessage({
                type: 'error',
                text: 'Failed to fetch sliders'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (sliderId, type) => {
        if (!confirm('Are you sure you want to delete this slider?')) {
            return;
        }

        try {
            const endpoint = type === 'desktop' ? 'desktop' : 'mobile';
            await axiosInstance.delete(`/sliders/${endpoint}/${sliderId}`);

            setMessage({ type: 'success', text: 'Slider deleted successfully!' });

            // Refresh the appropriate list
            if (type === 'desktop') {
                setDesktopSliders(prev => prev.filter(slider => slider.sliderID !== sliderId));
            } else {
                setMobileSliders(prev => prev.filter(slider => slider.sliderID !== sliderId));
            }
        } catch (error) {
            console.error('Error deleting slider:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to delete slider'
            });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Sliders</h1>
                    <p className="text-gray-600">View and manage all slider images</p>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-md ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('desktop')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'desktop'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Desktop Sliders ({desktopSliders.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('mobile')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'mobile'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Mobile Sliders ({mobileSliders.length})
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Desktop Sliders Tab */}
                {activeTab === 'desktop' && (
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Desktop Sliders</h2>
                        </div>
                        <div className="p-6">
                            {desktopSliders.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No desktop sliders</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by adding a new desktop slider.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {desktopSliders.map((slider) => (
                                        <div key={slider.sliderID} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="aspect-w-16 aspect-h-6">
                                                <img
                                                    src={slider.imgUrl}
                                                    alt={`Desktop slider ${slider.sliderID}`}
                                                    className="w-full h-48 object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className="hidden w-full h-48 bg-gray-100 items-center justify-center">
                                                    <span className="text-gray-500">Invalid image</span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="text-sm text-gray-500 mb-2">
                                                    ID: {slider.sliderID}
                                                </div>
                                                <div className="text-sm text-gray-500 mb-4">
                                                    Added: {formatDate(slider.createdAt)}
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => handleDelete(slider.sliderID, 'desktop')}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile Sliders Tab */}
                {activeTab === 'mobile' && (
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Mobile Sliders</h2>
                        </div>
                        <div className="p-6">
                            {mobileSliders.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No mobile sliders</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by adding a new mobile slider.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {mobileSliders.map((slider) => (
                                        <div key={slider.sliderID} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="aspect-w-16 aspect-h-6">
                                                <img
                                                    src={slider.imgUrl}
                                                    alt={`Mobile slider ${slider.sliderID}`}
                                                    className="w-full h-48 object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className="hidden w-full h-48 bg-gray-100 items-center justify-center">
                                                    <span className="text-gray-500">Invalid image</span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="text-sm text-gray-500 mb-2">
                                                    ID: {slider.sliderID}
                                                </div>
                                                <div className="text-sm text-gray-500 mb-4">
                                                    Added: {formatDate(slider.createdAt)}
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => handleDelete(slider.sliderID, 'mobile')}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListSlidersPage;
