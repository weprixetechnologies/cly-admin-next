"use client";
import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';

export default function AffiliateDirectoryPage() {
    const [affiliates, setAffiliates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAffiliates();
    }, []);

    const fetchAffiliates = async () => {
        try {
            const { data } = await axios.get('/affiliate/admin/affiliates');
            if (data.success) {
                setAffiliates(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        try {
            const { data } = await axios.patch(`/affiliate/admin/affiliates/${id}/status`, {
                status: newStatus
            });
            if (data.success) {
                fetchAffiliates();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Affiliate Directory</h1>
            
            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 text-left">User Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Referral Code</th>
                            <th className="px-4 py-2 text-left">Total Orders</th>
                            <th className="px-4 py-2 text-left">Earned (₹)</th>
                            <th className="px-4 py-2 text-left">Paid (₹)</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {affiliates.map((aff) => (
                            <tr key={aff.id} className="border-t">
                                <td className="px-4 py-2">{aff.name}</td>
                                <td className="px-4 py-2">{aff.emailID}</td>
                                <td className="px-4 py-2 font-mono">{aff.referral_code}</td>
                                <td className="px-4 py-2">{aff.total_orders}</td>
                                <td className="px-4 py-2">{aff.total_commission_earned}</td>
                                <td className="px-4 py-2">{aff.total_commission_paid}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${aff.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {aff.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <button 
                                        onClick={() => toggleStatus(aff.id, aff.status)}
                                        className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                                    >
                                        {aff.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {affiliates.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center py-4">No affiliates found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
