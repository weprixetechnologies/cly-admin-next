'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

export default function HeadOfficePage() {
    const [activeTab, setActiveTab] = useState('address1');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        address1: {
            label: 'Head Office Address 1',
            value: ''
        },
        address2: {
            label: 'Head Office Address 2',
            value: ''
        },
        phone1: {
            label: 'Head Office Phone 1',
            value: ''
        },
        phone2: {
            label: 'Head Office Phone 2',
            value: ''
        }
    });
    const [contactIds, setContactIds] = useState({
        address1: null,
        address2: null,
        phone1: null,
        phone2: null
    });

    useEffect(() => {
        fetchHeadOfficeData();
    }, []);

    const fetchHeadOfficeData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/contact');
            
            // Handle different response formats
            let contacts = [];
            if (response.data?.success && Array.isArray(response.data.data)) {
                contacts = response.data.data;
            } else if (Array.isArray(response.data)) {
                contacts = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                contacts = response.data.data;
            } else if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch contacts');
            }

            // Find existing head office contacts by explicit types
            const address1 = contacts.find(c => c.type === 'headquarter_address' && (c.label === 'Head Office Address 1' || c.label?.includes('Address 1')));
            const address2 = contacts.find(c => c.type === 'headquarter_address' && (c.label === 'Head Office Address 2' || c.label?.includes('Address 2')));
            const phone1 = contacts.find(c => c.type === 'headquarter_phone' && (c.label === 'Head Office Phone 1' || c.label?.includes('Phone 1')));
            const phone2 = contacts.find(c => c.type === 'headquarter_phone' && (c.label === 'Head Office Phone 2' || c.label?.includes('Phone 2')));

            setFormData({
                address1: {
                    label: address1?.label || 'Head Office Address 1',
                    value: address1?.value || ''
                },
                address2: {
                    label: address2?.label || 'Head Office Address 2',
                    value: address2?.value || ''
                },
                phone1: {
                    label: phone1?.label || 'Head Office Phone 1',
                    value: phone1?.value || ''
                },
                phone2: {
                    label: phone2?.label || 'Head Office Phone 2',
                    value: phone2?.value || ''
                }
            });

            setContactIds({
                address1: address1?.id || null,
                address2: address2?.id || null,
                phone1: phone1?.id || null,
                phone2: phone2?.id || null
            });
        } catch (error) {
            console.error('Error fetching head office data:', error);
            toast.error('Failed to load head office details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);

            // Update or create each contact with explicit types
            const contactsToSave = [
                { key: 'address1', id: contactIds.address1, type: 'headquarter_address' },
                { key: 'address2', id: contactIds.address2, type: 'headquarter_address' },
                { key: 'phone1', id: contactIds.phone1, type: 'headquarter_phone' },
                { key: 'phone2', id: contactIds.phone2, type: 'headquarter_phone' }
            ];

            for (const contact of contactsToSave) {
                // Skip if both label and value are empty
                if (!formData[contact.key].label.trim() && !formData[contact.key].value.trim()) {
                    continue;
                }

                const data = {
                    type: contact.type,
                    label: formData[contact.key].label || `Head Office ${contact.key.includes('address') ? 'Address' : 'Phone'} ${contact.key.slice(-1)}`,
                    value: formData[contact.key].value || '',
                    display_order: contact.key.includes('address') ? (contact.key === 'address1' ? 1 : 2) : (contact.key === 'phone1' ? 3 : 4),
                    is_active: true
                };

                if (contact.id) {
                    // Update existing
                    const response = await axiosInstance.put(`/contact/${contact.id}`, data);
                    if (!response.data?.success) {
                        throw new Error(response.data?.message || 'Failed to update contact');
                    }
                } else {
                    // Create new
                    const response = await axiosInstance.post('/contact', data);
                    if (response.data?.success && response.data.data?.id) {
                        setContactIds(prev => ({
                            ...prev,
                            [contact.key]: response.data.data.id
                        }));
                    } else {
                        throw new Error(response.data?.message || 'Failed to create contact');
                    }
                }
            }

            toast.success('Head office details saved successfully');
            await fetchHeadOfficeData();
        } catch (error) {
            console.error('Error saving head office data:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save head office details';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, field, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading head office details...</div>
            </div>
        );
    }

    const tabs = [
        { id: 'address1', label: 'Address 1', icon: '📍' },
        { id: 'address2', label: 'Address 2', icon: '📍' },
        { id: 'phone1', label: 'Phone 1', icon: '📞' },
        { id: 'phone2', label: 'Phone 2', icon: '📞' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Head Office Management</h1>
                    <p className="text-gray-600">Manage your company head office addresses and phone numbers</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab.startsWith('address') && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Label
                                    </label>
                                    <input
                                        type="text"
                                        value={formData[activeTab].label}
                                        onChange={(e) => handleChange(activeTab, 'label', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <textarea
                                        value={formData[activeTab].value}
                                        onChange={(e) => handleChange(activeTab, 'value', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={6}
                                        placeholder="Enter complete address including street, city, state, pincode, country"
                                    />
                                </div>
                            </div>
                        )}

                        {(activeTab === 'phone1' || activeTab === 'phone2') && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Label
                                    </label>
                                    <input
                                        type="text"
                                        value={formData[activeTab].label}
                                        onChange={(e) => handleChange(activeTab, 'label', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData[activeTab].value}
                                        onChange={(e) => handleChange(activeTab, 'value', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., +91 1234567890"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-l-4 border-blue-500 pl-4">
                            <h3 className="font-semibold text-gray-900 mb-2">{formData.address1.label}</h3>
                            <p className="text-gray-700 whitespace-pre-line">{formData.address1.value || 'Not set'}</p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                            <h3 className="font-semibold text-gray-900 mb-2">{formData.address2.label}</h3>
                            <p className="text-gray-700 whitespace-pre-line">{formData.address2.value || 'Not set'}</p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-4">
                            <h3 className="font-semibold text-gray-900 mb-2">{formData.phone1.label}</h3>
                            <p className="text-gray-700">{formData.phone1.value || 'Not set'}</p>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-4">
                            <h3 className="font-semibold text-gray-900 mb-2">{formData.phone2.label}</h3>
                            <p className="text-gray-700">{formData.phone2.value || 'Not set'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

