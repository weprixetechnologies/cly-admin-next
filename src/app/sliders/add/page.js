'use client';

import { useState } from 'react';
import axiosInstance from '../../../utils/axiosInstance';

const AddSliderPage = () => {
    const [formData, setFormData] = useState({
        desktopImgUrl: '',
        mobileImgUrl: ''
    });
    const [desktopFile, setDesktopFile] = useState(null);
    const [mobileFile, setMobileFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // BunnyCDN settings (same approach as products/add)
    // const storageZone = 'cly-images';
    // const storageRegion = 'storage.bunnycdn.com';
    // const pullZoneUrl = 'https://cly-pull.b-cdn.net';
    // const apiKey = 'b4381f39-9ab4-4c9f-989f88a76c2f-809a-4c75';

    const storageZone = 'ithyaraa';
    const storageRegion = 'sg.storage.bunnycdn.com';
    const pullZoneUrl = 'https://ithyaraa.b-cdn.net';
    const apiKey = '7017f7c4-638b-48ab-add3858172a8-f520-4b88'; // ⚠️ Dev only

    const uploadToBunny = async (file, subFolder) => {
        const safeName = encodeURIComponent(file.name.replace(/\s+/g, '_'));
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

        return { imgUrl: publicUrl, imgAlt: file.name };
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Desktop: prefer file (upload to Bunny directly), fallback to URL
            if (desktopFile) {
                const { imgUrl } = await uploadToBunny(desktopFile, 'sliders/desktop');
                await axiosInstance.post('/sliders/desktop', { imgUrl });
            } else if (formData.desktopImgUrl) {
                await axiosInstance.post('/sliders/desktop', { imgUrl: formData.desktopImgUrl });
            }

            // Mobile: prefer file (upload to Bunny directly), fallback to URL
            if (mobileFile) {
                const { imgUrl } = await uploadToBunny(mobileFile, 'sliders/mobile');
                await axiosInstance.post('/sliders/mobile', { imgUrl });
            } else if (formData.mobileImgUrl) {
                await axiosInstance.post('/sliders/mobile', { imgUrl: formData.mobileImgUrl });
            }

            setMessage({ type: 'success', text: 'Sliders added successfully!' });
            setFormData({ desktopImgUrl: '', mobileImgUrl: '' });
            setDesktopFile(null);
            setMobileFile(null);
        } catch (error) {
            console.error('Error adding sliders:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to add sliders'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-[90%] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Slider Images</h1>
                    <p className="text-gray-600">Upload slider images for desktop and mobile views</p>
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
                            {/* Desktop Slider */}
                            <div>
                                <label htmlFor="desktopImgUrl" className="block text-sm font-medium text-gray-700 mb-2">
                                    Desktop Slider Image URL
                                </label>
                                <input
                                    type="url"
                                    id="desktopImgUrl"
                                    name="desktopImgUrl"
                                    value={formData.desktopImgUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/desktop-slider.jpg"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Recommended size: 1920x600px or similar wide format
                                </p>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Or upload file</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setDesktopFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {desktopFile && (
                                        <p className="mt-2 text-sm text-gray-600">Selected: {desktopFile.name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Slider */}
                            <div>
                                <label htmlFor="mobileImgUrl" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mobile Slider Image URL
                                </label>
                                <input
                                    type="url"
                                    id="mobileImgUrl"
                                    name="mobileImgUrl"
                                    value={formData.mobileImgUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/mobile-slider.jpg"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Recommended size: 768x400px or similar mobile format
                                </p>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Or upload file</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setMobileFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {mobileFile && (
                                        <p className="mt-2 text-sm text-gray-600">Selected: {mobileFile.name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        {(formData.desktopImgUrl || formData.mobileImgUrl) && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {formData.desktopImgUrl && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Desktop Preview</h4>
                                            <div className="border border-gray-300 rounded-md overflow-hidden">
                                                <img
                                                    src={formData.desktopImgUrl}
                                                    alt="Desktop slider preview"
                                                    className="w-full h-48 object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                                <div className="hidden p-4 text-center text-gray-500 bg-gray-100">
                                                    Invalid image URL
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.mobileImgUrl && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Mobile Preview</h4>
                                            <div className="border border-gray-300 rounded-md overflow-hidden">
                                                <img
                                                    src={formData.mobileImgUrl}
                                                    alt="Mobile slider preview"
                                                    className="w-full h-48 object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                                <div className="hidden p-4 text-center text-gray-500 bg-gray-100">
                                                    Invalid image URL
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => { setFormData({ desktopImgUrl: '', mobileImgUrl: '' }); setDesktopFile(null); setMobileFile(null); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (!desktopFile && !formData.desktopImgUrl && !mobileFile && !formData.mobileImgUrl)}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Adding...' : 'Add Sliders'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddSliderPage;
