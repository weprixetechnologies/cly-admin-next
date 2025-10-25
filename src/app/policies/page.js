'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'react-toastify';
import RichTextEditor from '@/components/RichTextEditor';

const PoliciesPage = () => {
    const router = useRouter();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        content: '',
        version: '1.0'
    });

    const policyTypes = [
        { value: 'terms_conditions', label: 'Terms & Conditions' },
        { value: 'privacy_policy', label: 'Privacy Policy' },
        { value: 'refund_policy', label: 'Refund Policy' }
    ];

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/policies');
            setPolicies(response.data.data);
        } catch (error) {
            console.error('Error fetching policies:', error);
            toast.error('Failed to fetch policies');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingPolicy(null);
        setFormData({
            type: '',
            title: '',
            content: '',
            version: '1.0'
        });
        setShowForm(true);
    };

    const handleEdit = (policy) => {
        setEditingPolicy(policy);
        setFormData({
            type: policy.type,
            title: policy.title,
            content: policy.content,
            version: policy.version
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPolicy) {
                await axiosInstance.put(`/policies/${editingPolicy.id}`, formData);
                toast.success('Policy updated successfully');
            } else {
                await axiosInstance.post('/policies', formData);
                toast.success('Policy created successfully');
            }
            setShowForm(false);
            fetchPolicies();
        } catch (error) {
            console.error('Error saving policy:', error);
            toast.error('Failed to save policy');
        }
    };

    const handleActivate = async (policy) => {
        try {
            await axiosInstance.put(`/policies/${policy.id}/activate`, { type: policy.type });
            toast.success('Policy activated successfully');
            fetchPolicies();
        } catch (error) {
            console.error('Error activating policy:', error);
            toast.error('Failed to activate policy');
        }
    };

    const handleDelete = async (policy) => {
        if (!confirm('Are you sure you want to delete this policy?')) return;

        try {
            await axiosInstance.delete(`/policies/${policy.id}`);
            toast.success('Policy deleted successfully');
            fetchPolicies();
        } catch (error) {
            console.error('Error deleting policy:', error);
            toast.error('Failed to delete policy');
        }
    };

    const getPolicyTypeLabel = (type) => {
        return policyTypes.find(p => p.value === type)?.label || type;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading policies...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Policies Management</h1>
                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Create New Policy
                    </button>
                </div>

                {showForm && (
                    <div className="fixed inset-0  flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div className="bg-white rounded-lg p-6 w-full max-w-[90%] max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6">
                                {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Policy Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Policy Type</option>
                                        {policyTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Version
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Content
                                    </label>
                                    <RichTextEditor
                                        value={formData.content}
                                        onChange={(content) => setFormData({ ...formData, content })}
                                        placeholder="Enter policy content with rich text formatting..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {editingPolicy ? 'Update Policy' : 'Create Policy'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid gap-6">
                    {policies.map((policy) => (
                        <div key={policy.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {policy.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {getPolicyTypeLabel(policy.type)} • Version {policy.version}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Created: {new Date(policy.created_at).toLocaleDateString()}
                                        {policy.updated_at !== policy.created_at && (
                                            <span> • Updated: {new Date(policy.updated_at).toLocaleDateString()}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {policy.is_active && (
                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            Active
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <div
                                    className="text-gray-700 max-h-32 overflow-y-auto prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: policy.content }}
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => handleEdit(policy)}
                                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    Edit
                                </button>
                                {!policy.is_active && (
                                    <button
                                        onClick={() => handleActivate(policy)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Activate
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(policy)}
                                    className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {policies.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No policies found. Create your first policy to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PoliciesPage;
