import React, { useState } from 'react';
import { api } from '../../services/api';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { 
  UserPlus, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw,
  Info,
  ArrowRight
} from 'lucide-react';

export const AddCustomerForm = ({ onSuccess, onCancel }) => {
  const { currentMarket, marketConfig } = useMarket();
  const { user } = useAuth();

  const isReadOnly = user?.role === 'Viewer' || user?.role === 'Customer';

  const [formData, setFormData] = useState({
    customer_number: '',
    legal_name: '',
    account_type: 'INDIVIDUAL',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    locality: marketConfig?.localities?.[0] || 'Colaba',
    city: marketConfig?.city || 'Mumbai',
    state: marketConfig?.state || 'Maharashtra',
    postal_code: '',
    latitude: '',
    longitude: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [createdCustomer, setCreatedCustomer] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.legal_name.trim()) {
      errs.legal_name = 'Customer / Company name is required.';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!/^[+]?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
      errs.phone = 'Enter a valid 10-15 digit phone number (e.g. +91 98200 12345).';
    }
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (formData.customer_number.trim()) {
      if (formData.customer_number.length > 32) {
        errs.customer_number = 'Customer number must not exceed 32 characters.';
      } else if (!/^[A-Za-z0-9_-]+$/.test(formData.customer_number.trim())) {
        errs.customer_number = 'Customer number can only contain letters, numbers, hyphens, and underscores.';
      }
    }
    if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      errs.latitude = 'Latitude must be between -90 and +90 degrees.';
    }
    if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      errs.longitude = 'Longitude must be between -180 and +180 degrees.';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) {
      setError('Your current role has read-only access. Customer creation is restricted to Admin and Care.');
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      legal_name: formData.legal_name.trim(),
      customer_number: formData.customer_number.trim() || undefined,
      account_type: formData.account_type,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      market_id: currentMarket,
      address_line1: formData.address_line1.trim() || undefined,
      address_line2: formData.address_line2.trim() || undefined,
      city: formData.city.trim() || marketConfig?.city || 'Mumbai',
      state: formData.state.trim() || marketConfig?.state || 'Maharashtra',
      postal_code: formData.postal_code.trim() || undefined,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined
    };

    try {
      const res = await api.createCustomer(payload);
      setCreatedCustomer(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      console.error('Customer creation failed:', err);
      if (err.status === 409) {
        setError(err.message || 'Duplicate conflict: A customer with this customer number or active identity (phone + email) already exists in this market.');
      } else {
        setError(err.message || 'Failed to create customer record.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (createdCustomer) {
    return (
      <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8 card-shadow space-y-6 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Customer Master Created Successfully</h2>
            <p className="text-xs text-gray-500">Record committed transactionally with CRM contacts and installation address.</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-gray-500">Customer Number:</span>
            <span className="font-bold text-gray-900">{createdCustomer.customer_number}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-gray-500">Legal Name:</span>
            <span className="font-bold text-gray-900">{createdCustomer.legal_name}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-gray-500">Market ID:</span>
            <span className="font-bold uppercase text-blue-600">{createdCustomer.market_id}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-gray-500">Account Type:</span>
            <span className="font-bold text-gray-900">{createdCustomer.account_type}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500">Lifecycle Status:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {createdCustomer.status}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setCreatedCustomer(null);
              setFormData({
                customer_number: '',
                legal_name: '',
                account_type: 'INDIVIDUAL',
                phone: '',
                email: '',
                address_line1: '',
                address_line2: '',
                locality: marketConfig?.localities?.[0] || 'Colaba',
                city: marketConfig?.city || 'Mumbai',
                state: marketConfig?.state || 'Maharashtra',
                postal_code: '',
                latitude: '',
                longitude: ''
              });
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Add Another Customer
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Back to Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-7 card-shadow max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            <span>CRM Customer Master Onboarding</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-1">Create New Customer Master</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create an authoritative customer record, primary contact, and installation address in {marketConfig?.city || currentMarket}.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-[11px] text-blue-700 font-semibold font-mono">
          Market: {currentMarket.toUpperCase()}
        </div>
      </div>

      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>You are logged in with role <strong>{user?.role}</strong> (Read-Only). Customer record creation is restricted.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">Validation / Conflict Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Master Identifiers */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Customer Master &amp; Organization Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Legal / Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="e.g. Ramesh Enterprises / Priya Sharma"
                className={`w-full px-3 py-2 rounded-xl border text-xs text-gray-900 focus:outline-none focus:ring-1 transition-colors ${
                  validationErrors.legal_name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {validationErrors.legal_name && (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.legal_name}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Customer Number / Code (Optional)
              </label>
              <input
                type="text"
                name="customer_number"
                value={formData.customer_number}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="e.g. CUST-MUM-9988 (Auto-generated if blank)"
                className={`w-full px-3 py-2 rounded-xl border text-xs text-gray-900 font-mono focus:outline-none focus:ring-1 transition-colors ${
                  validationErrors.customer_number ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {validationErrors.customer_number ? (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.customer_number}</p>
              ) : (
                <p className="text-[10px] text-gray-400 mt-1">Max 32 chars, letters, numbers, underscores and hyphens.</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Account Classification <span className="text-rose-500">*</span>
              </label>
              <select
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-medium"
              >
                <option value="INDIVIDUAL">INDIVIDUAL (Retail Consumer)</option>
                <option value="ENTERPRISE">ENTERPRISE (High-Capacity Fiber / ILL)</option>
                <option value="SME">SME (Small &amp; Medium Business)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Designated Market
              </label>
              <input
                type="text"
                disabled
                value={`${marketConfig?.city || 'Mumbai'} (${currentMarket})`}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Primary Contact Identity */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Primary Contact Identity</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="+91 98200 12345"
                className={`w-full px-3 py-2 rounded-xl border text-xs text-gray-900 font-mono focus:outline-none focus:ring-1 transition-colors ${
                  validationErrors.phone ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {validationErrors.phone && (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="customer@example.in"
                className={`w-full px-3 py-2 rounded-xl border text-xs text-gray-900 focus:outline-none focus:ring-1 transition-colors ${
                  validationErrors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {validationErrors.email && (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Physical Installation Address */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Installation &amp; Service Address</span>
            </h3>
            <span className="text-[10px] text-gray-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Preserved as PENDING_SURVEY if GPS is unverified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="Building name, flat/office number, street"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Locality / Area
              </label>
              <input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="e.g. Colaba, Bandra, Salt Lake"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Postal Code (PIN Code)
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="e.g. 400005 (Leave blank if unverified)"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                GPS Latitude (Optional)
              </label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="e.g. 18.9220 (-90 to +90)"
                className={`w-full px-3 py-2 rounded-xl border text-xs text-gray-900 font-mono focus:outline-none focus:ring-1 transition-colors ${
                  validationErrors.latitude ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {validationErrors.latitude && (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.latitude}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                GPS Longitude (Optional)
              </label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                disabled={isReadOnly || loading}
                placeholder="e.g. 72.8347 (-180 to +180)"
                className={`w-full px-3 py-2 rounded-xl border text-xs text-gray-900 font-mono focus:outline-none focus:ring-1 transition-colors ${
                  validationErrors.longitude ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {validationErrors.longitude && (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.longitude}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isReadOnly || loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Committing Master Record...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Customer Master</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerForm;
