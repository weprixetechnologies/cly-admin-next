'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'react-toastify';

export default function BlogPostsPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPosts, setSelectedPosts] = useState([]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`/admin/blog/posts?page=${currentPage}&limit=10&search=${searchTerm}&status=${statusFilter}`);
            if (res.data) {
                setPosts(res.data.posts || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching admin blog posts:', error);
            toast.error('Failed to load blog posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
        setSelectedPosts([]);
    }, [currentPage, statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        loadPosts();
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await axiosInstance.patch(`/admin/blog/posts/${id}/status`, { status: newStatus });
            if (res.data?.success) {
                toast.success(`Post status updated to ${newStatus}`);
                loadPosts();
            }
        } catch (error) {
            console.error('Error changing post status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDelete = async (id, title) => {
        const confirmDelete = window.confirm(`Move "${title}" to archived posts?`);
        if (!confirmDelete) return;

        try {
            const res = await axiosInstance.delete(`/admin/blog/posts/${id}`);
            if (res.data?.success) {
                toast.success('Post archived successfully');
                loadPosts();
            }
        } catch (error) {
            console.error('Error archiving post:', error);
            toast.error('Failed to archive post');
        }
    };

    const handleHardDelete = async (id, title) => {
        const confirmDelete = window.confirm(`WARNING: Permanently delete "${title}"? This cannot be undone!`);
        if (!confirmDelete) return;

        try {
            const res = await axiosInstance.delete(`/admin/blog/posts/${id}?confirm_hard_delete=true`);
            if (res.data?.success) {
                toast.success('Post permanently deleted');
                loadPosts();
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete post');
        }
    };

    // Bulk selection helpers
    const toggleSelectPost = (id) => {
        if (selectedPosts.includes(id)) {
            setSelectedPosts(selectedPosts.filter(pId => pId !== id));
        } else {
            setSelectedPosts([...selectedPosts, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedPosts.length === posts.length) {
            setSelectedPosts([]);
        } else {
            setSelectedPosts(posts.map(p => p.id));
        }
    };

    const handleBulkStatus = async (newStatus) => {
        if (selectedPosts.length === 0) return;
        if (!window.confirm(`Update status of ${selectedPosts.length} selected post(s) to "${newStatus}"?`)) return;

        try {
            const promises = selectedPosts.map(id => 
                axiosInstance.patch(`/admin/blog/posts/${id}/status`, { status: newStatus })
            );
            await Promise.all(promises);
            toast.success(`Updated ${selectedPosts.length} post(s) successfully`);
            setSelectedPosts([]);
            loadPosts();
        } catch (error) {
            console.error('Bulk update error:', error);
            toast.error('Some updates failed to execute');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header block */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 font-serif tracking-tight">Blog Posts</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage articles, scheduling, and publish logs.</p>
                </div>
                <Link
                    href="/blog/posts/add"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-amber-600/25 transition-all text-center"
                >
                    + Add Blog Post
                </Link>
            </div>

            {/* Filters Row */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title..."
                        className="bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all w-full md:w-64"
                    />
                    <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors">
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Banner */}
            {selectedPosts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center justify-between flex-wrap gap-3 animate-in slide-in-from-top-2 duration-150">
                    <span className="text-sm text-amber-800 font-semibold">{selectedPosts.length} posts selected</span>
                    <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                        <button onClick={() => handleBulkStatus('published')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg shadow-sm transition-colors">
                            Publish Selected
                        </button>
                        <button onClick={() => handleBulkStatus('draft')} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-sm transition-colors">
                            Move to Draft
                        </button>
                        <button onClick={() => handleBulkStatus('archived')} className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded-lg shadow-sm transition-colors">
                            Archive Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Table list */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-gray-500">Loading blog posts...</div>
                ) : posts.length === 0 ? (
                    <div className="p-16 text-center text-gray-400">No blog posts found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase bg-gray-50/20">
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedPosts.length === posts.length}
                                            onChange={toggleSelectAll}
                                            className="cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Author</th>
                                    <th className="px-6 py-4">Views</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Release Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {posts.map(post => (
                                    <tr key={post.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedPosts.includes(post.id)}
                                                onChange={() => toggleSelectPost(post.id)}
                                                className="cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 max-w-sm truncate">
                                            <div>
                                                <span className="hover:text-amber-600 transition-colors">{post.title}</span>
                                                {post.is_featured === 1 && (
                                                    <span className="ml-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{post.slug}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{post.categoryName || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{post.authorName || 'Expert'}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-700">{post.view_count}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                post.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
                                                post.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                                                post.status === 'archived' ? 'bg-amber-50 text-amber-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                            {post.status === 'published' && post.published_at 
                                                ? new Date(post.published_at).toLocaleString() 
                                                : post.status === 'scheduled' && post.scheduled_for 
                                                ? `Scheduled: ${new Date(post.scheduled_for).toLocaleString()}`
                                                : 'Not set'}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-1 flex items-center justify-end h-full">
                                            <Link
                                                href={`/blog/posts/edit/${post.id}`}
                                                className="text-amber-600 hover:text-amber-700 font-medium text-xs bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                            >
                                                Edit
                                            </Link>
                                            {post.status !== 'published' && (
                                                <button
                                                    onClick={() => handleStatusChange(post.id, 'published')}
                                                    className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Publish
                                                </button>
                                            )}
                                            {post.status !== 'archived' ? (
                                                <button
                                                    onClick={() => handleDelete(post.id, post.title)}
                                                    className="text-amber-700 hover:text-amber-800 font-medium text-xs bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Archive
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleHardDelete(post.id, post.title)}
                                                    className="text-red-600 hover:text-red-700 font-medium text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
