'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const LayoutWrapper = ({ children }) => {
    const pathname = usePathname();
    const { isAuthenticated, isLoading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Pages that should not have sidebar and header
    const excludePages = ['/login', '/register', '/forgot-password', '/reset-password'];
    const shouldShowSidebar = !excludePages.includes(pathname);

    // Show loading spinner while checking authentication
    if (isLoading && !excludePages.includes(pathname)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated and not on excluded pages
    if (!isAuthenticated && !excludePages.includes(pathname)) {
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return null;
    }

    if (!shouldShowSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-4 left-4 z-30 lg:hidden bg-slate-800 text-white p-2 rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 w-full lg:ml-64 min-w-0 overflow-hidden pt-16 lg:pt-0">
                {children}
            </div>
        </div>
    );
};

export default LayoutWrapper;
