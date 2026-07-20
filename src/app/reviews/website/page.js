'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';
import { BsStarFill, BsCheck, BsX, BsTrash } from 'react-icons/bs';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
];

export default function WebsiteReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            setError('');
            const statusParam = statusFilter === 'all' ? '' : `status=${statusFilter}&`;
            const response = await axiosInstance.get(
                `/admin/site-reviews?${statusParam}page=${currentPage}&limit=20&search=${encodeURIComponent(searchTerm)}`
            );
            if (response.data.success) {
                setReviews(response.data.data || []);
                setTotalPages(response.data.pagination?.totalPages || 1);
            } else {
                setError(response.data.message || 'Failed to load reviews');
            }
        } catch (err) {
            console.error('Error loading website reviews:', err);
            setError('Failed to load website reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadReviews();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, statusFilter, currentPage, searchTerm]);

    const handleStatusChange = async (reviewID, status) => {
        try {
            const res = await axiosInstance.patch(`/admin/site-reviews/${reviewID}/status`, { status });
            if (res.data.success) {
                loadReviews();
            } else {
                alert(res.data.message || 'Failed to update review');
            }
        } catch (err) {
            console.error('Error updating review status:', err);
            alert(err.response?.data?.message || 'Failed to update review');
        }
    };

    const handleDelete = async (reviewID) => {
        if (!window.confirm('Permanently delete this review? This cannot be undone.')) return;
        try {
            const res = await axiosInstance.delete(`/admin/site-reviews/${reviewID}`);
            if (res.data.success) {
                loadReviews();
            } else {
                alert(res.data.message || 'Failed to delete review');
            }
        } catch (err) {
            console.error('Error deleting review:', err);
            alert(err.response?.data?.message || 'Failed to delete review');
        }
    };

    const renderStars = (rating) => (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <BsStarFill key={i} className={i <= rating ? 'text-amber-400' : 'text-gray-200'} size={14} />
            ))}
        </div>
    );

    const statusBadge = (status) => {
        const map = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-red-50 text-red-700 border-red-200',
        };
        return (
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${map[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {status}
            </span>
        );
    };

    return (
        <main className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Website Reviews</h1>
                        <p className="text-sm text-gray-500 mt-1">Moderate overall website / experience reviews shown in the homepage carousel</p>
                    </div>
                </div>

                {/* Tabs + search */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    statusFilter === tab.key
                                        ? 'bg-[#EF6A22] text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="w-full lg:w-72">
                        <input
                            type="text"
                            placeholder="Search by name, email or comment..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#EF6A22] focus:border-transparent"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>
                )}

                {loading ? (
                    <div className="grid place-items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#EF6A22]"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                        No reviews found for this filter.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {reviews.map((r) => (
                            <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-semibold text-gray-900">{r.name}</span>
                                            {renderStars(r.rating)}
                                            {statusBadge(r.status)}
                                            {r.uid ? (
                                                <span className="text-xs text-gray-400">· Registered user</span>
                                            ) : (
                                                <span className="text-xs text-gray-400">· Guest</span>
                                            )}
                                        </div>
                                        {r.email && (
                                            <div className="text-xs text-gray-500 mt-1">{r.email}</div>
                                        )}
                                        {r.comment && (
                                            <p className="text-sm text-gray-700 mt-3 leading-relaxed whitespace-pre-line">{r.comment}</p>
                                        )}
                                        <div className="text-xs text-gray-400 mt-3">
                                            {r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {r.status !== 'approved' && (
                                            <button
                                                onClick={() => handleStatusChange(r.id, 'approved')}
                                                title="Approve"
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
                                            >
                                                <BsCheck size={16} /> Approve
                                            </button>
                                        )}
                                        {r.status !== 'rejected' && (
                                            <button
                                                onClick={() => handleStatusChange(r.id, 'rejected')}
                                                title="Reject"
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition"
                                            >
                                                <BsX size={16} /> Reject
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            title="Delete"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition"
                                        >
                                            <BsTrash size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium bg-white disabled:opacity-50 hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium bg-white disabled:opacity-50 hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
