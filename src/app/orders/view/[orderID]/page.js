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
    const [editingItem, setEditingItem] = useState(null)
    const [acceptedUnits, setAcceptedUnits] = useState({})
    const [adminNotes, setAdminNotes] = useState({})

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

    const updatePartialAcceptance = async (productID) => {
        try {
            setSaving(true)
            const accepted = acceptedUnits[productID] || 0
            const notes = adminNotes[productID] || ''

            const { data } = await axios.put(`/order/admin/acceptance`, {
                orderID,
                productID,
                acceptedUnits: accepted,
                adminNotes: notes
            })

            if (data?.success) {
                // Refresh order data
                const { data: orderData } = await axios.get(`/order/admin/${orderID}`)
                setOrderItems(orderData?.data || [])
                setEditingItem(null)
                setAcceptedUnits({})
                setAdminNotes({})
            } else {
                console.error('[PartialAcceptance] API error:', data.message)
                alert('Failed to update acceptance: ' + data.message)
            }
        } catch (e) {
            console.error(e)
            alert('Failed to update acceptance. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const acceptFullQuantity = async (productID, requestedUnits) => {
        try {
            setSaving(true)

            const { data } = await axios.put(`/order/admin/acceptance`, {
                orderID,
                productID,
                acceptedUnits: requestedUnits,
                adminNotes: 'Full quantity accepted'
            })

            if (data?.success) {
                // Refresh order data
                const { data: orderData } = await axios.get(`/order/admin/${orderID}`)
                setOrderItems(orderData?.data || [])
            } else {
                console.error('[FullAcceptance] API error:', data.message)
                alert('Failed to accept full quantity: ' + data.message)
            }
        } catch (e) {
            console.error(e)
            alert('Failed to accept full quantity. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleAcceptanceChange = (productID, value) => {
        setAcceptedUnits(prev => ({
            ...prev,
            [productID]: parseInt(value) || 0
        }))
    }

    const handleNotesChange = (productID, value) => {
        setAdminNotes(prev => ({
            ...prev,
            [productID]: value
        }))
    }

    const getAcceptanceStatus = (item) => {
        if (item.acceptance_status === 'full') return 'Full'
        if (item.acceptance_status === 'partial') return 'Partial'
        if (item.acceptance_status === 'rejected') return 'Rejected'
        return 'Pending'
    }

    const getAcceptanceColor = (item) => {
        if (item.acceptance_status === 'full') return 'bg-green-100 text-green-800'
        if (item.acceptance_status === 'partial') return 'bg-yellow-100 text-yellow-800'
        if (item.acceptance_status === 'rejected') return 'bg-red-100 text-red-800'
        return 'bg-gray-100 text-gray-800'
    }

    const exportToExcel = async () => {
        try {
            setExporting(true)

            // Prepare order summary data
            const orderSummary = {
                'Order ID': orderID,
                'User UID': orderItems[0]?.uid || '-',
                'Status': orderStatus,
                'Created At': orderItems[0]?.createdAt ? `${new Date(orderItems[0].createdAt).toLocaleDateString()}\n${new Date(orderItems[0].createdAt).toLocaleTimeString()}` : '-',
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
                'Created At': item.createdAt ? `${new Date(item.createdAt).toLocaleDateString()}\n${new Date(item.createdAt).toLocaleTimeString()}` : '-'
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
                            <div className="text-gray-700">Customer</div>
                            <div className="font-medium text-gray-900">{orderItems[0]?.userName || 'Unknown User'}</div>
                            <div className="text-sm text-gray-500">{orderItems[0]?.uid || '-'}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">Status</div>
                            <div className="font-medium text-gray-900 capitalize">{orderStatus}</div>
                        </div>
                        <div>
                            <div className="text-gray-700">Created At</div>
                            <div className="font-medium text-gray-900">
                                {orderItems[0]?.createdAt ? (
                                    <>
                                        {new Date(orderItems[0].createdAt).toLocaleDateString()}
                                        <br />
                                        {new Date(orderItems[0].createdAt).toLocaleTimeString()}
                                    </>
                                ) : '-'}
                            </div>
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
                            <div className="text-gray-700">Requested Total</div>
                            <div className="font-medium text-gray-900">
                                {orderItems.reduce((sum, item) => sum + (item.requested_units || item.units || 0), 0)} units
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-700">Accepted Total</div>
                            <div className="font-medium text-gray-900">
                                {orderItems.reduce((sum, item) => sum + (item.accepted_units || 0), 0)} units
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-700">Subtotal</div>
                            <div className="font-medium text-gray-900">₹{orderItems[0]?.order_amount || '0.00'}</div>
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
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Requested</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Accepted</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Actions</th>
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
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            <div className="font-medium">{it.requested_units || it.units || 0}</div>
                                            <div className="text-xs text-gray-500">units</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {editingItem === it.productID ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={it.requested_units || it.units || 0}
                                                    value={acceptedUnits[it.productID] || it.accepted_units || 0}
                                                    onChange={(e) => handleAcceptanceChange(it.productID, e.target.value)}
                                                    className="w-20 px-2 py-1 border rounded text-sm"
                                                />
                                            ) : (
                                                <div>
                                                    <div className="font-medium">{it.accepted_units || 0}</div>
                                                    <div className="text-xs text-gray-500">units</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAcceptanceColor(it)}`}>
                                                {getAcceptanceStatus(it)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            {editingItem === it.productID ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => updatePartialAcceptance(it.productID)}
                                                        disabled={saving}
                                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(null)
                                                            setAcceptedUnits({})
                                                            setAdminNotes({})
                                                        }}
                                                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(it.productID)
                                                            setAcceptedUnits(prev => ({
                                                                ...prev,
                                                                [it.productID]: it.accepted_units || 0
                                                            }))
                                                            setAdminNotes(prev => ({
                                                                ...prev,
                                                                [it.productID]: it.admin_notes || ''
                                                            }))
                                                        }}
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    {it.acceptance_status !== 'full' && (
                                                        <button
                                                            onClick={() => acceptFullQuantity(it.productID, it.requested_units || it.units || 0)}
                                                            disabled={saving}
                                                            className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                                                        >
                                                            FULL
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {orderItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-gray-700">No items found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Admin Notes Section */}
                {editingItem && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Admin Notes</h2>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={adminNotes[editingItem] || ''}
                                onChange={(e) => handleNotesChange(editingItem, e.target.value)}
                                placeholder="Add notes for this product acceptance..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>
                    </div>
                )}

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

                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-center text-lg font-semibold">
                            <span className="text-gray-700">Total Amount:</span>
                            <span className="text-green-600">₹{orderItems[0]?.order_amount || '0.00'}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                            Amount calculated based on product prices and quantities
                        </div>
                    </div>
                </div>

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
