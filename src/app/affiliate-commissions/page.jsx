"use client";
import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';

export default function AffiliateCommissionsPage() {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        try {
            const { data } = await axios.get('/affiliate/admin/commissions');
            if (data.success) {
                setCommissions(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Affiliate Commissions Ledger</h1>
            
            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="min-w-full table-auto text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 text-left">Commission ID</th>
                            <th className="px-4 py-2 text-left">Order ID</th>
                            <th className="px-4 py-2 text-left">Affiliate ID</th>
                            <th className="px-4 py-2 text-left">Order Amount</th>
                            <th className="px-4 py-2 text-left">Comm. Amount</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Created At</th>
                            <th className="px-4 py-2 text-left">Payout ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commissions.map((c) => (
                            <tr key={c.id} className="border-t">
                                <td className="px-4 py-2">{c.id}</td>
                                <td className="px-4 py-2">{c.orderID}</td>
                                <td className="px-4 py-2">{c.affiliate_id}</td>
                                <td className="px-4 py-2 font-mono">₹{c.order_amount}</td>
                                <td className="px-4 py-2 font-bold text-green-600">₹{c.commission_amount}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${
                                        c.status === 'APPROVED' ? 'bg-green-500' :
                                        c.status === 'PAID' ? 'bg-blue-500' :
                                        c.status === 'VOIDED' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{new Date(c.created_at).toLocaleString()}</td>
                                <td className="px-4 py-2">{c.payout_id || '-'}</td>
                            </tr>
                        ))}
                        {commissions.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center py-4">No commissions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
