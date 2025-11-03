'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const LayoutWrapper = ({ children }) => {
    const pathname = usePathname();
    const { isAuthenticated, isLoading } = useAuth();

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
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 w-0 min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default LayoutWrapper;
