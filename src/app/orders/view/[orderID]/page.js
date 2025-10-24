'use client';
import React, { useEffect, useState } from 'react'
import axios from '../../../../utils/axiosInstance'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [acceptedUnits, setAcceptedUnits] = useState({})
    const [adminNotes, setAdminNotes] = useState({})
    const [orderPayment, setOrderPayment] = useState(null)
    const [editingPayment, setEditingPayment] = useState(false)
    const [paidAmount, setPaidAmount] = useState(0)
    const [paymentNotes, setPaymentNotes] = useState('')
    const [savingPayment, setSavingPayment] = useState(false)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await axios.get(`/order/admin/${orderID}`)
                const rows = data?.data || []
                console.log('[OrderDetails] rows from orders table:', rows)
                setOrderItems(rows)
                if (rows.length > 0) setOrderStatus(rows[0].orderStatus || 'pending')

                // Fetch order payment data
                const paymentResponse = await axios.get(`/order/admin/${orderID}/payment`)
                const payments = paymentResponse.data?.data || []
                setOrderPayment(payments)
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

    const updateOrderPayment = async () => {
        try {
            setSavingPayment(true)
            const totalOrderAmount = parseFloat(orderItems[0]?.order_amount || 0)

            if (paidAmount > totalOrderAmount) {
                alert('Paid amount cannot exceed total order amount')
                return
            }

            const { data } = await axios.put(`/order/admin/${orderID}/payment`, {
                paidAmount: paidAmount,
                notes: paymentNotes
            })

            if (data?.success) {
                // Refresh order and payment data
                const { data: orderData } = await axios.get(`/order/admin/${orderID}`)
                setOrderItems(orderData?.data || [])

                const paymentResponse = await axios.get(`/order/admin/${orderID}/payment`)
                setOrderPayment(paymentResponse.data?.data || [])

                setEditingPayment(false)
                setPaidAmount(0)
                setPaymentNotes('')
                alert('Order payment updated successfully')
            } else {
                console.error('[UpdateOrderPayment] API error:', data.message)
                alert('Failed to update order payment: ' + data.message)
            }
        } catch (e) {
            console.error(e)
            alert('Failed to update order payment. Please try again.')
        } finally {
            setSavingPayment(false)
        }
    }

    const getTotalPaidAmount = () => {
        if (!orderPayment || orderPayment.length === 0) return 0
        return orderPayment.reduce((sum, payment) => sum + parseFloat(payment.paid_amount || 0), 0)
    }

    const getTotalOrderAmount = () => {
        return parseFloat(orderItems[0]?.order_amount || 0)
    }

    const getPaymentStatus = () => {
        const totalPaid = getTotalPaidAmount()
        const totalOrder = getTotalOrderAmount()

        if (totalPaid === 0) return { status: 'Not Paid', color: 'bg-red-100 text-red-800' }
        if (totalPaid >= totalOrder) return { status: 'Fully Paid', color: 'bg-green-100 text-green-800' }
        return { status: 'Partially Paid', color: 'bg-yellow-100 text-yellow-800' }
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

    const generateInvoicePDF = async () => {
        try {
            setGeneratingPDF(true)

            // Create a new PDF document
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()

            // Top line (thin gray line from left, stopping at 2/3 of page width)
            pdf.setDrawColor(200, 200, 200)
            pdf.setLineWidth(0.5)
            pdf.line(20, 25, 20 + (pageWidth - 40) * 0.67, 25)

            // INVOICE title (right-aligned, large bold)
            pdf.setFontSize(32)
            pdf.setFont('helvetica', 'bold')
            pdf.text('INVOICE', pageWidth - 20, 25, { align: 'right' })

            // Left column - Customer details
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.text('ISSUED TO:', 20, 45)

            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(11)
            pdf.text(orderItems[0]?.userName || 'Unknown Customer', 20, 55)
            pdf.text(`UID: ${orderItems[0]?.uid || '-'}`, 20, 65)

            // Delivery address if available
            if (orderItems[0]?.addressName) {
                pdf.text(orderItems[0].addressName, 20, 75)
                if (orderItems[0].addressPhone) {
                    pdf.text(orderItems[0].addressPhone, 20, 85)
                }
                pdf.text(orderItems[0].addressLine1 || '', 20, 95)
                if (orderItems[0].addressLine2) {
                    pdf.text(orderItems[0].addressLine2, 20, 105)
                }
                const cityState = `${orderItems[0].addressCity || ''}, ${orderItems[0].addressState || ''} - ${orderItems[0].addressPincode || ''}`
                pdf.text(cityState, 20, 115)
            }

            // Right column - Invoice details
            pdf.setFontSize(11)
            pdf.setFont('helvetica', 'normal')
            pdf.text('INVOICE NO:', pageWidth - 20, 45, { align: 'right' })
            pdf.setFont('helvetica', 'bold')
            pdf.text(orderID, pageWidth - 20, 45, { align: 'right' })

            pdf.setFont('helvetica', 'normal')
            pdf.text('DATE:', pageWidth - 20, 55, { align: 'right' })
            pdf.text(orderItems[0]?.createdAt ? new Date(orderItems[0].createdAt).toLocaleDateString() : '-', pageWidth - 20, 55, { align: 'right' })

            pdf.text('STATUS:', pageWidth - 20, 65, { align: 'right' })
            pdf.setFont('helvetica', 'bold')
            pdf.text(orderStatus.toUpperCase(), pageWidth - 20, 65, { align: 'right' })

            // Table section
            let yPosition = orderItems[0]?.addressName ? 140 : 100

            // Table header line
            pdf.setDrawColor(200, 200, 200)
            pdf.setLineWidth(0.5)
            pdf.line(20, yPosition, pageWidth - 20, yPosition)

            // Table headers
            pdf.setFontSize(11)
            pdf.setFont('helvetica', 'bold')
            pdf.text('DESCRIPTION', 20, yPosition + 8)
            pdf.text('UNIT PRICE', pageWidth - 60, yPosition + 8, { align: 'right' })
            pdf.text('QTY', pageWidth - 40, yPosition + 8, { align: 'right' })
            pdf.text('TOTAL', pageWidth - 20, yPosition + 8, { align: 'right' })

            // Header line below
            pdf.line(20, yPosition + 12, pageWidth - 20, yPosition + 12)

            // Table items
            yPosition += 20
            pdf.setFont('helvetica', 'normal')
            let grandTotal = 0

            orderItems.forEach((item, index) => {
                if (yPosition > pageHeight - 80) {
                    pdf.addPage()
                    yPosition = 30
                }

                const quantity = Number(item.requested_units || item.units || 0)
                const price = Number(item.productPrice || 0)
                const total = quantity * price
                grandTotal += total

                // Item description
                const itemName = item.productName || 'Unknown Product'
                pdf.text(itemName, 20, yPosition)

                // Unit price
                pdf.text(`₹${price.toFixed(2)}`, pageWidth - 60, yPosition, { align: 'right' })

                // Quantity
                pdf.text(quantity.toString(), pageWidth - 40, yPosition, { align: 'right' })

                // Total
                pdf.text(`₹${total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' })

                yPosition += 8
            })

            // Summary section
            yPosition += 10
            pdf.setDrawColor(200, 200, 200)
            pdf.setLineWidth(0.5)
            pdf.line(20, yPosition, pageWidth - 20, yPosition)

            yPosition += 15

            // Subtotal
            pdf.setFont('helvetica', 'bold')
            pdf.text('SUBTOTAL', 20, yPosition)
            pdf.text(`₹${Number(grandTotal).toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' })

            yPosition += 10

            // Tax (if any - you can add tax calculation here)
            pdf.setFont('helvetica', 'normal')
            pdf.text('TAX', 20, yPosition)
            pdf.text('0%', pageWidth - 20, yPosition, { align: 'right' })

            yPosition += 10

            // Total
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(12)
            pdf.text('TOTAL', 20, yPosition)
            pdf.text(`₹${Number(grandTotal).toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' })

            // Payment info at bottom
            yPosition = pageHeight - 40
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')

            if (orderItems[0]?.paymentMode) {
                pdf.text(`Payment Method: ${orderItems[0].paymentMode}`, 20, yPosition)
            }

            if (orderItems[0]?.couponCode) {
                pdf.text(`Coupon Applied: ${orderItems[0].couponCode}`, 20, yPosition + 10)
            }

            // Generate filename and save
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
            const filename = `Invoice_${orderID}_${timestamp}.pdf`
            pdf.save(filename)

        } catch (error) {
            console.error('PDF generation failed:', error)
            alert('PDF generation failed. Please try again.')
        } finally {
            setGeneratingPDF(false)
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

    const totalItems = orderItems.reduce((sum, it) => sum + (it.units || 0), 0)

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
                        <button
                            onClick={generateInvoicePDF}
                            disabled={generatingPDF || orderItems.length === 0}
                            className="px-4 py-2 text-sm rounded border bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {generatingPDF ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    📄 Download Invoice
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
                            <div className="text-gray-700">Payment Status</div>
                            <div className="font-medium">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${orderItems[0]?.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : orderItems[0]?.payment_status === 'partially_paid'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {orderItems[0]?.payment_status === 'paid'
                                        ? 'PAID'
                                        : orderItems[0]?.payment_status === 'partially_paid'
                                            ? 'PARTIALLY PAID'
                                            : 'NOT PAID'}
                                </span>
                            </div>
                        </div>
                        {orderItems[0]?.payment_date && (
                            <div>
                                <div className="text-gray-700">Payment Date</div>
                                <div className="font-medium text-gray-900">
                                    {new Date(orderItems[0].payment_date).toLocaleDateString()}
                                </div>
                            </div>
                        )}
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
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">SKU</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Inventory</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Requested</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Accepted</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Amount</th>
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
                                        <td className="px-4 py-2 text-xs font-mono text-gray-800">{it.sku || '-'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            <div className="font-medium">{it.inventory || 0}</div>
                                            <div className="text-xs text-gray-500">units</div>
                                        </td>
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
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            <div className="font-medium">₹{((it.productPrice || 0) * (it.units || 0)).toFixed(2)}</div>
                                            <div className="text-xs text-gray-500">₹{it.productPrice || '0.00'} × {it.units || 0}</div>
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
                                        <td colSpan={7} className="px-4 py-6 text-center text-gray-700">No items found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Section */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-sm text-gray-700 mb-2">Total Order Amount</div>
                                <div className="text-2xl font-bold text-gray-900">₹{getTotalOrderAmount().toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-700 mb-2">Total Paid Amount</div>
                                <div className="text-2xl font-bold text-gray-900">₹{getTotalPaidAmount().toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-700 mb-2">Remaining Amount</div>
                                <div className="text-2xl font-bold text-gray-900">₹{(getTotalOrderAmount() - getTotalPaidAmount()).toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-700 mb-2">Payment Status</div>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatus().color}`}>
                                    {getPaymentStatus().status}
                                </span>
                            </div>
                        </div>

                        {editingPayment ? (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Payment Amount</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Paid Amount
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={getTotalOrderAmount()}
                                            step="0.01"
                                            value={paidAmount}
                                            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum: ₹{getTotalOrderAmount().toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Payment notes..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={updateOrderPayment}
                                        disabled={savingPayment}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {savingPayment ? 'Saving...' : 'Save Payment'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingPayment(false)
                                            setPaidAmount(0)
                                            setPaymentNotes('')
                                        }}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6">
                                <button
                                    onClick={() => setEditingPayment(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Enter Payment Amount
                                </button>
                            </div>
                        )}

                        {/* Payment History */}
                        {orderPayment && orderPayment.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
                                <div className="space-y-3">
                                    {orderPayment.map((payment, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <div className="font-medium text-gray-900">₹{payment.paid_amount}</div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(payment.createdAt).toLocaleString()}
                                                </div>
                                                {payment.notes && (
                                                    <div className="text-sm text-gray-600 mt-1">{payment.notes}</div>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Admin: {payment.admin_uid}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

