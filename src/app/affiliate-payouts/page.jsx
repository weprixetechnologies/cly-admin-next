"use client";
import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';

export default function AffiliatePayoutsPage() {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const { data } = await axios.get('/affiliate/admin/payouts/pending');
            if (data.success) {
                setPending(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePayout = async (affiliateId, totalAmount) => {
        setMsg('Processing payout...');
        try {
            const { data } = await axios.post('/affiliate/admin/payouts', {
                affiliate_id: affiliateId,
                transaction_reference: `MANUAL_PAYOUT_${Date.now()}`,
                admin_notes: 'Paid via manual trigger'
            });
            if (data.success) {
                setMsg(`Payout of ₹${totalAmount} processed successfully for Affiliate ${affiliateId}!`);
                fetchPending(); // refresh the list
            } else {
                setMsg(data.message || 'Error processing payout');
            }
        } catch (err) {
            setMsg('Error processing payout');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Affiliate Payouts</h1>
            {msg && <div className="mb-4 text-blue-600 bg-blue-50 p-3 rounded">{msg}</div>}
            
            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 text-left">Affiliate ID</th>
                            <th className="px-4 py-2 text-left">User Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Unpaid Commissions</th>
                            <th className="px-4 py-2 text-left">Total Pending (₹)</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pending.map((p) => (
                            <tr key={p.affiliate_id} className="border-t">
                                <td className="px-4 py-2">{p.affiliate_id}</td>
                                <td className="px-4 py-2">{p.name}</td>
                                <td className="px-4 py-2">{p.emailID}</td>
                                <td className="px-4 py-2">{p.unpaid_commissions_count}</td>
                                <td className="px-4 py-2 font-bold text-green-600">₹{p.total_pending_amount}</td>
                                <td className="px-4 py-2">
                                    <button 
                                        onClick={() => handleCreatePayout(p.affiliate_id, p.total_pending_amount)}
                                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                    >
                                        Mark as Paid
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {pending.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-4">No pending payouts found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
