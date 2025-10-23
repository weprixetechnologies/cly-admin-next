'use client';
import React, { useEffect, useState } from 'react'
import axios from '../../../../utils/axiosInstance'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

export default function OrderDetails({ params }) {
    const router = useRouter()
    const resolvedParams = React.use(params)
    const { orderID } = resolvedParams
    const [loading, setLoading] = useState(true)
    const [orderItems, setOrderItems] = useState([])
    const [orderStatus, setOrderStatus] = useState('pending')
    const [saving, setSaving] = useState(false)
    const [forceChange, setForceChange] = useState(false)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await axios.get(`/order/admin/${orderID}`)
                const rows = data?.data || []
                console.log('[OrderDetails] rows from orders table:', rows)
                setOrderItems(rows)
                if (rows.length > 0) setOrderStatus(rows[0].orderStatus || 'pending')
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchOrder()
    }, [orderID])

    const updateStatus = async (status) => {
        try {
            setSaving(true)
            const { data } = await axios.put(`/order/admin/${orderID}/status`, { orderStatus: status })
            if (data?.success === false) {
                console.error('[UpdateStatus] API error:', data.message, data.error)
            } else {
                setOrderStatus(status)
                setForceChange(false)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const exportToExcel = async () => {
        try {
            setExporting(true)

            // Prepare order summary data
            const orderSummary = {
                'Order ID': orderID,
                'User UID': orderItems[0]?.uid || '-',
                'Status': orderStatus,
                'Created At': orderItems[0]?.createdAt ? new Date(orderItems[0].createdAt).toLocaleString() : '-',
                'Updated At': orderItems[0]?.updatedAt ? new Date(orderItems[0].updatedAt).toLocaleString() : '-',
                'Total Items': totalItems,
                'Payment Mode': orderItems[0]?.paymentMode || '-',
                'Coupon Code': orderItems[0]?.couponCode || '-',
                'Address Name': orderItems[0]?.addressName || '-',
                'Address Phone': orderItems[0]?.addressPhone || '-',
                'Address Line 1': orderItems[0]?.addressLine1 || '-',
                'Address Line 2': orderItems[0]?.addressLine2 || '-',
                'City': orderItems[0]?.addressCity || '-',
                'State': orderItems[0]?.addressState || '-',
                'Pincode': orderItems[0]?.addressPincode || '-'
            }

            // Prepare items data
            const itemsData = orderItems.map((item, index) => ({
                'S.No': index + 1,
                'Product ID': item.productID,
                'Product Name': item.productName,
                'Box Qty': item.boxes || 0,
                'Units': item.units || 0,
                'Total Qty': (item.units || 0) + (item.boxes || 0),
                'Created At': item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'
            }))

            // Create workbook with multiple sheets
            const wb = XLSX.utils.book_new()

            // Add order summary sheet
            const ws1 = XLSX.utils.json_to_sheet([orderSummary])
            XLSX.utils.book_append_sheet(wb, ws1, 'Order Summary')

            // Add items sheet
            const ws2 = XLSX.utils.json_to_sheet(itemsData)
            XLSX.utils.book_append_sheet(wb, ws2, 'Order Items')

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
            const filename = `Order_${orderID}_${timestamp}.xlsx`

            // Save file
            XLSX.writeFile(wb, filename)

        } catch (error) {
            console.error('Export failed:', error)
            alert('Export failed. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order...</p>
                </div>
            </div>
        )
    }

    const totalItems = orderItems.reduce((sum, it) => sum + (it.units || 0) + (it.boxes || 0), 0)

    return (
        <>
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order {orderID}</h1>
                        <p className="text-sm text-gray-700">Status: <span className="font-semibold text-gray-900">{orderStatus}</span> • Items: {totalItems}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {orderStatus === 'pending' || forceChange ? (
                            <>
                                <button disabled={saving} onClick={() => updateStatus('pending')} className="px-3 py-2 text-sm rounded border bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50">Pending</button>
                                <button disabled={saving} onClick={() => updateStatus('accepted')} className="px-3 py-2 text-sm rounded border bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Accept</button>
                                <button disabled={saving} onClick={() => updateStatus('rejected')} className="px-3 py-2 text-sm rounded border bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                            </>
                        ) : (
                            <span className={`px-3 py-2 text-sm font-semibold rounded-full ${orderStatus === 'accepted' ? 'bg-green-100 text-green-800' : orderStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                Status Already Updated
                            </span>
                        )}
                        <button
                            onClick={exportToExcel}
                            disabled={exporting || orderItems.length === 0}
                            className="px-4 py-2 text-sm rounded border bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {exporting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    📊 Export Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-6">
                {/* Order meta */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Order Info</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                            <div className="text-gray-700">Order ID</div>
                            <div className="font-medium text-gray-900 break-all">{orderID}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">User UID</div>
                            <div className="font-medium text-gray-900">{orderItems[0]?.uid || '-'}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">Status</div>
                            <div className="font-medium text-gray-900 capitalize">{orderStatus}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">Created At</div>
                            <div className="font-medium text-gray-900">{orderItems[0]?.createdAt ? new Date(orderItems[0].createdAt).toLocaleString() : '-'}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">Updated At</div>
                            <div className="font-medium text-gray-900">{orderItems[0]?.updatedAt ? new Date(orderItems[0].updatedAt).toLocaleString() : '-'}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">Items</div>
                            <div className="font-medium text-gray-900">{totalItems}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">Payment Mode</div>
                            <div className="font-medium text-gray-900">{orderItems[0]?.paymentMode || '-'}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">Coupon Code</div>
                            <div className="font-medium text-gray-900">{orderItems[0]?.couponCode || '-'}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                    </div>
                    <div className="p-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Product</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Product ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Box</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Units</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orderItems.map((it, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm flex items-center gap-3">
                                            {it.featuredImage && <img src={it.featuredImage} alt={it.productName} className="h-10 w-10 object-cover rounded" />}
                                            <span className="font-medium text-gray-900">{it.productName}</span>
                                        </td>
                                        <td className="px-4 py-2 text-xs font-mono text-gray-800">{it.productID}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{it.boxes}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{it.units}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{it.createdAt ? new Date(it.createdAt).toLocaleString() : '-'}</td>
                                    </tr>
                                ))}
                                {orderItems.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-gray-700">No items found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Address Information */}
                {(orderItems[0]?.addressName || orderItems[0]?.addressLine1) && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-700">Name</div>
                                    <div className="font-medium text-gray-900">{orderItems[0]?.addressName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-700">Phone</div>
                                    <div className="font-medium text-gray-900">{orderItems[0]?.addressPhone || '-'}</div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="text-gray-700">Address Line 1</div>
                                    <div className="font-medium text-gray-900">{orderItems[0]?.addressLine1 || '-'}</div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="text-gray-700">Address Line 2</div>
                                    <div className="font-medium text-gray-900">{orderItems[0]?.addressLine2 || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-700">City</div>
                                    <div className="font-medium text-gray-900">{orderItems[0]?.addressCity || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-700">State</div>
                                    <div className="font-medium text-gray-900">{orderItems[0]?.addressState || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-700">Pincode</div>
                                    <div className="font-medium text-gray-900">{orderItems[0]?.addressPincode || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Raw data viewer so every column is visible */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">All fields (raw)</h2>
                        <button onClick={() => console.table(orderItems)} className="text-blue-700 hover:text-blue-900 text-sm">Log to console</button>
                    </div>
                    <div className="p-6">
                        <pre className="whitespace-pre-wrap text-xs text-gray-800 bg-gray-50 rounded p-4 overflow-x-auto">{JSON.stringify(orderItems, null, 2)}</pre>
                    </div>
                </div>
            </main>
            {/* Force status change control */}
            <div className="p-6">
                {!forceChange && orderStatus !== 'pending' && (
                    <button onClick={() => setForceChange(true)} className="px-4 py-2 text-sm rounded border bg-amber-500 text-white hover:bg-amber-600">Change Status - Force</button>
                )}
                {forceChange && orderStatus !== 'pending' && (
                    <p className="mt-2 text-sm text-gray-700">Force mode enabled. Use the buttons above to change status again.</p>
                )}
            </div>
        </>
    )
}
