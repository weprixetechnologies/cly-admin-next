'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
    const [expandedMenus, setExpandedMenus] = useState({});
    const pathname = usePathname();

    const toggleMenu = (menuName) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuName]: !prev[menuName]
        }));
    };

    const menuItems = [
        {
            name: 'Home',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
            ),
            href: '/dashboard',
            hasSubmenu: false
        },
        {
            name: 'Products',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            hasSubmenu: true,
            submenu: [
                { name: 'Add Product', href: '/products/add' },
                { name: 'Edit Product', href: '/products/edit' },
                { name: 'List Product', href: '/products/list' }
            ]
        },
        {
            name: 'Orders',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
            ),
            hasSubmenu: true,
            submenu: [
                { name: 'All Orders', href: '/orders/all' },
                { name: 'Accepted Orders', href: '/orders/accepted' },
                { name: 'Rejected Orders', href: '/orders/rejected' }
            ]
        },
        {
            name: 'Users',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
            ),
            hasSubmenu: true,
            submenu: [
                { name: 'All Users', href: '/users/all' },
                { name: 'Add User', href: '/users/add' }
            ]
        },
        {
            name: 'Categories',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            hasSubmenu: true,
            submenu: [
                { name: 'Add Category', href: '/categories/add' },
                { name: 'List Categories', href: '/categories/list' }
            ]
        },
        {
            name: 'Sliders',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            hasSubmenu: true,
            submenu: [
                { name: 'Add Slider', href: '/sliders/add' },
                { name: 'List Sliders', href: '/sliders/list' }
            ]
        },
        {
            name: 'Policies',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            href: '/policies',
            hasSubmenu: false
        },
        {
            name: 'Contact Details',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            href: '/contact',
            hasSubmenu: false
        },
        {
            name: 'FAQ Management',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: '/faq',
            hasSubmenu: false
        },
        {
            name: 'About Us Management',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            href: '/about',
            hasSubmenu: false
        }
    ];

    const isActive = (href) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(href);
    };

    const isSubmenuActive = (submenu) => {
        return submenu.some(item => pathname === item.href);
    };

    return (
        <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 z-40 flex flex-col">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-slate-700 flex-shrink-0">
                <h1 className="text-white text-xl font-bold">Cursive Letters Seller</h1>
            </div>

            {/* Menu Items - Scrollable Container */}
            <div className="flex-1 overflow-y-auto">
                <nav className="mt-6">
                    <div className="px-4">
                        <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
                            Menu
                        </h3>
                    </div>

                    <ul className="space-y-1 px-3 pb-4">
                        {menuItems.map((item) => (
                            <li key={item.name}>
                                {item.hasSubmenu ? (
                                    <div>
                                        <button
                                            onClick={() => toggleMenu(item.name)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isSubmenuActive(item.submenu)
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-200 hover:bg-slate-700 hover:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <span className="mr-3">{item.icon}</span>
                                                {item.name}
                                            </div>
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-200 ${expandedMenus[item.name] ? 'rotate-180' : ''
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Submenu */}
                                        {expandedMenus[item.name] && (
                                            <ul className="mt-1 space-y-1 ml-6">
                                                {item.submenu.map((subItem) => (
                                                    <li key={subItem.name}>
                                                        <Link
                                                            href={subItem.href}
                                                            className={`block px-3 py-2 text-sm rounded-md transition-colors duration-200 ${isActive(subItem.href)
                                                                ? 'bg-transparent text-white border border-white'
                                                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                                                }`}
                                                        >
                                                            {subItem.name}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive(item.href)
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-200 hover:bg-slate-700 hover:text-white'
                                            }`}
                                    >
                                        <span className="mr-3">{item.icon}</span>
                                        {item.name}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-700 flex-shrink-0">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">A</span>
                    </div>
                    <div className="ml-3">
                        <p className="text-white text-sm font-medium">Admin User</p>
                        <p className="text-slate-300 text-xs">admin@example.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
