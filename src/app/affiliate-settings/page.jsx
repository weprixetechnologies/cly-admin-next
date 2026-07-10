"use client";
import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';

export default function AffiliateSettingsPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [percentage, setPercentage] = useState('');
    const [cap, setCap] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get('/affiliate/admin/settings');
            if (data.success && data.data.length > 0) {
                setSettings(data.data[0]);
                setPercentage(data.data[0].commission_percentage);
                setCap(data.data[0].commission_cap_amount || '');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMsg('Saving...');
        try {
            const { data } = await axios.post('/affiliate/admin/settings', {
                commission_percentage: percentage, 
                commission_cap_amount: cap ? parseFloat(cap) : null 
            });
            if (data.success) {
                setMsg('Settings saved successfully!');
                fetchSettings();
            } else {
                setMsg(data.message || 'Error saving settings');
            }
        } catch (err) {
            setMsg('Error saving settings');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Affiliate Global Settings</h1>
            {msg && <div className="mb-4 text-blue-600">{msg}</div>}
            
            <form onSubmit={handleSave} className="max-w-md bg-white p-6 rounded shadow">
                <div className="mb-4">
                    <label className="block mb-2 font-semibold">Global Commission Percentage (%)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={percentage} 
                        onChange={(e) => setPercentage(e.target.value)} 
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-semibold">Global Commission Cap Amount (₹)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={cap} 
                        onChange={(e) => setCap(e.target.value)} 
                        className="w-full border p-2 rounded"
                        placeholder="Leave empty for no cap"
                    />
                    <small className="text-gray-500">Maximum commission payout allowed per order.</small>
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save Settings
                </button>
            </form>
        </div>
    );
}
