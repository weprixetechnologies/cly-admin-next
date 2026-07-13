'use client'

import PostEditorForm from '@/components/PostEditorForm';

export default function AddBlogPostPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 font-serif tracking-tight">Create New Post</h1>
                <p className="text-gray-500 text-sm mt-1">Compose a new article for your shop blog, optimize SEO, and link products.</p>
            </div>

            <PostEditorForm isEdit={false} />
        </div>
    );
}
