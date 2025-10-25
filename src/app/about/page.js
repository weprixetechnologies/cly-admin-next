'use client';

import { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';

export default function AboutManagementPage() {
    const [aboutContent, setAboutContent] = useState({
        title: '',
        content: '',
        mission: '',
        vision: '',
        company_values: '',
        is_active: 1
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAboutContent();
    }, []);

    const fetchAboutContent = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/about/admin');
            if (response.data.success && response.data.data) {
                setAboutContent(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching about content:', error);
            setError('Failed to load about content');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await axios.put('/about/admin', aboutContent);
            alert('About us content updated successfully');
        } catch (error) {
            console.error('Error saving about content:', error);
            alert('Failed to save about content');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setAboutContent(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading about content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">About Us Management</h1>
                    <p className="mt-2 text-gray-600">Manage the about us content for your website</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={aboutContent.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter the about us title"
                                required
                            />
                        </div>

                        {/* Main Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Main Content
                            </label>
                            <textarea
                                value={aboutContent.content}
                                onChange={(e) => handleChange('content', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter the main about us content"
                                rows={8}
                                required
                            />
                        </div>

                        {/* Mission */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mission
                            </label>
                            <textarea
                                value={aboutContent.mission}
                                onChange={(e) => handleChange('mission', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter the company mission"
                                rows={3}
                            />
                        </div>

                        {/* Vision */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vision
                            </label>
                            <textarea
                                value={aboutContent.vision}
                                onChange={(e) => handleChange('vision', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter the company vision"
                                rows={3}
                            />
                        </div>

                        {/* Values */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Values
                            </label>
                            <textarea
                                value={aboutContent.company_values}
                                onChange={(e) => handleChange('company_values', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter the company values"
                                rows={4}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={aboutContent.is_active}
                                onChange={(e) => handleChange('is_active', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview Section */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{aboutContent.title || 'Title'}</h3>
                        <div className="prose max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700 mb-4">
                                {aboutContent.content || 'Main content will appear here...'}
                            </div>

                            {aboutContent.mission && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Mission:</h4>
                                    <p className="whitespace-pre-wrap text-gray-700">{aboutContent.mission}</p>
                                </div>
                            )}

                            {aboutContent.vision && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Vision:</h4>
                                    <p className="whitespace-pre-wrap text-gray-700">{aboutContent.vision}</p>
                                </div>
                            )}

                            {aboutContent.company_values && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Values:</h4>
                                    <p className="whitespace-pre-wrap text-gray-700">{aboutContent.company_values}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
