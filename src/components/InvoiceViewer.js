'use client';

import React, { useState } from 'react';
import axios from '../utils/axiosInstance';

const InvoiceViewer = ({ orderID, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [invoiceHTML, setInvoiceHTML] = useState('');
    const [error, setError] = useState('');

    const generateInvoice = async () => {
        try {
            setLoading(true);
            setError('');

            const { data } = await axios.get(`/invoice/generate/${orderID}`);

            if (data.success) {
                setInvoiceHTML(data.data.html);
            } else {
                setError(data.message || 'Failed to generate invoice');
            }
        } catch (err) {
            console.error('Invoice generation error:', err);
            setError('Failed to generate invoice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = async () => {
        try {
            setLoading(true);

            // Open invoice in new window for printing/downloading
            const response = await axios.get(`/invoice/download/${orderID}`, {
                responseType: 'blob'
            });

            // Create blob URL and open in new window
            const blob = new Blob([response.data], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');

            if (newWindow) {
                newWindow.focus();
            } else {
                // Fallback: download the file
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-${orderID}.html`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Clean up the blob URL after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

        } catch (err) {
            console.error('Invoice download error:', err);
            setError('Failed to download invoice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const printInvoice = () => {
        if (invoiceHTML) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(invoiceHTML);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Invoice for Order #{orderID}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="p-4">
                    {!invoiceHTML ? (
                        <div className="text-center py-8">
                            <div className="mb-4">
                                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Generate Invoice
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Click the button below to generate the invoice for this order.
                                </p>
                            </div>

                            <button
                                onClick={generateInvoice}
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Generate Invoice
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={printInvoice}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                </button>
                                <button
                                    onClick={downloadInvoice}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setInvoiceHTML('')}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Regenerate
                                </button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b">
                                    <h3 className="text-sm font-medium text-gray-700">Invoice Preview</h3>
                                </div>
                                <div className="max-h-96 overflow-auto">
                                    <iframe
                                        srcDoc={invoiceHTML}
                                        className="w-full h-96 border-0"
                                        title="Invoice Preview"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-700">{error}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceViewer;
