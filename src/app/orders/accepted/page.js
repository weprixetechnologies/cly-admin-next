'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../utils/cookies';
import axios from '../../../utils/axiosInstance';

export default function AcceptedOrders() {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({
        search: '',
        paymentMode: 'all',
        dateFrom: '',
        dateTo: ''
    });
    const router = useRouter();

    const fetchOrders = async (page = 1) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                status: 'accepted',
                page: page.toString(),
                limit: '10',
                search: filters.search,
                paymentMode: filters.paymentMode,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo
            });

            const { data } = await axios.get(`/order/admin?${params}`);
            if (data.success === false) {
                console.error('[AcceptedOrders] API error:', data.message, data.error);
                setOrders([]);
                setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
            } else {
                setOrders(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
            }
        } catch (e) {
            console.error('[AcceptedOrders] Request failed:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        fetchOrders();
    }, [router, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePageChange = (newPage) => {
        fetchOrders(newPage);
    };

    if (isLoading) {
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
                    <h1 className="text-2xl font-bold text-gray-800">Accepted Orders</h1>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-medium text-gray-900">Accepted Orders</h2>
                        <div className="text-sm text-gray-600">
                            Total: {pagination.total} orders
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input
                                type="text"
                                placeholder="Order ID, User, Product..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
                            <select
                                value={filters.paymentMode}
                                onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Payment</option>
                                <option value="COD">COD</option>
                                <option value="PREPAID">Prepaid</option>
                                <option value="PHONEPE">PhonePe</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Items</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Payment</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map(o => (
                                    <tr key={o.orderID} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-mono text-sm">{o.orderID}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            <div className="font-medium">{o.userName || 'Unknown User'}</div>
                                            <div className="text-xs text-gray-500">{o.uid}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{o.items}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 font-semibold">₹{o.order_amount || '0.00'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{o.paymentMode || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">accepted</span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => router.push(`/orders/view/${o.orderID}`)} className="text-blue-700 hover:text-blue-900 text-sm">View</button>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-gray-700">No orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const pageNum = Math.max(1, pagination.page - 2) + i;
                                    if (pageNum > pagination.totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-2 text-sm border rounded-md ${pageNum === pagination.page
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
