'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';

export default function ListCategories() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            fetchCategories();
        }
    }, [isAuthenticated]);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/categories');
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCategory = (categoryID) => {
        router.push(`/categories/edit/${categoryID}`);
    };

    const handleDeleteCategory = async (categoryID) => {
        try {
            const response = await axiosInstance.delete(`/categories/${categoryID}`);

            if (response.data.success) {
                setCategories(prev => prev.filter(cat => cat.categoryID !== categoryID));
                setDeleteConfirm(null);
            } else {
                setError(response.data.message || 'Failed to delete category');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const confirmDelete = (category) => {
        setDeleteConfirm(category);
    };

    const cancelDelete = () => {
        setDeleteConfirm(null);
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
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
                        <button
                            onClick={() => router.push('/categories/add')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Add Category
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white rounded-lg shadow">
                    {/* Error Message */}
                    {error && (
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Image
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Category Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Product Count
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                No categories found. <button
                                                    onClick={() => router.push('/categories/add')}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Create your first category
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((category) => (
                                            <tr key={category.categoryID} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex-shrink-0 h-12 w-12">
                                                        {category.image ? (
                                                            <img
                                                                src={category.image}
                                                                alt={category.categoryName}
                                                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                                                onError={(e) => {
                                                                    // Fallback to icon if image fails to load
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div
                                                            className={`h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center border border-gray-300 ${category.image ? 'hidden' : 'flex'}`}
                                                            style={{ display: category.image ? 'none' : 'flex' }}
                                                        >
                                                            <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {category.categoryName}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        ID: {category.categoryID}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {category.productCount || 0} products
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {new Date(category.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleEditCategory(category.categoryID)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(category)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Category</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete the category "{deleteConfirm.categoryName}"?
                                    {deleteConfirm.productCount > 0 && (
                                        <span className="block mt-1 text-red-600 font-medium">
                                            This category has {deleteConfirm.productCount} products and cannot be deleted.
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(deleteConfirm.categoryID)}
                                    disabled={deleteConfirm.productCount > 0}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
