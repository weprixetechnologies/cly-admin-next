'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../utils/axiosInstance';

export default function AddProduct() {
    const [formData, setFormData] = useState({
        productName: '',
        productPrice: '',
        sku: '',
        description: '',
        boxQty: '',
        packQty: '',
        minQty: '1',
        categoryID: '',
        categoryName: '',
        inventory: '0',
        status: 'active'
    });
    const [featuredImage, setFeaturedImage] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess('');
    };

    // Load categories on component mount
    useEffect(() => {
        loadCategories();
    }, []);

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

    const handleFeaturedImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFeaturedImage(file);
        }
    };

    const handleGalleryImagesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            setError('Maximum 5 gallery images allowed');
            return;
        }
        setGalleryImages(files);
    };

    // Bunny.net configuration
    const storageZone = 'ithyaraa';
    const storageRegion = 'sg.storage.bunnycdn.com';
    const pullZoneUrl = 'https://ithyaraa.b-cdn.net';
    const apiKey = '7017f7c4-638b-48ab-add3858172a8-f520-4b88'; // ⚠️ Dev only

    // Upload a single file to BunnyCDN
    const uploadToBunny = async (file) => {
        const fileName = encodeURIComponent(file.name);
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

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${errorText}`);
        }

        return { imgUrl: publicUrl, imgAlt: file.name };
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

            // Upload images to Bunny.net
            let featuredImageUrl = '';
            let galleryImageUrls = [];

            // Upload featured image
            if (featuredImage) {
                const featuredResult = await uploadToBunny(featuredImage);
                featuredImageUrl = featuredResult.imgUrl;
            }

            // Upload gallery images
            if (galleryImages.length > 0) {
                const galleryPromises = galleryImages.map(file => uploadToBunny(file));
                const galleryResults = await Promise.all(galleryPromises);
                galleryImageUrls = galleryResults.map(result => result.imgUrl);
            }

            // Prepare product data for API
            const productData = {
                productName: formData.productName,
                productPrice: formData.productPrice,
                sku: formData.sku,
                description: formData.description,
                boxQty: formData.boxQty,
                packQty: formData.packQty,
                minQty: formData.minQty,
                categoryID: formData.categoryID,
                categoryName: formData.categoryName,
                inventory: formData.inventory,
                featuredImages: featuredImageUrl,
                galleryImages: galleryImageUrls
            };

            const response = await axiosInstance.post('/products/add', productData);

            if (response.data.success) {
                // Update category product count if category is selected
                if (formData.categoryID) {
                    try {
                        await axiosInstance.patch(`/categories/${formData.categoryID}/product-count`, {
                            increment: true
                        });
                    } catch (error) {
                        console.error('Failed to update category product count:', error);
                        // Don't show error to user as product was created successfully
                    }
                }

                setSuccess('Product added successfully!');
                setTimeout(() => {
                    router.push('/products/list');
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to add product');
            }
        } catch (error) {
            setError('Failed to add product');
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

    return (
        <>
            <style jsx>{`
                input::placeholder {
                    color: #c0c0c0 !important;
                }
                input {
                    color: #222 !important;
                }
                textarea::placeholder {
                    color: #c0c0c0 !important;
                }
                textarea {
                    color: #222 !important;
                }
                select {
                    color: #222 !important;
                }
            `}</style>
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-800">Add Product</h1>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label htmlFor="packQty" className="block text-sm font-medium text-slate-700 mb-2">
                                    Pack Quantity
                                </label>
                                <input
                                    type="number"
                                    id="packQty"
                                    name="packQty"
                                    value={formData.packQty}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                    Initial Inventory
                                </label>
                                <input
                                    type="number"
                                    id="inventory"
                                    name="inventory"
                                    value={formData.inventory}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4">
                            {/* Featured Image */}
                            <div>
                                <label htmlFor="featuredImage" className="block text-sm font-medium text-slate-700 mb-2">
                                    Featured Image *
                                </label>
                                <input
                                    type="file"
                                    id="featuredImage"
                                    accept="image/*"
                                    onChange={handleFeaturedImageChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                                {featuredImage && (
                                    <p className="text-sm text-green-600 mt-1">Selected: {featuredImage.name}</p>
                                )}
                            </div>

                            {/* Gallery Images */}
                            <div>
                                <label htmlFor="galleryImages" className="block text-sm font-medium text-slate-700 mb-2">
                                    Gallery Images (Max 5)
                                </label>
                                <input
                                    type="file"
                                    id="galleryImages"
                                    multiple
                                    accept="image/*"
                                    onChange={handleGalleryImagesChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                {galleryImages.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm text-green-600">Selected {galleryImages.length} images:</p>
                                        <ul className="text-sm text-gray-600 mt-1">
                                            {galleryImages.map((file, index) => (
                                                <li key={index}>• {file.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
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
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-400"
                            >
                                {isLoading ? 'Adding Product...' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
