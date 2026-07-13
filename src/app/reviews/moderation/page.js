'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';
import { BsStarFill, BsStar, BsCheck, BsX } from 'react-icons/bs';
import { BiX } from 'react-icons/bi';

export default function ModerationQueue() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [lightboxUrl, setLightboxUrl] = useState(null);

    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const loadPendingReviews = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/admin/reviews?status=pending&page=${currentPage}&limit=20&search=${searchTerm}`);
            if (response.data.success) {
                setReviews(response.data.data || []);
                // Calculate pages assuming count
                const totalCount = response.data.pagination?.totalReviews || (response.data.data || []).length;
                setTotalPages(Math.max(1, Math.ceil(totalCount / 20)));
            } else {
                setError(response.data.message || 'Failed to load reviews');
            }
        } catch (error) {
            console.error('Error loading pending reviews:', error);
            setError('Failed to load pending reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadPendingReviews();
        }
    }, [isAuthenticated, currentPage, searchTerm]);

    const handleApprove = async (reviewID) => {
        try {
            const res = await axiosInstance.patch(`/admin/reviews/${reviewID}/status`, { status: 'approved' });
            if (res.data.success) {
                alert('Review approved successfully');
                loadPendingReviews();
            } else {
                alert(res.data.message || 'Failed to approve review');
            }
        } catch (error) {
            console.error('Error approving review:', error);
            alert(error.response?.data?.message || 'Failed to approve review');
        }
    };

    const handleReject = async (reviewID) => {
        try {
            const res = await axiosInstance.patch(`/admin/reviews/${reviewID}/status`, { status: 'rejected' });
            if (res.data.success) {
                alert('Review rejected successfully');
                loadPendingReviews();
            } else {
                alert(res.data.message || 'Failed to reject review');
            }
        } catch (error) {
            console.error('Error rejecting review:', error);
            alert(error.response?.data?.message || 'Failed to reject review');
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <BsStarFill 
                    key={i} 
                    className={i <= rating ? 'text-amber-400' : 'text-gray-200'} 
                    size={14}
                />
            );
        }
        return stars;
    };

    return (
        <main className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Review Moderation Queue</h1>
                        <p className="text-sm text-gray-500 mt-1">Approve or reject newly submitted product reviews</p>
                    </div>
                </div>

                {/* Filter and Search */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search by product or reviewer name..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        Total pending reviews: {reviews.length}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading moderation queue...</div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl py-16 text-center shadow-sm">
                        <div className="text-gray-400 text-lg font-semibold mb-2">Moderation Queue is Empty</div>
                        <p className="text-sm text-gray-500">There are no pending reviews requiring moderation.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-xs font-semibold px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full">
                                            Pending approval
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {new Date(review.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Product and User Info */}
                                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 max-w-2xl">
                                        <img 
                                            src={review.productFeaturedImage || 'https://picsum.photos/100/100?random=prod'} 
                                            alt={review.productName} 
                                            className="w-10 h-10 object-cover rounded-md border"
                                        />
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">{review.productName || 'Unknown Product'}</div>
                                            <div className="text-xs text-gray-500">
                                                Reviewer: <span className="font-semibold text-gray-700">{review.reviewerName}</span> ({review.reviewerEmail})
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stars, Title, Body */}
                                    <div>
                                        <div className="flex items-center gap-0.5 mb-2">
                                            {renderStars(review.rating)}
                                        </div>
                                        {review.title && <h3 className="text-sm font-bold text-gray-900 mb-1">{review.title}</h3>}
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.body || 'No description'}</p>
                                    </div>

                                    {/* Photos */}
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {review.images.map((imgUrl, idx) => (
                                                <img 
                                                    key={idx}
                                                    src={imgUrl}
                                                    alt={`Review preview ${idx + 1}`}
                                                    onClick={() => setLightboxUrl(imgUrl)}
                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-85 transition"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions Block */}
                                <div className="flex md:flex-col gap-2 w-full md:w-auto self-stretch md:self-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                                    <button
                                        onClick={() => handleApprove(review.id)}
                                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-lg transition active:scale-[0.98]"
                                    >
                                        <BsCheck size={18} />
                                        <span>Approve</span>
                                    </button>
                                    <button
                                        onClick={() => handleReject(review.id)}
                                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition active:scale-[0.98]"
                                    >
                                        <BsX size={18} />
                                        <span>Reject</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setLightboxUrl(null)}>
                    <button 
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                    >
                        <BiX size={24} />
                    </button>
                    <img 
                        src={lightboxUrl} 
                        alt="Expanded view" 
                        className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl animate-in zoom-in-95 duration-200" 
                    />
                </div>
            )}
        </main>
    );
}
