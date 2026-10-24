import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Phone, 
  Mail, 
  ShieldCheck,
  RefreshCw,
  FileText,
  Download,
  Check,
  XCircle,
  Upload,
  Edit2,
  Compass
} from 'lucide-react';

export const CrmContactsModal = ({ customerId, customerName, isOpen, onClose }) => {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'Viewer' || user?.role === 'Customer';

  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'addresses' | 'documents'
  const [contacts, setContacts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'PRIMARY',
    is_primary: false
  });
  const [showAddContact, setShowAddContact] = useState(false);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    address_line1: '',
    address_line2: '',
    locality: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '',
    latitude: '',
    longitude: '',
    address_type: 'INSTALLATION',
    is_primary: false
  });
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Address edit state
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({});

  // Survey completion modal state
  const [surveyAddress, setSurveyAddress] = useState(null);
  const [surveyForm, setSurveyForm] = useState({
    latitude: '',
    longitude: '',
    serviceability_status: 'SERVICEABLE',
    field_notes: ''
  });

  // KYC Document form state
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    document_type: 'AADHAAR',
    document_identifier: '',
    file: null
  });

  const loadData = async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const [cList, aList, dList] = await Promise.all([
        api.getCustomerContacts(customerId).catch(() => []),
        api.getCustomerAddresses(customerId).catch(() => []),
        api.getCustomerDocuments(customerId).catch(() => [])
      ]);
      setContacts(cList || []);
      setAddresses(aList || []);
      setDocuments(dList || []);
    } catch (err) {
      setError(err.message || 'Failed to load CRM data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  // --- Contact Handlers ---
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!contactForm.first_name.trim() && !contactForm.phone.trim() && !contactForm.email.trim()) {
      setError('Contact name, phone, or email is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.createCustomerContact(customerId, {
        first_name: contactForm.first_name.trim() || undefined,
        last_name: contactForm.last_name.trim() || undefined,
        email: contactForm.email.trim() || undefined,
        phone: contactForm.phone.trim() || undefined,
        role: contactForm.role,
        is_primary: contactForm.is_primary
      });
      setShowAddContact(false);
      setContactForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'PRIMARY',
        is_primary: false
      });
      setSuccessMsg('Contact added successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to add contact.');
      setLoading(false);
    }
  };

  const handleArchiveContact = async (contactId) => {
    if (isReadOnly) return;
    if (!window.confirm('Are you sure you want to archive this contact?')) return;
    setLoading(true);
    try {
      await api.archiveCustomerContact(customerId, contactId);
      setSuccessMsg('Contact archived.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to archive contact.');
      setLoading(false);
    }
  };

  // --- Address Handlers ---
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!addressForm.address_line1.trim() && !addressForm.city.trim()) {
      setError('Address Line 1 or City is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.createCustomerAddress(customerId, {
        address_line1: addressForm.address_line1.trim() || undefined,
        address_line2: addressForm.address_line2.trim() || undefined,
        locality: addressForm.locality.trim() || undefined,
        city: addressForm.city.trim() || undefined,
        state: addressForm.state.trim() || undefined,
        postal_code: addressForm.postal_code.trim() || undefined,
        latitude: addressForm.latitude ? Number(addressForm.latitude) : undefined,
        longitude: addressForm.longitude ? Number(addressForm.longitude) : undefined,
        address_type: addressForm.address_type,
        is_primary: addressForm.is_primary
      });
      setShowAddAddress(false);
      setAddressForm({
        address_line1: '',
        address_line2: '',
        locality: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '',
        latitude: '',
        longitude: '',
        address_type: 'INSTALLATION',
        is_primary: false
      });
      setSuccessMsg('Address added successfully. Field survey dispatched if unverified.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to add address.');
      setLoading(false);
    }
  };

  const handleStartEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setEditAddressForm({
      address_line1: addr.address_line1 || '',
      locality: addr.locality || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      latitude: addr.latitude !== null && addr.latitude !== undefined ? String(addr.latitude) : '',
      longitude: addr.longitude !== null && addr.longitude !== undefined ? String(addr.longitude) : '',
      serviceability_status: addr.serviceability_status || 'PENDING_SURVEY'
    });
  };

  const handleSaveEditAddress = async (addressId) => {
    if (isReadOnly) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        address_line1: editAddressForm.address_line1.trim() || undefined,
        locality: editAddressForm.locality.trim() || undefined,
        city: editAddressForm.city.trim() || undefined,
        state: editAddressForm.state.trim() || undefined,
        postal_code: editAddressForm.postal_code.trim() || undefined,
        latitude: editAddressForm.latitude ? parseFloat(editAddressForm.latitude) : null,
        longitude: editAddressForm.longitude ? parseFloat(editAddressForm.longitude) : null,
        serviceability_status: editAddressForm.serviceability_status
      };
      await api.updateCustomerAddress(customerId, addressId, payload);
      setEditingAddressId(null);
      setSuccessMsg('Address updated successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update address.');
      setLoading(false);
    }
  };

  const handleCompleteSurvey = async (e) => {
    e.preventDefault();
    if (!surveyAddress || isReadOnly) return;
    if (!surveyForm.latitude || !surveyForm.longitude) {
      setError('Latitude and Longitude are mandatory for survey completion.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.completeAddressSurvey(customerId, surveyAddress.id, {
        latitude: parseFloat(surveyForm.latitude),
        longitude: parseFloat(surveyForm.longitude),
        serviceability_status: surveyForm.serviceability_status,
        field_notes: surveyForm.field_notes.trim() || undefined
      });
      setSurveyAddress(null);
      setSuccessMsg('Survey completed successfully. Ticket resolved and coordinates locked.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to complete survey.');
      setLoading(false);
    }
  };

  const handleArchiveAddress = async (addressId) => {
    if (isReadOnly) return;
    if (!window.confirm('Are you sure you want to archive this address?')) return;
    setLoading(true);
    try {
      await api.archiveCustomerAddress(customerId, addressId);
      setSuccessMsg('Address archived.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to archive address.');
      setLoading(false);
    }
  };

  // --- Document Handlers ---
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!docForm.file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const fd = new FormData();
      fd.append('file', docForm.file);
      fd.append('document_type', docForm.document_type);
      if (docForm.document_identifier.trim()) {
        fd.append('document_identifier', docForm.document_identifier.trim());
      }

      await api.uploadCustomerDocument(customerId, fd);
      setShowUploadDoc(false);
      setDocForm({
        document_type: 'AADHAAR',
        document_identifier: '',
        file: null
      });
      setSuccessMsg('KYC document uploaded successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Document upload failed.');
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const { blob, filename } = await api.downloadCustomerDocument(customerId, doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${doc.document_type.toLowerCase()}_${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Failed to download document.');
    }
  };

  const handleVerifyDocument = async (docId, newStatus) => {
    if (isReadOnly) return;
    const notes = prompt(`Enter notes for ${newStatus} status:`, newStatus === 'VERIFIED' ? 'Verified against government registry' : 'Unclear document scan');
    if (notes === null) return;

    setLoading(true);
    setError('');
    try {
      await api.verifyCustomerDocument(customerId, docId, {
        verification_status: newStatus,
        verification_notes: notes
      });
      setSuccessMsg(`Document marked ${newStatus}.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update document verification status.');
      setLoading(false);
    }
  };

  const handleArchiveDocument = async (docId) => {
    if (isReadOnly) return;
    if (!window.confirm('Are you sure you want to archive this KYC document?')) return;
    setLoading(true);
    try {
      await api.archiveCustomerDocument(customerId, docId);
      setSuccessMsg('Document soft-archived.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to archive document.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CRM Customer Profiles &amp; Delivery Points</span>
            </div>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">
              {customerName || `Customer #${customerId}`}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 px-5 pt-3 gap-4 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'contacts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts ({contacts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'addresses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Installation Addresses ({addresses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>KYC Documents ({documents.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs bg-[#F8FAFC]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Authorized Personnel &amp; Contacts</span>
                {!isReadOnly && !showAddContact && (
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Contact</span>
                  </button>
                )}
              </div>

              {showAddContact && (
                <form onSubmit={handleAddContact} className="p-4 bg-white border border-blue-200 rounded-xl space-y-3 card-shadow animate-in fade-in">
                  <div className="font-bold text-gray-900 border-b border-gray-100 pb-2">New Contact Person</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">First Name</label>
                      <input
                        type="text"
                        value={contactForm.first_name}
                        onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={contactForm.last_name}
                        onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Phone</label>
                      <input
                        type="text"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                        placeholder="+91 98200 12345"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg"
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Role</label>
                      <select
                        value={contactForm.role}
                        onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg"
                      >
                        <option value="PRIMARY">PRIMARY</option>
                        <option value="BILLING">BILLING</option>
                        <option value="TECHNICAL">TECHNICAL</option>
                        <option value="EMERGENCY">EMERGENCY</option>
                      </select>
                    </div>
                    <div className="pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contactForm.is_primary}
                          onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className="font-semibold text-gray-700">Set as Primary Contact</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-3 py-1.5 border rounded-lg font-semibold text-gray-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
                    >
                      Save Contact
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {contacts.length === 0 ? (
                  <div className="text-gray-400 text-center py-6 bg-white rounded-xl border">No contacts registered.</div>
                ) : (
                  contacts.map((c) => (
                    <div key={c.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between card-shadow">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{c.first_name} {c.last_name}</span>
                          {c.is_primary && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              PRIMARY
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 border">
                            {c.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500 font-mono text-[11px]">
                          {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-600" />{c.phone}</span>}
                          {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-500" />{c.email}</span>}
                        </div>
                      </div>

                      {!isReadOnly && !c.is_primary && (
                        <button
                          onClick={() => handleArchiveContact(c.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Archive Contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Premises &amp; Survey Drop Points</span>
                {!isReadOnly && !showAddAddress && (
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                )}
              </div>

              {showAddAddress && (
                <form onSubmit={handleAddAddress} className="p-4 bg-white border border-blue-200 rounded-xl space-y-3 card-shadow animate-in fade-in">
                  <div className="font-bold text-gray-900 border-b border-gray-100 pb-2">New Address Record</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={addressForm.address_line1}
                      onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg"
                      placeholder="Building, street, flat"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Locality</label>
                      <input
                        type="text"
                        value={addressForm.locality}
                        onChange={(e) => setAddressForm({ ...addressForm, locality: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg"
                        placeholder="Colaba"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">PIN Code</label>
                      <input
                        type="text"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                        placeholder="400005"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Latitude (Optional)</label>
                      <input
                        type="text"
                        value={addressForm.latitude}
                        onChange={(e) => setAddressForm({ ...addressForm, latitude: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                        placeholder="18.9220"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Longitude (Optional)</label>
                      <input
                        type="text"
                        value={addressForm.longitude}
                        onChange={(e) => setAddressForm({ ...addressForm, longitude: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                        placeholder="72.8347"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-3 py-1.5 border rounded-lg font-semibold text-gray-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              {/* Survey Completion Modal Inline */}
              {surveyAddress && (
                <form onSubmit={handleCompleteSurvey} className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 card-shadow animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-indigo-600" />
                      <span>Complete Field Feasibility Survey</span>
                    </div>
                    <button type="button" onClick={() => setSurveyAddress(null)} className="text-gray-400 hover:text-gray-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-gray-600 text-[11px]">
                    Site: <span className="font-semibold text-gray-900">{surveyAddress.address_line1}, {surveyAddress.city}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Verified Latitude *</label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        value={surveyForm.latitude}
                        onChange={(e) => setSurveyForm({ ...surveyForm, latitude: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-mono"
                        placeholder="18.9220"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Verified Longitude *</label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        value={surveyForm.longitude}
                        onChange={(e) => setSurveyForm({ ...surveyForm, longitude: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-mono"
                        placeholder="72.8347"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Serviceability Result</label>
                      <select
                        value={surveyForm.serviceability_status}
                        onChange={(e) => setSurveyForm({ ...surveyForm, serviceability_status: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg"
                      >
                        <option value="SERVICEABLE">SERVICEABLE</option>
                        <option value="UNSERVICEABLE">UNSERVICEABLE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Field Notes</label>
                      <input
                        type="text"
                        value={surveyForm.field_notes}
                        onChange={(e) => setSurveyForm({ ...surveyForm, field_notes: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg"
                        placeholder="Drop fiber route verified, DP nearby"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSurveyAddress(null)}
                      className="px-3 py-1.5 border rounded-lg font-semibold text-gray-600 bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                    >
                      Submit &amp; Resolve Survey Ticket
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {addresses.length === 0 ? (
                  <div className="text-gray-400 text-center py-6 bg-white rounded-xl border">No installation addresses logged.</div>
                ) : (
                  addresses.map((a) => {
                    const isEditing = editingAddressId === a.id;
                    return (
                      <div key={a.id} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 card-shadow">
                        {isEditing ? (
                          <div className="space-y-3 p-2 bg-slate-50 rounded-lg border border-blue-200">
                            <div className="font-bold text-gray-800">Edit Address Record</div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Address Line 1</label>
                              <input
                                type="text"
                                value={editAddressForm.address_line1}
                                onChange={(e) => setEditAddressForm({ ...editAddressForm, address_line1: e.target.value })}
                                className="w-full px-2 py-1 bg-white border rounded text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Locality</label>
                                <input
                                  type="text"
                                  value={editAddressForm.locality}
                                  onChange={(e) => setEditAddressForm({ ...editAddressForm, locality: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">City</label>
                                <input
                                  type="text"
                                  value={editAddressForm.city}
                                  onChange={(e) => setEditAddressForm({ ...editAddressForm, city: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">PIN Code</label>
                                <input
                                  type="text"
                                  value={editAddressForm.postal_code}
                                  onChange={(e) => setEditAddressForm({ ...editAddressForm, postal_code: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border rounded text-xs font-mono"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Latitude</label>
                                <input
                                  type="text"
                                  value={editAddressForm.latitude}
                                  onChange={(e) => setEditAddressForm({ ...editAddressForm, latitude: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border rounded text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Longitude</label>
                                <input
                                  type="text"
                                  value={editAddressForm.longitude}
                                  onChange={(e) => setEditAddressForm({ ...editAddressForm, longitude: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border rounded text-xs font-mono"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingAddressId(null)}
                                className="px-3 py-1 border rounded bg-white font-medium text-gray-600"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditAddress(a.id)}
                                disabled={loading}
                                className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900">{a.address_line1 || 'Address Line Unspecified'}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 border">
                                  {a.address_type}
                                </span>
                                {a.latitude && a.longitude ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    GPS VERIFIED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    PENDING_SURVEY
                                  </span>
                                )}
                                {a.survey_ticket_code && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Survey: {a.survey_ticket_code} ({a.survey_ticket_status})
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-[11px]">
                                {a.locality && `${a.locality}, `}{a.city}, {a.state} {a.postal_code}
                              </div>
                              {a.latitude && a.longitude && (
                                <div className="text-gray-400 font-mono text-[10px]">
                                  GPS: {Number(a.latitude).toFixed(4)}, {Number(a.longitude).toFixed(4)}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isReadOnly && (
                                <>
                                  {(!a.latitude || !a.longitude || a.serviceability_status === 'PENDING_SURVEY') && (
                                    <button
                                      onClick={() => {
                                        setSurveyAddress(a);
                                        setSurveyForm({
                                          latitude: a.latitude ? String(a.latitude) : '',
                                          longitude: a.longitude ? String(a.longitude) : '',
                                          serviceability_status: 'SERVICEABLE',
                                          field_notes: ''
                                        });
                                      }}
                                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Record Field Survey"
                                    >
                                      <Compass className="w-3.5 h-3.5" />
                                      <span>Complete Survey</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleStartEditAddress(a)}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                    title="Edit Address"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {!a.is_primary && (
                                    <button
                                      onClick={() => handleArchiveAddress(a.id)}
                                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                      title="Archive Address"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KYC DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-700">KYC &amp; Legal Compliance Records</span>
                  <div className="text-[11px] text-gray-500">Encrypted object storage, MIME magic bytes verification &amp; PII masking</div>
                </div>
                {!isReadOnly && !showUploadDoc && (
                  <button
                    onClick={() => setShowUploadDoc(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-700"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </button>
                )}
              </div>

              {showUploadDoc && (
                <form onSubmit={handleUploadDocument} className="p-4 bg-white border border-blue-200 rounded-xl space-y-3 card-shadow animate-in fade-in">
                  <div className="font-bold text-gray-900 border-b border-gray-100 pb-2">Upload KYC Proof</div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Document Type *</label>
                      <select
                        value={docForm.document_type}
                        onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                      >
                        <option value="AADHAAR">Aadhaar Card (Unique Identification)</option>
                        <option value="PAN">PAN Card (Tax Identification)</option>
                        <option value="GSTIN">GSTIN Certificate (Commercial)</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="VOTER_ID">Voter ID Card</option>
                        <option value="DRIVING_LICENSE">Driving License</option>
                        <option value="UTILITY_BILL">Utility / Electricity Bill (Premises)</option>
                        <option value="LEASE_AGREEMENT">Registered Lease Agreement</option>
                        <option value="CERT_INCORPORATION">Certificate of Incorporation</option>
                        <option value="BOARD_RESOLUTION">Board Resolution</option>
                        <option value="OTHER">Other Proof</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Document Identifier (Auto-Masked)</label>
                      <input
                        type="text"
                        value={docForm.document_identifier}
                        onChange={(e) => setDocForm({ ...docForm, document_identifier: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                        placeholder="e.g. 5432-1234-9876 or ABCDE1234F"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">File Document (PDF, PNG, JPG, WEBP &bull; Max 10MB) *</label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] })}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-slate-50 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadDoc(false)}
                      className="px-3 py-1.5 border rounded-lg font-semibold text-gray-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload &amp; Encrypt</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {documents.length === 0 ? (
                  <div className="text-gray-400 text-center py-6 bg-white rounded-xl border">No KYC compliance documents uploaded.</div>
                ) : (
                  documents.map((doc) => {
                    const statusBadge = {
                      'VERIFIED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      'REJECTED': 'bg-rose-100 text-rose-800 border-rose-200',
                      'PENDING_VERIFICATION': 'bg-amber-100 text-amber-800 border-amber-200'
                    }[doc.verification_status] || 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div key={doc.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between card-shadow">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{doc.document_type}</span>
                            {doc.masked_identifier && (
                              <span className="font-mono text-gray-600 text-[11px] bg-slate-50 px-1.5 py-0.2 rounded border">
                                ID: {doc.masked_identifier}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge}`}>
                              {doc.verification_status}
                            </span>
                          </div>
                          <div className="text-gray-500 text-[11px] font-mono flex items-center gap-3">
                            <span>File: {doc.original_filename || 'document.pdf'}</span>
                            {doc.file_size_bytes && (
                              <span>({(doc.file_size_bytes / 1024).toFixed(1)} KB)</span>
                            )}
                            {doc.verification_notes && (
                              <span className="text-gray-400 italic font-sans">&bull; {doc.verification_notes}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="Download / View Document"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {!isReadOnly && doc.verification_status === 'PENDING_VERIFICATION' && (
                            <>
                              <button
                                onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                                title="Approve Verification"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Reject Document"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {!isReadOnly && (
                            <button
                              onClick={() => handleArchiveDocument(doc.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Archive Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-xl font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrmContactsModal;
