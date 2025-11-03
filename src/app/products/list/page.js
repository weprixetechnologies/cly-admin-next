'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';
import * as XLSX from 'xlsx';

export default function ListProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [exporting, setExporting] = useState(false);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            loadProducts();
        }
    }, [isAuthenticated, currentPage, searchTerm]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/products/list?page=${currentPage}&limit=60&search=${searchTerm}`);

            if (response.data.success) {
                setProducts(response.data.data.products);
                setTotalPages(response.data.data.pagination.totalPages);
            } else {
                setError(response.data.message || 'Failed to load products');
            }
        } catch (error) {
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleDelete = async (productID) => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            // First get the product to find its category
            const productResponse = await axiosInstance.get(`/products/${productID}`);
            const productCategoryID = productResponse.data.success ? productResponse.data.data.categoryID : null;

            // Delete the product
            const response = await axiosInstance.delete(`/products/${productID}`);

            if (response.data.success) {
                // Update category product count if product had a category
                if (productCategoryID) {
                    try {
                        await axiosInstance.patch(`/categories/${productCategoryID}/product-count`, {
                            increment: false
                        });
                    } catch (error) {
                        console.error('Failed to update category product count:', error);
                        // Don't show error to user as product was deleted successfully
                    }
                }

                loadProducts(); // Reload products
            } else {
                setError(response.data.message || 'Failed to delete product');
            }
        } catch (error) {
            setError('Failed to delete product');
        }
    };

    const handleEdit = (productID) => {
        router.push(`/products/edit/${productID}`);
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
                        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    router.push('/products/add');
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Add Product
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        setExporting(true);
                                        const pageSize = 1000;
                                        let page = 1;
                                        let allRows = [];
                                        while (true) {
                                            const { data } = await axiosInstance.get(`/products/list?page=${page}&limit=${pageSize}&search=`);
                                            if (!data?.success) break;
                                            const batch = data?.data?.products || [];
                                            allRows = allRows.concat(batch);
                                            const total = data?.data?.pagination?.total || 0;
                                            if (allRows.length >= total || batch.length === 0) break;
                                            page += 1;
                                        }

                                        const worksheetData = allRows.map((p) => ({
                                            productID: p.productID,
                                            productName: p.productName,
                                            sku: p.sku,
                                            category: p.categoryName || '',
                                            price: p.productPrice,
                                            status: p.status,
                                            inventory: p.inventory,
                                            createdAt: p.createdAt,
                                        }));

                                        const wb = XLSX.utils.book_new();
                                        const ws = XLSX.utils.json_to_sheet(worksheetData);
                                        XLSX.utils.book_append_sheet(wb, ws, 'Products');
                                        XLSX.writeFile(wb, `products_${new Date().toISOString().slice(0, 10)}.xlsx`);
                                    } catch (e) {
                                        console.error('Export failed', e);
                                        alert('Failed to export products.');
                                    } finally {
                                        setExporting(false);
                                    }
                                }}
                                disabled={exporting}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {exporting ? 'Exporting…' : 'Export All Products'}
                            </button>
                            <button
                                onClick={async () => {
                                    if (!confirm('This will mark ALL products as deleted. Continue?')) return;
                                    try {
                                        await axiosInstance.delete('/products/all');
                                        alert('All products deleted (soft delete). Refreshing list...');
                                        loadProducts();
                                    } catch (e) {
                                        alert('Failed to delete all products');
                                    }
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading products...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">No products found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Image
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Inventory
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.productID} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {product.featuredImages ? (
                                                    <img
                                                        src={product.featuredImages}
                                                        alt={product.productName}
                                                        className="h-12 w-12 object-cover rounded-md"
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">No Image</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.productName}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {product.description}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.sku}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ₹{product.productPrice}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.categoryName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.inventory}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(product.productID)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.productID)}
                                                        className="text-red-600 hover:text-red-900"
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <nav className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {(() => {
                                const pages = [];
                                const start = Math.max(1, currentPage - 1);
                                const end = Math.min(totalPages, currentPage + 1);
                                for (let p = start; p <= end; p++) {
                                    pages.push(
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === p
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                }
                                return pages;
                            })()}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}
            </main>
        </>
    );
}