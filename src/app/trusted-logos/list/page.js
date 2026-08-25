'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosInstance';

const ListTrustedLogosPage = () => {
    const [logos, setLogos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingLogo, setEditingLogo] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', logoUrl: '', sortOrder: 0, isActive: true });

    useEffect(() => {
        fetchLogos();
    }, []);

    const fetchLogos = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/trusted-logos/all');
            setLogos(response.data.data || []);
        } catch (error) {
            console.error('Error fetching trusted logos:', error);
            setMessage({
                type: 'error',
                text: 'Failed to fetch trusted logos'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this company logo?')) {
            return;
        }

        try {
            await axiosInstance.delete(`/trusted-logos/${id}`);
            setMessage({ type: 'success', text: 'Logo deleted successfully!' });
            setLogos(prev => prev.filter(logo => logo.id !== id));
        } catch (error) {
            console.error('Error deleting logo:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to delete logo'
            });
        }
    };

    const handleToggleActive = async (logo) => {
        try {
            const updatedStatus = !logo.isActive;
            await axiosInstance.put(`/trusted-logos/${logo.id}`, {
                isActive: updatedStatus
            });
            setLogos(prev => prev.map(l => l.id === logo.id ? { ...l, isActive: updatedStatus ? 1 : 0 } : l));
            setMessage({ type: 'success', text: `Status updated to ${updatedStatus ? 'Active' : 'Inactive'}` });
        } catch (error) {
            console.error('Error updating logo status:', error);
            setMessage({ type: 'error', text: 'Failed to update logo status' });
        }
    };

    const startEditing = (logo) => {
        setEditingLogo(logo);
        setEditForm({
            name: logo.name || '',
            logoUrl: logo.logoUrl || '',
            sortOrder: logo.sortOrder || 0,
            isActive: logo.isActive === 1 || logo.isActive === true
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.put(`/trusted-logos/${editingLogo.id}`, {
                name: editForm.name,
                logoUrl: editForm.logoUrl,
                sortOrder: parseInt(editForm.sortOrder) || 0,
                isActive: editForm.isActive
            });
            setMessage({ type: 'success', text: 'Logo updated successfully!' });
            setEditingLogo(null);
            fetchLogos();
        } catch (error) {
            console.error('Error updating logo:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update logo' });
        }
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
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trusted By Logos</h1>
                        <p className="text-gray-600">View and manage company logos displayed in the homepage carousel</p>
                    </div>
                    <a
                        href="/trusted-logos/add"
                        className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add New Logo
                    </a>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-md ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Edit Modal */}
                {editingLogo && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Company Logo</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                                    <input
                                        type="url"
                                        value={editForm.logoUrl}
                                        onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                                    <input
                                        type="number"
                                        value={editForm.sortOrder}
                                        onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="editActive"
                                        checked={editForm.isActive}
                                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor="editActive" className="ml-2 text-sm text-gray-900">Active</label>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setEditingLogo(null)}
                                        className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Logos List Table / Grid */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {logos.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No company logos found</h3>
                            <p className="mt-1 text-sm text-gray-500">Add logos to populate the "Trusted By" carousel on your homepage.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logos.map((logo) => (
                                        <tr key={logo.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-24 h-12 bg-gray-50 border rounded p-1 flex items-center justify-center">
                                                    <img
                                                        src={logo.logoUrl}
                                                        alt={logo.name || 'Company logo'}
                                                        className="max-h-full max-w-full object-contain"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {logo.name || <span className="text-gray-400 italic">Unnamed</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                {logo.sortOrder}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleActive(logo)}
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition ${logo.isActive
                                                        ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {logo.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                <button
                                                    onClick={() => startEditing(logo)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(logo.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListTrustedLogosPage;
