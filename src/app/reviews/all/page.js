'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';
import { BsStarFill, BsTrash, BsReply } from 'react-icons/bs';
import { BiX } from 'react-icons/bi';

export default function AllReviewsList() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [lightboxUrl, setLightboxUrl] = useState(null);

    // Reply modal states
    const [replyingReview, setReplyingReview] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const loadAllReviews = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                search: searchTerm
            });
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            if (ratingFilter !== 'all') {
                params.append('rating', ratingFilter);
            }

            const response = await axiosInstance.get(`/admin/reviews?${params.toString()}`);
            if (response.data.success) {
                setReviews(response.data.data || []);
                const totalCount = response.data.pagination?.totalReviews || (response.data.data || []).length;
                setTotalPages(Math.max(1, Math.ceil(totalCount / 20)));
            } else {
                setError(response.data.message || 'Failed to load reviews');
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadAllReviews();
        }
    }, [isAuthenticated, currentPage, searchTerm, statusFilter, ratingFilter]);

    const handleDelete = async (reviewID) => {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await axiosInstance.delete(`/admin/reviews/${reviewID}`);
            if (res.data.success) {
                alert('Review deleted successfully');
                loadAllReviews();
            } else {
                alert(res.data.message || 'Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            alert(error.response?.data?.message || 'Failed to delete review');
        }
    };

    const handleOpenReplyModal = (review) => {
        setReplyingReview(review);
        setReplyText(review.storeReply || '');
    };

    const handleSaveReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) {
            alert('Reply text cannot be empty');
            return;
        }

        setSubmittingReply(true);
        try {
            const res = await axiosInstance.post(`/admin/reviews/${replyingReview.id}/reply`, {
                reply: replyText
            });
            if (res.data.success) {
                alert('Store reply updated successfully');
                setReplyingReview(null);
                loadAllReviews();
            } else {
                alert(res.data.message || 'Failed to submit reply');
            }
        } catch (error) {
            console.error('Error submitting store reply:', error);
            alert(error.response?.data?.message || 'Failed to submit reply');
        } finally {
            setSubmittingReply(false);
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
                        <h1 className="text-2xl font-bold text-gray-900">All Product Reviews</h1>
                        <p className="text-sm text-gray-500 mt-1">Search, moderate, delete, and reply to all customer reviews</p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Search</label>
                        <input
                            type="text"
                            placeholder="Product, reviewer, title..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rating</label>
                        <select
                            value={ratingFilter}
                            onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                    <div className="text-right text-xs text-gray-400 font-medium pt-4 sm:pt-0">
                        Showing {reviews.length} reviews
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading reviews database...</div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl py-16 text-center shadow-sm">
                        <div className="text-gray-400 text-lg font-semibold mb-2">No Reviews Found</div>
                        <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={review.productFeaturedImage || 'https://picsum.photos/100/100?random=prod'} 
                                            alt={review.productName} 
                                            className="w-10 h-10 object-cover rounded-md border"
                                        />
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">{review.productName || 'Unknown Product'}</div>
                                            <div className="text-xs text-gray-400">
                                                Reviewer: <span className="font-semibold text-gray-600">{review.reviewerName}</span> ({review.reviewerEmail}) • {new Date(review.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {review.status === 'pending' && (
                                            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 border border-amber-250 text-amber-700 rounded-full">
                                                Pending
                                            </span>
                                        )}
                                        {review.status === 'approved' && (
                                            <span className="text-xs font-semibold px-2 py-0.5 bg-green-50 border border-green-250 text-green-700 rounded-full">
                                                Approved
                                            </span>
                                        )}
                                        {review.status === 'rejected' && (
                                            <span className="text-xs font-semibold px-2 py-0.5 bg-red-50 border border-red-250 text-red-700 rounded-full">
                                                Rejected
                                            </span>
                                        )}
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

                                {/* Review Images */}
                                {review.images && review.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {review.images.map((imgUrl, idx) => (
                                            <img 
                                                key={idx}
                                                src={imgUrl}
                                                alt={`Review preview ${idx + 1}`}
                                                onClick={() => setLightboxUrl(imgUrl)}
                                                className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-85 transition"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Store Response Content */}
                                {review.storeReply && (
                                    <div className="p-3 bg-orange-50/30 border border-orange-100 rounded-xl text-xs text-gray-700 relative">
                                        <div className="font-bold text-[#EF6A22] mb-1">🏢 Store Response:</div>
                                        <p className="leading-relaxed">{review.storeReply}</p>
                                        <div className="text-[10px] text-gray-400 font-medium text-right mt-1">
                                            Replied on {new Date(review.storeReplyAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}

                                {/* Actions buttons */}
                                <div className="flex gap-2 justify-end border-t border-gray-50 pt-3">
                                    <button
                                        onClick={() => handleOpenReplyModal(review)}
                                        className="flex items-center gap-1 px-3 py-1.5 border border-orange-200 text-[#EF6A22] hover:bg-orange-50 text-xs font-bold rounded-lg transition"
                                    >
                                        <BsReply size={14} />
                                        <span>{review.storeReply ? 'Edit Reply' : 'Reply'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(review.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition"
                                    >
                                        <BsTrash size={13} />
                                        <span>Delete</span>
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

            {/* Store Reply Modal */}
            {replyingReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReplyingReview(null)} />
                    <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setReplyingReview(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                        >
                            <BiX size={20} />
                        </button>

                        <h3 className="text-lg font-bold text-gray-900 mb-2">Write Store Reply</h3>
                        <p className="text-xs text-gray-500 mb-4">Replying to review by <span className="font-semibold text-gray-700">{replyingReview.reviewerName}</span> on <span className="font-semibold text-gray-700">{replyingReview.productName}</span></p>

                        <form onSubmit={handleSaveReply} className="space-y-4">
                            <div>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write your official store response here..."
                                    rows={5}
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#EF6A22] focus:border-transparent outline-none transition resize-none"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setReplyingReview(null)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReply}
                                    className="px-4 py-2 bg-[#EF6A22] hover:bg-[#d85c1b] text-white font-bold text-sm rounded-lg transition active:scale-[0.98] disabled:opacity-50"
                                >
                                    {submittingReply ? 'Saving...' : 'Submit Reply'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
