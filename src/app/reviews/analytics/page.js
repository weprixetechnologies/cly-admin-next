'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';
import { BsStarFill, BsChatQuote, BsCheckCircle, BsFlag, BsShieldCheck } from 'react-icons/bs';

export default function ReviewsAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/admin/reviews/analytics');
            if (response.data.success) {
                setAnalytics(response.data.data);
            } else {
                setError(response.data.message || 'Failed to load analytics');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadAnalyticsData();
        }
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div className="p-6 bg-slate-50 min-h-screen text-center text-gray-500">
                Loading reviews analytics...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-slate-50 min-h-screen">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 max-w-2xl mx-auto">
                    {error}
                </div>
            </div>
        );
    }

    const {
        totalReviews = 0,
        averageRating = 0,
        pendingCount = 0,
        reportedCount = 0,
        distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentReviews = []
    } = analytics || {};

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
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor product reviews volume, average rating performance and distribution trends</p>
                </div>

                {/* Grid Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <BsChatQuote size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{totalReviews}</div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Reviews</div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
                            <BsStarFill size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{Number(averageRating).toFixed(2)} / 5.0</div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Rating</div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 cursor-pointer hover:border-amber-400 transition" onClick={() => router.push('/reviews/moderation')}>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                            <BsShieldCheck size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Moderation</div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-400 transition" onClick={() => router.push('/reviews/reports')}>
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                            <BsFlag size={18} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{reportedCount}</div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Abuse Flagged</div>
                        </div>
                    </div>
                </div>

                {/* Rating Distribution & Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: breakdown */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm lg:col-span-5 space-y-4">
                        <h2 className="text-base font-bold text-gray-900">Rating Breakdown</h2>
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map(stars => {
                                const count = distribution[stars] || 0;
                                const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                                return (
                                    <div key={stars} className="flex items-center gap-3 text-xs">
                                        <span className="w-12 text-gray-600 font-semibold">{stars} Star</span>
                                        <div className="flex-1 h-3 bg-gray-150 rounded-full overflow-hidden border">
                                            <div 
                                                className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all" 
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-right text-gray-500 font-medium">{percent}%</span>
                                        <span className="w-8 text-right text-gray-400 font-medium">({count})</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: recent reviews */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm lg:col-span-7 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-base font-bold text-gray-900">Recent Customer Activity</h2>
                            <button onClick={() => router.push('/reviews/all')} className="text-xs font-bold text-[#EF6A22] hover:underline">View All</button>
                        </div>
                        
                        {recentReviews.length === 0 ? (
                            <div className="text-center py-8 text-xs text-gray-400 font-medium">No reviews written recently.</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {recentReviews.map(r => (
                                    <div key={r.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gray-800">{r.reviewerName}</span>
                                            <div className="flex items-center gap-0.5 text-yellow-400">
                                                {renderStars(r.rating)}
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold text-gray-700">{r.productName}</div>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{r.body || 'No description.'}</p>
                                        <div className="text-[10px] text-gray-400 text-right font-medium">
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
