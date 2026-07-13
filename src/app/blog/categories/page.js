'use client'

import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'react-toastify';

export default function BlogCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [editId, setEditId] = useState(null);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/blog/categories');
            if (res.data?.success) {
                setCategories(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setSubmitting(true);
            const payload = { name, slug, description };
            
            if (editId) {
                const res = await axiosInstance.put(`/admin/blog/categories/${editId}`, payload);
                if (res.data?.success) {
                    toast.success('Category updated successfully');
                    loadCategories();
                    resetForm();
                }
            } else {
                const res = await axiosInstance.post('/admin/blog/categories', payload);
                if (res.data?.success) {
                    toast.success('Category created successfully');
                    loadCategories();
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error(error.response?.data?.message || 'Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (cat) => {
        setEditId(cat.id);
        setName(cat.name);
        setSlug(cat.slug);
        setDescription(cat.description || '');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category? Blog posts in this category will be reset to uncategorized.')) {
            return;
        }

        try {
            const res = await axiosInstance.delete(`/admin/blog/categories/${id}`);
            if (res.data?.success) {
                toast.success('Category deleted successfully');
                loadCategories();
                if (editId === id) resetForm();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    const resetForm = () => {
        setEditId(null);
        setName('');
        setSlug('');
        setDescription('');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 font-serif tracking-tight">Blog Categories</h1>
                <p className="text-gray-500 text-sm mt-1">Manage categories used to index blog posts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Categories List */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Existing Categories</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading categories...</div>
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No categories found. Create one using the form.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase bg-gray-50/20">
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Slug</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {categories.map(cat => (
                                        <tr key={cat.id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{cat.name}</td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                                            <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">{cat.description || '-'}</td>
                                            <td className="px-6 py-4 text-right space-x-2 shrink-0">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="text-amber-600 hover:text-amber-700 font-medium text-xs bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="text-red-600 hover:text-red-700 font-medium text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
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

                {/* Right side: Add/Edit Form */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-serif font-bold text-gray-900 text-lg mb-4 border-b border-gray-100 pb-3">
                        {editId ? 'Edit Category' : 'Create New Category'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Calligraphy Guides"
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Slug (URL identifier - optional)
                            </label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="calligraphy-guides"
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Articles about calligraphy tools, guides, and tips."
                                rows="4"
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            {editId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md transition-colors"
                            >
                                {submitting ? 'Saving...' : editId ? 'Update Category' : 'Create Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
