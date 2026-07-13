'use client'

import { useState, useEffect, use } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'react-toastify';
import PostEditorForm from '@/components/PostEditorForm';

export default function EditBlogPostPage({ params }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get(`/admin/blog/posts/${id}`);
                if (res.data?.success) {
                    setPost(res.data.data);
                } else {
                    toast.error('Post not found');
                }
            } catch (err) {
                console.error('Failed to load post details for editing:', err);
                toast.error('Failed to fetch post details');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPost();
    }, [id]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 font-serif tracking-tight">Edit Blog Post</h1>
                <p className="text-gray-500 text-sm mt-1">Modify your article, update linked products, and adjust SEO keywords.</p>
            </div>

            {loading ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-16 shadow-sm text-center text-gray-500">
                    Loading article details...
                </div>
            ) : post ? (
                <PostEditorForm initialData={post} isEdit={true} />
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl p-16 shadow-sm text-center text-red-500 font-medium">
                    Article could not be loaded.
                </div>
            )}
        </div>
    );
}
