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
            name: 'Head Office',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            href: '/head-office',
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
        },
        {
            name: 'Visitors',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
            href: '/visitors',
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
        <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 h-screen fixed left-0 top-0 z-40 flex flex-col shadow-2xl border-r border-slate-700/50 backdrop-blur-sm">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-slate-700/50 flex-shrink-0 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
                <h1 className="text-white text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Cursive Letters Seller
                </h1>
                <p className="text-slate-400 text-xs mt-1">Admin Dashboard</p>
            </div>

            {/* Menu Items - Scrollable Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <nav className="mt-6">
                    <div className="px-4 mb-4">
                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                            Menu
                        </h3>
                    </div>

                    <ul className="space-y-1.5 px-3 pb-4">
                        {menuItems.map((item) => (
                            <li key={item.name}>
                                {item.hasSubmenu ? (
                                    <div>
                                        <button
                                            onClick={() => toggleMenu(item.name)}
                                            className={`group w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden ${isSubmenuActive(item.submenu)
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-center relative z-10">
                                                <span className={`mr-3 transition-transform duration-300 ${isSubmenuActive(item.submenu) ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                    {item.icon}
                                                </span>
                                                <span className="relative">{item.name}</span>
                                            </div>
                                            <svg
                                                className={`w-4 h-4 transition-all duration-300 relative z-10 ${expandedMenus[item.name] ? 'rotate-180' : ''
                                                    } ${isSubmenuActive(item.submenu) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                            {isSubmenuActive(item.submenu) && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-r-full"></div>
                                            )}
                                        </button>

                                        {/* Submenu */}
                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMenus[item.name] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                            }`}>
                                            <ul className="mt-1.5 space-y-1 ml-4 pl-4 border-l-2 border-slate-700/50">
                                                {item.submenu.map((subItem) => (
                                                    <li key={subItem.name}>
                                                        <Link
                                                            href={subItem.href}
                                                            className={`group relative block px-4 py-2.5 text-sm rounded-lg transition-all duration-300 ${isActive(subItem.href)
                                                                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-2 border-blue-400 shadow-md'
                                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30 hover:translate-x-1'
                                                                }`}
                                                        >
                                                            <span className="relative z-10 flex items-center">
                                                                <span className={`w-1.5 h-1.5 rounded-full mr-3 transition-all duration-300 ${isActive(subItem.href)
                                                                        ? 'bg-blue-400 shadow-lg shadow-blue-400/50'
                                                                        : 'bg-slate-500 group-hover:bg-slate-300'
                                                                    }`}></span>
                                                                {subItem.name}
                                                            </span>
                                                            {isActive(subItem.href) && (
                                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg"></div>
                                                            )}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 overflow-hidden ${isActive(item.href)
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                                            }`}
                                    >
                                        <span className={`mr-3 transition-transform duration-300 relative z-10 ${isActive(item.href) ? 'scale-110' : 'group-hover:scale-110'
                                            }`}>
                                            {item.icon}
                                        </span>
                                        <span className="relative z-10">{item.name}</span>
                                        {isActive(item.href) && (
                                            <>
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-r-full"></div>
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </>
                                        )}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-700/50 flex-shrink-0 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer group">
                    <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                            <span className="text-white text-sm font-bold">A</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-slate-800 rounded-full"></div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">Admin User</p>
                        <p className="text-slate-400 text-xs truncate">admin@example.com</p>
                    </div>
                    <svg
                        className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
