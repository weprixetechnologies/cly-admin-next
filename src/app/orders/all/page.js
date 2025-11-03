'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../utils/cookies';
import axios from '../../../utils/axiosInstance';

export default function AllOrders() {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 40, total: 0, totalPages: 0 });
    const [statistics, setStatistics] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        paymentMode: 'all',
        dateFrom: '',
        dateTo: ''
    });
    const [searchDraft, setSearchDraft] = useState('');
    const router = useRouter();

    const fetchOrders = async (page = 1) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                status: filters.status,
                page: page.toString(),
                limit: '40',
                search: filters.search,
                paymentMode: filters.paymentMode,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo
            });

            const { data } = await axios.get(`/order/admin?${params}`);
            if (data.success === false) {
                console.error('[AllOrders] API error:', data.message, data.error);
                setOrders([]);
                setPagination({ page: 1, limit: 40, total: 0, totalPages: 0 });
            } else {
                const list = (data.data || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(list);
                setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
            }
        } catch (e) {
            console.error('[AllOrders] Request failed:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const params = new URLSearchParams({
                status: filters.status,
                paymentMode: filters.paymentMode,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo
            });

            const { data } = await axios.get(`/order/admin/statistics?${params}`);
            if (data.success) {
                setStatistics(data.data);
            }
        } catch (e) {
            console.error('[AllOrders] Statistics fetch failed:', e);
        }
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        fetchOrders();
        fetchStatistics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePageChange = (newPage) => {
        fetchOrders(newPage);
    };

    const fmt = (d) => {
        try { return new Date(d).toLocaleString(); } catch { return d || '-'; }
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
        <div className="min-h-screen">
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>
                </div>
            </header>

            <main className="p-6 w-full">
                {/* Statistics Dashboard */}
                {statistics && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Orders */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{statistics.overview.totalOrders}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{statistics.overview.totalAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Amount */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{statistics.overview.pendingAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Paid Amount */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="p-3 bg-emerald-100 rounded-lg">
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{statistics.overview.paidAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Statistics Row */}
                {statistics && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Average Order Value */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{statistics.overview.averageOrderValue.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="p-3 bg-indigo-100 rounded-lg">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Recent Orders (7d)</p>
                                    <p className="text-2xl font-bold text-gray-900">{statistics.overview.recentOrders}</p>
                                </div>
                            </div>
                        </div>

                        {/* Partially Paid */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Partially Paid</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{statistics.overview.partiallyPaidAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex items-center">
                                <div className="p-3 bg-pink-100 rounded-lg">
                                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Status Breakdown</p>
                                    <div className="text-xs text-gray-500 space-y-1">
                                        {Object.entries(statistics.statusBreakdown).map(([status, data]) => (
                                            <div key={status} className="flex justify-between">
                                                <span className="capitalize">{status}:</span>
                                                <span className="font-medium">{data.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow border border-gray-100 p-6 w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
                        <div className="text-sm text-gray-600">Total: {pagination.total} orders</div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Order ID, User, Product..."
                                    value={searchDraft}
                                    onChange={(e) => setSearchDraft(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setFilters(prev => ({ ...prev, search: searchDraft })); }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, search: searchDraft }))}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
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

                    <div className="overflow-x-auto rounded-lg border border-gray-100 w-full">
                        <table className="divide-y divide-gray-100" style={{ width: '1200px' }}>
                            <thead className="bg-gray-50/80">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-32">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-48">Order ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-40">User</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-20">Items</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-32">Units</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-24">Amount</th>
                                    {/* <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-20">Payment</th> */}
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-24">Status</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {orders.map(o => (
                                    <tr key={o.orderID} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-900 w-32">
                                            <div className="whitespace-nowrap">
                                                {new Date(o.createdAt).toLocaleDateString()}
                                                <br />
                                                {new Date(o.createdAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-mono text-sm text-gray-900 whitespace-nowrap w-48" title={o.orderID}>{o.orderID}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 w-40">
                                            <div className="font-medium whitespace-nowrap" title={o.userName || 'Unknown User'}>{o.userName || 'Unknown User'}</div>
                                            <div className="text-xs text-gray-500 whitespace-nowrap" title={o.uid}>{o.uid}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900 text-center whitespace-nowrap w-20">{o.items}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap w-32">
                                            <div className="text-xs">
                                                <div>Req: {o.total_requested || 0}</div>
                                                <div className={o.total_accepted < o.total_requested ? 'text-yellow-600' : 'text-green-600'}>
                                                    Acc: {o.total_accepted || 0}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900 font-semibold whitespace-nowrap w-24">₹{o.order_amount || '0.00'}</td>
                                        {/* <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap w-20">{o.paymentMode || '-'}</td> */}
                                        <td className="px-4 py-2 whitespace-nowrap w-24">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o.orderStatus === 'accepted' ? 'bg-green-100 text-green-800' : o.orderStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-900'}`}>{o.orderStatus}</span>
                                        </td>
                                        <td className="px-4 py-2 text-right whitespace-nowrap w-20">
                                            <button onClick={() => router.push(`/orders/view/${o.orderID}`)} className="text-blue-700 hover:text-blue-900 text-sm">View</button>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-6 text-center text-gray-700">No orders found.</td>
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

                                {(() => {
                                    const pages = [];
                                    const current = pagination.page;
                                    const total = pagination.totalPages;
                                    const start = Math.max(1, current - 1);
                                    const end = Math.min(total, current + 1);
                                    for (let p = start; p <= end; p++) {
                                        pages.push(
                                            <button
                                                key={p}
                                                onClick={() => handlePageChange(p)}
                                                className={`px-3 py-2 text-sm border rounded-md ${p === current
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    }
                                    return pages;
                                })()}

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
        </div>
    );
}
