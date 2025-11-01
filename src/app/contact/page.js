'use client'

import { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'react-toastify';

const ContactPage = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingContact, setEditingContact] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        label: '',
        value: '',
        display_order: 0,
        is_active: true
    });

    const contactTypes = [
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'address', label: 'Address' },
        { value: 'social_media', label: 'Social Media' },
        { value: 'headquarter_address', label: 'Headquarter Address' },
        { value: 'headquarter_phone', label: 'Headquarter Phone' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/contact');
            setContacts(response.data.data);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            toast.error('Failed to fetch contact details');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingContact(null);
        setFormData({
            type: '',
            label: '',
            value: '',
            display_order: contacts.length,
            is_active: true
        });
        setShowForm(true);
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormData({
            type: contact.type,
            label: contact.label,
            value: contact.value,
            display_order: contact.display_order,
            is_active: contact.is_active
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await axiosInstance.put(`/contact/${editingContact.id}`, formData);
                toast.success('Contact detail updated successfully');
            } else {
                await axiosInstance.post('/contact', formData);
                toast.success('Contact detail created successfully');
            }
            setShowForm(false);
            fetchContacts();
        } catch (error) {
            console.error('Error saving contact:', error);
            toast.error('Failed to save contact detail');
        }
    };

    const handleDelete = async (contact) => {
        if (!confirm('Are you sure you want to delete this contact detail?')) return;

        try {
            await axiosInstance.delete(`/contact/${contact.id}`);
            toast.success('Contact detail deleted successfully');
            fetchContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.error('Failed to delete contact detail');
        }
    };

    const handleToggleActive = async (contact) => {
        try {
            await axiosInstance.put(`/contact/${contact.id}`, {
                ...contact,
                is_active: !contact.is_active
            });
            toast.success(`Contact detail ${!contact.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchContacts();
        } catch (error) {
            console.error('Error toggling contact:', error);
            toast.error('Failed to update contact detail');
        }
    };

    const handleReorder = async (updates) => {
        try {
            await axiosInstance.put('/contact/display-order', { updates });
            toast.success('Display order updated successfully');
            fetchContacts();
        } catch (error) {
            console.error('Error reordering contacts:', error);
            toast.error('Failed to update display order');
        }
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newContacts = [...contacts];
        [newContacts[index], newContacts[index - 1]] = [newContacts[index - 1], newContacts[index]];

        const updates = [
            { id: newContacts[index].id, display_order: index },
            { id: newContacts[index - 1].id, display_order: index - 1 }
        ];

        setContacts(newContacts);
        handleReorder(updates);
    };

    const moveDown = (index) => {
        if (index === contacts.length - 1) return;
        const newContacts = [...contacts];
        [newContacts[index], newContacts[index + 1]] = [newContacts[index + 1], newContacts[index]];

        const updates = [
            { id: newContacts[index].id, display_order: index },
            { id: newContacts[index + 1].id, display_order: index + 1 }
        ];

        setContacts(newContacts);
        handleReorder(updates);
    };

    const getContactTypeLabel = (type) => {
        return contactTypes.find(t => t.value === type)?.label || type;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading contact details...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Contact Details Management</h1>
                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add New Contact
                    </button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                            <h2 className="text-2xl font-bold mb-6">
                                {editingContact ? 'Edit Contact Detail' : 'Add New Contact Detail'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Type
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            {contactTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Display Order
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.display_order}
                                            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Label
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Value
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                        Active
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {editingContact ? 'Update Contact' : 'Add Contact'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {contacts.map((contact, index) => (
                        <div key={contact.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {contact.label}
                                        </h3>
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {getContactTypeLabel(contact.type)}
                                        </span>
                                        {contact.is_active ? (
                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 mb-2">{contact.value}</p>
                                    <p className="text-xs text-gray-500">
                                        Order: {contact.display_order} •
                                        Created: {new Date(contact.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="flex flex-col space-y-1">
                                        <button
                                            onClick={() => moveUp(index)}
                                            disabled={index === 0}
                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => moveDown(index)}
                                            disabled={index === contacts.length - 1}
                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ↓
                                        </button>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(contact)}
                                            className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(contact)}
                                            className={`px-3 py-1 rounded transition-colors ${contact.is_active
                                                    ? 'text-orange-600 border border-orange-600 hover:bg-orange-50'
                                                    : 'text-green-600 border border-green-600 hover:bg-green-50'
                                                }`}
                                        >
                                            {contact.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact)}
                                            className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {contacts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No contact details found. Add your first contact detail to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactPage;
