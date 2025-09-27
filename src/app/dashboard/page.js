'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';

export default function Dashboard() {
    const { user, isLoading, logout } = useAuth();
    const [stats, setStats] = useState({
        totalProducts: 0,
        syncedProducts: 0,
        totalUsers: 0,
        totalOrders: 0,
        activeProducts: 0,
        activeUsers: 0,
        recentProducts: 0,
        recentUsers: 0
    });
    const [analytics, setAnalytics] = useState(null);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

    useEffect(() => {
        if (!isLoading) {
            loadDashboardData();
        }
    }, [isLoading, currentPage]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load analytics data
            const analyticsResponse = await axiosInstance.get('/analytics/dashboard');
            if (analyticsResponse.data.success) {
                const analyticsData = analyticsResponse.data.data;
                setAnalytics(analyticsData);
                setStats({
                    totalProducts: analyticsData.overview.totalProducts,
                    syncedProducts: analyticsData.overview.syncedProducts,
                    totalUsers: analyticsData.overview.totalUsers,
                    totalOrders: analyticsData.orders.totalOrders,
                    activeProducts: analyticsData.overview.activeProducts,
                    activeUsers: analyticsData.overview.activeUsers,
                    recentProducts: analyticsData.overview.recentProducts,
                    recentUsers: analyticsData.overview.recentUsers
                });
            }

            // Load products for display
            const productsResponse = await axiosInstance.get(`/products/list?page=${currentPage}&limit=8`);
            if (productsResponse.data.success) {
                setProducts(productsResponse.data.data.products);
                setTotalPages(productsResponse.data.data.pagination.totalPages);
            }

            // Load users for display
            const usersResponse = await axiosInstance.get('/users?page=1&limit=5');
            if (usersResponse.data.success) {
                setUsers(usersResponse.data.users);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                            <p className="text-slate-600 text-sm">
                                Welcome back, {user?.name || 'Admin'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={logout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-600">Total Users</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                                    <p className="text-xs text-gray-500">{stats.activeUsers} active</p>
                                </div>
                            </div>
                            {analytics?.growth?.userGrowthRate && (
                                <div className={`text-right ${analytics.growth.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <p className="text-sm font-medium">
                                        {analytics.growth.userGrowthRate >= 0 ? '+' : ''}{analytics.growth.userGrowthRate}%
                                    </p>
                                    <p className="text-xs">vs last week</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-600">Total Products</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
                                    <p className="text-xs text-gray-500">{stats.activeProducts} active</p>
                                </div>
                            </div>
                            {analytics?.growth?.productGrowthRate && (
                                <div className={`text-right ${analytics.growth.productGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <p className="text-sm font-medium">
                                        {analytics.growth.productGrowthRate >= 0 ? '+' : ''}{analytics.growth.productGrowthRate}%
                                    </p>
                                    <p className="text-xs">vs last week</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-600">Synced Products</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.syncedProducts}</p>
                                    <p className="text-xs text-gray-500">
                                        {stats.totalProducts > 0 ? Math.round((stats.syncedProducts / stats.totalProducts) * 100) : 0}% of total
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-600">Total Orders</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
                                    <p className="text-xs text-gray-500">This month</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Recent Products</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.recentProducts}</p>
                                <p className="text-xs text-gray-500">Last 7 days</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-pink-100 rounded-lg">
                                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Recent Users</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.recentUsers}</p>
                                <p className="text-xs text-gray-500">Last 7 days</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Pending Orders</p>
                                <p className="text-2xl font-semibold text-gray-900">{analytics?.orders?.pendingOrders || 0}</p>
                                <p className="text-xs text-gray-500">Awaiting processing</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Completed Orders</p>
                                <p className="text-2xl font-semibold text-gray-900">{analytics?.orders?.completedOrders || 0}</p>
                                <p className="text-xs text-gray-500">Successfully delivered</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Products</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'cards'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Cards
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'table'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Table
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading products...</p>
                            </div>
                        ) : viewMode === 'cards' ? (
                            <>
                                {/* Product Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {products.map((product) => (
                                        <div key={product.productID} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="aspect-w-16 aspect-h-12 mb-4">
                                                {product.featuredImages ? (
                                                    <img
                                                        src={product.featuredImages}
                                                        alt={product.productName}
                                                        className="w-full h-32 object-cover rounded-md"
                                                    />
                                                ) : (
                                                    <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
                                                        <span className="text-gray-400 text-sm">No Image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-medium text-gray-900 truncate">{product.productName}</h4>
                                            <p className="text-sm text-gray-600">₹{product.productPrice}</p>
                                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.status}
                                                </span>
                                                <span className="text-xs text-gray-500">Qty: {product.inventory}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination for Cards */}
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

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}

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
                            </>
                        ) : (
                            <>
                                {/* Product Table */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
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
                                                        <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                                                        <div className="text-sm text-gray-500">{product.categoryName || 'No Category'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{product.productPrice}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {product.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.inventory}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination for Table */}
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

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}

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
                            </>
                        )}
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.uid} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                                            <div className="text-sm text-gray-500">@{user.username}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.emailID || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phoneNumber || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
