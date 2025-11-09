'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import axiosInstance from '../../../../utils/axiosInstance';

export default function EditProduct() {
    const [formData, setFormData] = useState({
        productName: '',
        productPrice: '',
        sku: '',
        description: '',
        boxQty: '',
        minQty: '1',
        categoryID: '',
        categoryName: '',
        themeCategory: '',
        inventory: '0',
        status: 'active'
    });
    const [featuredImage, setFeaturedImage] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [existingImages, setExistingImages] = useState({
        featured: '',
        gallery: []
    });
    const [imagesToRemove, setImagesToRemove] = useState([]);
    const [categories, setCategories] = useState([]);
    const [originalCategoryID, setOriginalCategoryID] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const params = useParams();
    const productID = params.productID;

    useEffect(() => {
        if (isAuthenticated && productID) {
            loadProduct();
            loadCategories();
        }
    }, [isAuthenticated, productID]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/products/${productID}`);

            if (response.data.success) {
                const product = response.data.data;
                setFormData({
                    productName: product.productName || '',
                    productPrice: product.productPrice || '',
                    sku: product.sku || '',
                    description: product.description || '',
                    boxQty: product.boxQty || '',
                    minQty: product.minQty || '1',
                    categoryID: product.categoryID || '',
                    categoryName: product.categoryName || '',
                    themeCategory: product.themeCategory || '',
                    inventory: product.inventory || '0',
                    status: product.status || 'active'
                });

                // Store original category ID for count updates
                setOriginalCategoryID(product.categoryID || '');

                setExistingImages({
                    featured: product.featuredImages || '',
                    gallery: product.galleryImages || []
                });
            } else {
                setError(response.data.message || 'Failed to load product');
            }
        } catch (error) {
            setError('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await axiosInstance.get('/products/categories/list');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess('');
    };

    const handleFeaturedImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFeaturedImage(file);
        }
    };

    const handleGalleryImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setError('');
        setSuccess('');

        setGalleryImages(prev => {
            const existingCount = existingImages.gallery.length;
            const previousNewFiles = prev;

            // Merge previous new files with newly selected files, de-duplicating by name/size/lastModified
            const merged = [...previousNewFiles];
            const seen = new Set(previousNewFiles.map(f => `${f.name}-${f.size}-${f.lastModified}`));
            for (const file of files) {
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                if (!seen.has(key)) {
                    merged.push(file);
                    seen.add(key);
                }
            }

            // Enforce a maximum of 5 total images (existing + new)
            const allowedNew = Math.max(0, 5 - existingCount);
            if (merged.length > allowedNew) {
                setError(`You can add ${allowedNew} more image(s) (max 5 total).`);
                return merged.slice(0, allowedNew);
            }

            return merged;
        });

        // Clear the input so selecting the same file again will retrigger onChange
        e.target.value = '';
    };

    const removeExistingGalleryImage = (index) => {
        const imageToRemove = existingImages.gallery[index];
        setImagesToRemove(prev => [...prev, imageToRemove]);
        setExistingImages(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }));
    };

    const removeNewGalleryImage = (index) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    // Bunny.net configuration
    const storageZone = 'cly-bunny';
    const storageRegion = 'storage.bunnycdn.com';
    const pullZoneUrl = 'https://cly-pull-bunny.b-cdn.net';
    const apiKey = '22cfd8b3-8021-40a3-b100a9d48bc0-7dc3-4654'; // ⚠️ Dev only

    // Generate random 5-digit alphanumeric string
    const generateRandomAlphanumeric = () => {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Upload a single file to BunnyCDN
    const uploadToBunny = async (file) => {
        // Extract filename and extension
        const originalName = file.name;
        const lastDotIndex = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
        const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

        // Generate random 5-digit alphanumeric and append to filename
        const randomSuffix = generateRandomAlphanumeric();
        const newFileName = `${nameWithoutExt}_${randomSuffix}${extension}`;

        const fileName = encodeURIComponent(newFileName);
        const uploadUrl = `https://${storageRegion}/${storageZone}/${fileName}`;
        const publicUrl = `${pullZoneUrl}/${fileName}`;

        const res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                AccessKey: apiKey,
                'Content-Type': file.type,
            },
            body: file,
        });

        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        return { imgUrl: publicUrl, imgAlt: newFileName };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!formData.productName || !formData.productPrice || !formData.sku) {
                setError('Product name, price, and SKU are required');
                return;
            }

            // Handle image uploads
            let featuredImageUrl = existingImages.featured;
            let galleryImageUrls = [...existingImages.gallery]; // Keep existing images

            // Upload new featured image if selected
            if (featuredImage) {
                const featuredResult = await uploadToBunny(featuredImage);
                featuredImageUrl = featuredResult.imgUrl;
            }

            // Upload new gallery images if selected and add to existing ones
            if (galleryImages.length > 0) {
                const galleryPromises = galleryImages.map(file => uploadToBunny(file));
                const galleryResults = await Promise.all(galleryPromises);
                const newGalleryUrls = galleryResults.map(result => result.imgUrl);
                galleryImageUrls = [...galleryImageUrls, ...newGalleryUrls]; // Combine existing and new
            }

            // Prepare product data for API
            const productData = {
                productName: formData.productName,
                productPrice: formData.productPrice,
                sku: formData.sku,
                description: formData.description,
                boxQty: formData.boxQty,
                minQty: formData.minQty,
                categoryID: formData.categoryID,
                categoryName: formData.categoryName,
                themeCategory: formData.themeCategory || null,
                inventory: formData.inventory,
                status: formData.status,
                featuredImages: featuredImageUrl,
                galleryImages: galleryImageUrls
            };

            const response = await axiosInstance.put(`/products/${productID}`, productData);

            if (response.data.success) {
                setSuccess('Product updated successfully!');
                setTimeout(() => {
                    router.push(`/products/list`);
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to update product');
            }
        } catch (error) {
            setError('Failed to update product');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Product Information</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="productName" className="block text-sm font-medium text-slate-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    id="productName"
                                    name="productName"
                                    value={formData.productName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="productPrice" className="block text-sm font-medium text-slate-700 mb-2">
                                    Price *
                                </label>
                                <input
                                    type="number"
                                    id="productPrice"
                                    name="productPrice"
                                    value={formData.productPrice}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="sku" className="block text-sm font-medium text-slate-700 mb-2">
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    id="sku"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                    placeholder="Enter SKU"
                                />
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                placeholder="Enter product description"
                            />
                        </div>

                        {/* Quantity Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="boxQty" className="block text-sm font-medium text-slate-700 mb-2">
                                    Box Quantity
                                </label>
                                <input
                                    type="number"
                                    id="boxQty"
                                    name="boxQty"
                                    value={formData.boxQty}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>


                            <div>
                                <label htmlFor="minQty" className="block text-sm font-medium text-slate-700 mb-2">
                                    Minimum Quantity
                                </label>
                                <input
                                    type="number"
                                    id="minQty"
                                    name="minQty"
                                    value={formData.minQty}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                    placeholder="1"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Category and Inventory */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="categoryID" className="block text-sm font-medium text-slate-700 mb-2">
                                    Category
                                </label>
                                <select
                                    id="categoryID"
                                    name="categoryID"
                                    value={formData.categoryID}
                                    onChange={(e) => {
                                        const selectedCategory = categories.find(cat => cat.categoryID === e.target.value);
                                        setFormData(prev => ({
                                            ...prev,
                                            categoryID: e.target.value,
                                            categoryName: selectedCategory ? selectedCategory.categoryName : ''
                                        }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.categoryID} value={category.categoryID}>
                                            {category.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="inventory" className="block text-sm font-medium text-slate-700 mb-2">
                                    Inventory
                                </label>
                                <input
                                    type="number"
                                    id="inventory"
                                    name="inventory"
                                    value={formData.inventory}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Theme Category */}
                        <div>
                            <label htmlFor="themeCategory" className="block text-sm font-medium text-slate-700 mb-2">
                                Theme Category (Optional)
                            </label>
                            <input
                                type="text"
                                id="themeCategory"
                                name="themeCategory"
                                value={formData.themeCategory}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                placeholder="e.g., Birthday, Wedding, Corporate, etc."
                                maxLength={100}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Specify a theme category for this product (optional)
                            </p>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4">
                            {/* Featured Image */}
                            <div>
                                <label htmlFor="featuredImage" className="block text-sm font-medium text-slate-700 mb-2">
                                    Featured Image
                                </label>
                                {existingImages.featured && (
                                    <div className="mb-2">
                                        <p className="text-sm text-gray-600 mb-2">Current featured image:</p>
                                        <img
                                            src={existingImages.featured}
                                            alt="Current featured"
                                            className="h-20 w-20 object-cover rounded-md"
                                        />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="featuredImage"
                                    accept="image/*"
                                    onChange={handleFeaturedImageChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                />
                                {featuredImage && (
                                    <p className="text-sm text-green-600 mt-1">New image selected: {featuredImage.name}</p>
                                )}
                            </div>

                            {/* Gallery Images */}
                            <div>
                                <label htmlFor="galleryImages" className="block text-sm font-medium text-slate-700 mb-2">
                                    Gallery Images
                                </label>

                                {/* Existing Gallery Images */}
                                {existingImages.gallery.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-2">Current gallery images:</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {existingImages.gallery.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={image}
                                                        alt={`Gallery ${index + 1}`}
                                                        className="h-20 w-20 object-cover rounded-md border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingGalleryImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* New Gallery Images */}
                                {galleryImages.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm text-green-600 mb-2">New images to add:</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {galleryImages.map((file, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        className="h-20 w-20 object-cover rounded-md border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewGalleryImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add More Images Button */}
                                <div>
                                    <input
                                        type="file"
                                        id="galleryImages"
                                        multiple
                                        accept="image/*"
                                        onChange={handleGalleryImagesChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Add more images (max 5 total)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error and Success Messages */}
                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
                                {success}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => router.push('/products/list')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent disabled:bg-blue-400"
                            >
                                {isLoading ? 'Updating Product...' : 'Update Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
