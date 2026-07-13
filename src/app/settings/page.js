'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axiosInstance';

const SETTING_KEY = 'global_discount';

export default function SettingsPage() {
    const { isAuthenticated } = useAuth();
    const [percentage, setPercentage] = useState(12);
    const [inputValue, setInputValue] = useState('12');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success'|'error', text: string }

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchSetting();
    }, [isAuthenticated]);

    const fetchSetting = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`/settings/${SETTING_KEY}`);
            if (res.data?.success) {
                const val = parseFloat(res.data.value);
                const clamped = isNaN(val) ? 12 : Math.min(90, Math.max(0, val));
                setPercentage(clamped);
                setInputValue(String(clamped));
            }
        } catch (err) {
            console.error('Failed to load setting:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSliderChange = (e) => {
        const val = Number(e.target.value);
        setPercentage(val);
        setInputValue(String(val));
    };

    const handleInputChange = (e) => {
        const raw = e.target.value;
        setInputValue(raw);
        const val = parseFloat(raw);
        if (!isNaN(val)) {
            setPercentage(Math.min(90, Math.max(0, val)));
        }
    };

    const handleInputBlur = () => {
        const val = parseFloat(inputValue);
        if (isNaN(val)) {
            setInputValue(String(percentage));
        } else {
            const clamped = Math.min(90, Math.max(0, val));
            setPercentage(clamped);
            setInputValue(String(clamped));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);
            await axiosInstance.put(`/settings/${SETTING_KEY}`, { value: percentage });
            setMessage({ type: 'success', text: `Global discount updated to ${percentage}% — all product cards will reflect this instantly.` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save setting. Please try again.' });
        } finally {
            setSaving(false);
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

    // Example prices for preview — same formula as productCard
    // mrp × (1 - pct/100) = salePrice  →  mrp = salePrice / (1 - pct/100)
    const examplePrice = 100;
    const exampleMRP = percentage > 0 && percentage < 100
        ? (examplePrice / (1 - percentage / 100)).toFixed(0)
        : examplePrice;

    return (
        <>
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage global site configuration</p>
                </div>
            </header>

            <main className="p-6 max-w-3xl">

                {/* Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Card header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Global Discount Percentage</h2>
                                <p className="text-sm text-gray-500">
                                    Applied site-wide to all product cards. Products from Tally TCP show the actual price as the
                                    <strong> sale price</strong>; this percentage inflates the displayed <strong>original / MRP</strong> to create the strikethrough effect.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card body */}
                    <div className="px-6 py-6">
                        {loading ? (
                            <div className="flex items-center gap-3 py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-gray-500 text-sm">Loading current value…</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Slider + Number Input Row */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-gray-700">
                                            Discount Percentage
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="90"
                                                step="0.5"
                                                value={inputValue}
                                                onChange={handleInputChange}
                                                onBlur={handleInputBlur}
                                                className="w-20 text-center px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            />
                                            <span className="text-gray-600 font-semibold">%</span>
                                        </div>
                                    </div>

                                    {/* Slider */}
                                    <input
                                        type="range"
                                        min="0"
                                        max="90"
                                        step="0.5"
                                        value={percentage}
                                        onChange={handleSliderChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>0%</span>
                                        <span>45%</span>
                                        <span>90%</span>
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Live Preview</p>
                                    <div className="flex items-center gap-2">
                                        {/* Badge */}
                                        {percentage > 0 && (
                                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                                                {Math.round(percentage)}% OFF
                                            </span>
                                        )}
                                        {/* Sale Price */}
                                        <span className="text-xl font-bold text-red-500">₹{examplePrice}</span>
                                        {/* MRP Strikethrough */}
                                        {percentage > 0 && (
                                            <span className="text-sm text-gray-400 line-through">₹{exampleMRP}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        For a product priced at <strong>₹{examplePrice}</strong> from Tally:
                                        sale price stays <strong>₹{examplePrice}</strong>, MRP shown as <strong>₹{exampleMRP}</strong>.
                                    </p>
                                </div>

                                {/* Info box */}
                                <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>
                                        <strong>No product data is modified.</strong> This percentage is applied purely in the browser UI. The actual price in the cart and checkout remains the original Tally price.
                                    </p>
                                </div>

                                {/* Feedback message */}
                                {message && (
                                    <div className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${message.type === 'success'
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-red-50 border-red-200 text-red-700'
                                        }`}>
                                        {message.type === 'success' ? (
                                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        {message.text}
                                    </div>
                                )}

                                {/* Save button */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Saving…
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Save Settings
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
