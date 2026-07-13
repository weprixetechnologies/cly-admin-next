'use client'

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'react-toastify';
import RichTextEditor from '@/components/RichTextEditor';

export default function PostEditorForm({ initialData = null, isEdit = false }) {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [category_id, setCategoryId] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [coverImageAlt, setCoverImageAlt] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [tagsInput, setTagsInput] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    
    // SEO fields
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [canonicalUrl, setCanonicalUrl] = useState('');
    const [ogImageUrl, setOgImageUrl] = useState('');

    // Local file state
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [uploadingCover, setUploadingCover] = useState(false);

    // Bunny CDN configuration (same as products/add)
    const BUNNY_STORAGE_ZONE = 'cly-bunny';
    const BUNNY_STORAGE_REGION = 'storage.bunnycdn.com';
    const BUNNY_PULL_ZONE = 'https://cly-pull-bunny.b-cdn.net';
    const BUNNY_API_KEY = '22cfd8b3-8021-40a3-b100a9d48bc0-7dc3-4654';

    const generateRandomSuffix = () => {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    };

    const uploadToBunny = async (file) => {
        const originalName = file.name;
        const lastDot = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
        const ext = lastDot > 0 ? originalName.substring(lastDot) : '';
        const newFileName = `${nameWithoutExt}_${generateRandomSuffix()}${ext}`;

        // Only encode the filename — do NOT encode the '/' in the path
        const objectKey = `blog/${encodeURIComponent(newFileName)}`;
        const uploadUrl = `https://${BUNNY_STORAGE_REGION}/${BUNNY_STORAGE_ZONE}/${objectKey}`;
        const publicUrl = `${BUNNY_PULL_ZONE}/${objectKey}`;

        const res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { AccessKey: BUNNY_API_KEY, 'Content-Type': file.type },
            body: file,
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Bunny CDN upload failed: ${res.status} - ${errText}`);
        }
        return publicUrl;
    };

    useEffect(() => {
        // Load dependencies
        const loadDependencies = async () => {
            try {
                const [catRes, prodRes] = await Promise.all([
                    axiosInstance.get('/blog/categories'),
                    axiosInstance.get('/products/list?limit=100')
                ]);
                
                setCategories(catRes.data?.data || []);
                setAllProducts(prodRes.data?.data?.products || []);
            } catch (err) {
                console.error('Failed to load form dependencies:', err);
                toast.error('Failed to initialize editor options');
            }
        };
        
        loadDependencies();
    }, []);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setSlug(initialData.slug || '');
            setCategoryId(initialData.category_id || '');
            setExcerpt(initialData.excerpt || '');
            setContent(initialData.content || '');
            setCoverImageUrl(initialData.cover_image_url || '');
            setCoverImageAlt(initialData.cover_image_alt || '');
            setIsFeatured(initialData.is_featured === 1 || initialData.is_featured === true);
            setMetaTitle(initialData.meta_title || '');
            setMetaDescription(initialData.meta_description || '');
            setCanonicalUrl(initialData.canonical_url || '');
            setOgImageUrl(initialData.og_image_url || '');
            
            if (initialData.tags) {
                setTagsInput(initialData.tags.map(t => t.name).join(', '));
            }
            if (initialData.products) {
                setSelectedProductIds(initialData.products.map(p => p.id));
            }
        }
    }, [initialData]);

    // Handle file selection — just stage it, don't upload yet
    const handleCoverFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCoverImageFile(file);
    };

    // Triggered by the manual Upload button
    const handleCoverUpload = async () => {
        if (!coverImageFile) return;
        try {
            setUploadingCover(true);
            const publicUrl = await uploadToBunny(coverImageFile);
            setCoverImageUrl(publicUrl);
            setCoverImageFile(null);
            toast.success('Cover image uploaded successfully');
        } catch (error) {
            console.error('Cover photo upload error:', error);
            toast.error('Failed to upload cover photo');
        } finally {
            setUploadingCover(false);
        }
    };

    // Submit handler
    const handleSubmit = async (status = 'draft') => {
        if (!title.trim() || !content.trim()) {
            toast.error('Title and Content are required.');
            return;
        }

        try {
            setSubmitting(true);
            const parsedTags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
            
            const payload = {
                title,
                slug,
                category_id: category_id || null,
                excerpt,
                content,
                cover_image_url: coverImageUrl,
                cover_image_alt: coverImageAlt,
                is_featured: isFeatured,
                meta_title: metaTitle,
                meta_description: metaDescription,
                canonical_url: canonicalUrl,
                og_image_url: ogImageUrl,
                tags: parsedTags,
                productIds: selectedProductIds
            };

            let res;
            if (isEdit) {
                res = await axiosInstance.put(`/admin/blog/posts/${initialData.id}`, payload);
                if (res.data?.success) {
                    await axiosInstance.patch(`/admin/blog/posts/${initialData.id}/status`, { status });
                    toast.success('Post updated successfully');
                    router.push('/blog/posts');
                }
            } else {
                res = await axiosInstance.post('/admin/blog/posts', payload);
                if (res.data?.success) {
                    const createdId = res.data.data.id;
                    await axiosInstance.patch(`/admin/blog/posts/${createdId}/status`, { status });
                    toast.success('Post created successfully');
                    router.push('/blog/posts');
                }
            }
        } catch (error) {
            console.error('Error saving post:', error);
            toast.error(error.response?.data?.message || 'Failed to save blog post');
        } finally {
            setSubmitting(false);
        }
    };

    // Client-side SEO Checklist calculations
    const seoChecklist = useMemo(() => {
        const textOnly = content.replace(/<[^>]*>/g, '');
        const wordCount = textOnly.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        return {
            wordCount: {
                status: wordCount >= 300 ? 'pass' : 'warn',
                message: `Word count: ${wordCount} (Recommended: 300+)`
            },
            titleLen: {
                status: title.length >= 30 && title.length <= 60 ? 'pass' : 'warn',
                message: `Title length: ${title.length} characters (Recommended: 30-60)`
            },
            metaTitleLen: {
                status: metaTitle.length >= 30 && metaTitle.length <= 60 ? 'pass' : 'warn',
                message: `Meta Title: ${metaTitle.length} characters (Recommended: 30-60)`
            },
            metaDescLen: {
                status: metaDescription.length >= 80 && metaDescription.length <= 160 ? 'pass' : 'warn',
                message: `Meta Desc: ${metaDescription.length} characters (Recommended: 80-160)`
            },
            coverAlt: {
                status: coverImageUrl ? (coverImageAlt.trim().length > 0 ? 'pass' : 'fail') : 'pass',
                message: coverImageUrl 
                    ? (coverImageAlt.trim().length > 0 ? 'Cover Image alt text verified' : 'Cover Image alt text missing')
                    : 'No cover image'
            },
            headings: {
                status: (content.includes('<h2>') || content.includes('##')) ? 'pass' : 'fail',
                message: (content.includes('<h2>') || content.includes('##')) ? 'Has Heading 2 subheadings' : 'Missing Heading 2 (h2) subheadings'
            },
            productLinks: {
                status: selectedProductIds.length > 0 ? 'pass' : 'warn',
                message: selectedProductIds.length > 0 
                    ? `Linked to ${selectedProductIds.length} related product(s)`
                    : 'No commercial product links'
            }
        };
    }, [title, content, metaTitle, metaDescription, coverImageUrl, coverImageAlt, selectedProductIds]);

    const toggleProductSelect = (id) => {
        if (selectedProductIds.includes(id)) {
            setSelectedProductIds(selectedProductIds.filter(pId => pId !== id));
        } else {
            setSelectedProductIds([...selectedProductIds, id]);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left side: Editor panel */}
            <form onSubmit={(e) => e.preventDefault()} className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Article Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="How to Master Calligraphy in 30 Days"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-900 placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Custom URL Slug (Optional)
                            </label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="master-calligraphy-30-days"
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Category Selection
                            </label>
                            <select
                                value={category_id}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800 cursor-pointer bg-white"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Article Excerpt / Summary
                        </label>
                        <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Provide a short summaries (1-2 sentences) of this blog post to showcase on listings page and search cards."
                            rows="2"
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Body Content
                        </label>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Write your article details here. You can insert headings, tables, code blocks, bold text, links, and local photos!"
                        />
                    </div>
                </div>
            </form>

            {/* Right side: Settings & SEO panel */}
            <div className="lg:col-span-4 space-y-6">
                {/* Save Actions */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-3">
                    <h3 className="font-serif font-bold text-gray-900 text-lg border-b border-gray-100 pb-3 mb-2">Publish Console</h3>
                    <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                        <button
                            type="button"
                            onClick={() => handleSubmit('draft')}
                            disabled={submitting}
                            className="flex-1 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Save Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit('published')}
                            disabled={submitting}
                            className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20 transition-all"
                        >
                            {submitting ? 'Publishing...' : 'Publish Post'}
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="featuredCheck"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                            className="cursor-pointer rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="featuredCheck" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                            Pin as Featured Article
                        </label>
                    </div>
                </div>

                {/* Cover Image Selection */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-serif font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Cover Image</h3>
                    
                    {coverImageUrl && (
                        <div className="relative h-40 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                            <img src={coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => { setCoverImageUrl(''); setCoverImageFile(null); }}
                                className="absolute top-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs hover:bg-black transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Choose File
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileChange}
                            className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 transition-all"
                            disabled={uploadingCover}
                        />
                    </div>

                    {/* Selected file name + Upload button */}
                    {coverImageFile && (
                        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-amber-800 font-medium truncate flex-1">{coverImageFile.name}</span>
                            <button
                                type="button"
                                onClick={handleCoverUpload}
                                disabled={uploadingCover}
                                className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                            >
                                {uploadingCover ? (
                                    <>
                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Cover Image Alt Description (SEO Required)
                        </label>
                        <input
                            type="text"
                            value={coverImageAlt}
                            onChange={(e) => setCoverImageAlt(e.target.value)}
                            placeholder="An antique brass fountain pen lying on handmade paper"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                        />
                    </div>
                </div>

                {/* Reactive SEO Checklist */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-serif font-bold text-gray-900 text-lg border-b border-gray-100 pb-3 mb-4">SEO Checklist</h3>
                    <ul className="space-y-3.5 text-xs font-medium">
                        {Object.entries(seoChecklist).map(([key, item]) => (
                            <li key={key} className="flex gap-2.5 items-start">
                                <span className={`text-sm shrink-0 leading-none ${
                                    item.status === 'pass' ? 'text-emerald-500' :
                                    item.status === 'warn' ? 'text-amber-500' : 'text-red-500'
                                }`}>
                                    {item.status === 'pass' ? '●' : item.status === 'warn' ? '▲' : '■'}
                                </span>
                                <span className={
                                    item.status === 'pass' ? 'text-gray-700' :
                                    item.status === 'warn' ? 'text-amber-700 font-semibold' : 'text-red-600 font-semibold'
                                }>
                                    {item.message}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Related Products selector */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 max-h-[350px] flex flex-col">
                    <h3 className="font-serif font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Link Related Products</h3>
                    <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                        {allProducts.length === 0 ? (
                            <p className="text-gray-400 text-xs">No products loaded.</p>
                        ) : (
                            allProducts.map(prod => (
                                <div
                                    key={prod.productID}
                                    onClick={() => toggleProductSelect(prod.productID)}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-amber-300 transition-all cursor-pointer ${
                                        selectedProductIds.includes(prod.productID)
                                            ? 'bg-amber-50/50 border-amber-500 shadow-sm'
                                            : ''
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.includes(prod.productID)}
                                        onChange={() => {}} // Controlled by outer click
                                        className="cursor-pointer rounded text-amber-600 focus:ring-amber-500 shrink-0"
                                    />
                                    {prod.featuredImages && (
                                        <img
                                            src={prod.featuredImages}
                                            alt={prod.productName}
                                            className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100 shrink-0"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs text-gray-900 truncate">{prod.productName}</p>
                                        <p className="text-[10px] text-amber-600 font-bold">₹{Number(prod.productPrice).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* SEO Overrides Panel */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-serif font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">SEO Overrides</h3>
                    
                    <div>
                        <label className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            <span>Meta Title Override</span>
                            <span className={metaTitle.length >= 30 && metaTitle.length <= 60 ? 'text-emerald-600' : 'text-amber-600'}>
                                {metaTitle.length}/60 chars
                            </span>
                        </label>
                        <input
                            type="text"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            placeholder="Master Calligraphy: The Complete 30-Day Guide"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                        />
                    </div>

                    <div>
                        <label className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            <span>Meta Description Override</span>
                            <span className={metaDescription.length >= 80 && metaDescription.length <= 160 ? 'text-emerald-600' : 'text-amber-600'}>
                                {metaDescription.length}/160 chars
                            </span>
                        </label>
                        <textarea
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            placeholder="Discover the step-by-step techniques to improve your handwriting speed and master calligraphy styles with our experts."
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Tags / Keywords (Comma separated)
                        </label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="calligraphy, fountain-pens, guides"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Canonical URL Override
                        </label>
                        <input
                            type="url"
                            value={canonicalUrl}
                            onChange={(e) => setCanonicalUrl(e.target.value)}
                            placeholder="https://cursiveletters.in/blog/master-calligraphy-30-days"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            OpenGraph Image URL Override
                        </label>
                        <input
                            type="url"
                            value={ogImageUrl}
                            onChange={(e) => setOgImageUrl(e.target.value)}
                            placeholder="https://cursiveletters.in/og-master-calligraphy.png"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
