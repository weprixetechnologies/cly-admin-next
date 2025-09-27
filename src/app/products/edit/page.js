'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../utils/cookies';

export default function EditProduct() {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        setIsLoading(false);
    }, [router]);

    if (isLoading) {
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
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Product</h2>
                    <p className="text-gray-600">Product edit form will be implemented here.</p>
                </div>
            </main>
        </>
    );
}
