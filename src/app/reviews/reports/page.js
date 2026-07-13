'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';
import { BsStarFill, BsTrash, BsCheck } from 'react-icons/bs';

export default function AbuseReportsList() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const loadAbuseReports = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/admin/reviews/reports?page=${currentPage}&limit=20`);
            if (response.data.success) {
                setReports(response.data.data || []);
                const totalCount = response.data.pagination?.totalReports || (response.data.data || []).length;
                setTotalPages(Math.max(1, Math.ceil(totalCount / 20)));
            } else {
                setError(response.data.message || 'Failed to load abuse reports');
            }
        } catch (error) {
            console.error('Error loading abuse reports:', error);
            setError('Failed to load abuse reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadAbuseReports();
        }
    }, [isAuthenticated, currentPage]);

    const handleDismissReport = async (reportID) => {
        try {
            const res = await axiosInstance.patch(`/admin/reviews/reports/${reportID}`, { status: 'dismissed' });
            if (res.data.success) {
                alert('Report dismissed successfully');
                loadAbuseReports();
            } else {
                alert(res.data.message || 'Failed to resolve report');
            }
        } catch (error) {
            console.error('Error resolving report:', error);
            alert(error.response?.data?.message || 'Failed to resolve report');
        }
    };

    const handleDeleteReview = async (reviewID) => {
        if (!confirm('Are you sure you want to delete this reported review? This will resolve the report and delete the review permanently.')) {
            return;
        }

        try {
            const res = await axiosInstance.delete(`/admin/reviews/${reviewID}`);
            if (res.data.success) {
                alert('Review deleted successfully and report resolved');
                loadAbuseReports();
            } else {
                alert(res.data.message || 'Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting reported review:', error);
            alert(error.response?.data?.message || 'Failed to delete review');
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
                        <h1 className="text-2xl font-bold text-gray-900">Abuse Reports</h1>
                        <p className="text-sm text-gray-500 mt-1">Review flagged comments, details, reporter claims and take immediate action</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading abuse reports...</div>
                ) : reports.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl py-16 text-center shadow-sm">
                        <div className="text-gray-400 text-lg font-semibold mb-2">No Reports Filed</div>
                        <p className="text-sm text-gray-500">There are no flagged reviews currently reported by users.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
                                <div className="flex-1 space-y-4">
                                    {/* Report Details Banner */}
                                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                                        <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Report Details</div>
                                        <div className="text-sm text-gray-800 font-semibold mb-1">Reason: <span className="font-bold text-red-800">{report.reason}</span></div>
                                        <div className="text-xs text-gray-400">
                                            Reported by UID: <span className="font-semibold text-gray-600">{report.reporterUid}</span> • {new Date(report.createdAt).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Product and Original Review Card */}
                                    <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/40">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Original Review</div>
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-2 mb-3">
                                            <img 
                                                src={report.productFeaturedImage || 'https://picsum.photos/100/100?random=prod'} 
                                                alt={report.productName} 
                                                className="w-8 h-8 object-cover rounded-md border"
                                            />
                                            <div>
                                                <div className="text-xs font-bold text-gray-850">{report.productName || 'Unknown Product'}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">By: {report.reviewerName}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-0.5 mb-1.5">
                                                {renderStars(report.rating)}
                                            </div>
                                            {report.reviewTitle && <h4 className="text-xs font-bold text-gray-900 mb-1">{report.reviewTitle}</h4>}
                                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{report.reviewBody || 'No description'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Block */}
                                <div className="flex md:flex-col gap-2 w-full md:w-auto self-stretch md:self-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                                    <button
                                        onClick={() => handleDismissReport(report.id)}
                                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-lg transition active:scale-[0.98]"
                                    >
                                        <BsCheck size={18} />
                                        <span>Dismiss Report</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteReview(report.reviewID)}
                                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition active:scale-[0.98]"
                                    >
                                        <BsTrash size={15} />
                                        <span>Delete Review</span>
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
        </main>
    );
}
