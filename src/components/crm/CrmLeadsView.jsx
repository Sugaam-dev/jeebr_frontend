import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  X,
  Mail,
  Phone,
  Building2,
  IndianRupee,
  Calendar
} from 'lucide-react';

export const CrmLeadsView = ({ onOpen360 }) => {
  const { user } = useAuth();
  const { currentMarket, marketConfig } = useMarket();
  const isReadOnly = user?.role === 'Viewer' || user?.role === 'Customer';

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Conversion state
  const [convertingId, setConvertingId] = useState(null);
  const [convertSuccess, setConvertSuccess] = useState(null);

  // New Lead Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLeadLoading, setNewLeadLoading] = useState(false);
  const [newLeadError, setNewLeadError] = useState('');
  const [leadForm, setLeadForm] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    account_type: 'INDIVIDUAL',
    estimated_mrr: 1500
  });

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getLeads(searchTerm, statusFilter);
      setLeads(data || []);
    } catch (err) {
      console.error('Failed to load CRM leads:', err);
      setError(err.message || 'Failed to fetch prospects and leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [currentMarket, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLeads();
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!leadForm.phone.trim() && !leadForm.email.trim()) {
      setNewLeadError('At least phone or email is required.');
      return;
    }

    setNewLeadLoading(true);
    setNewLeadError('');

    try {
      await api.createLead({
        first_name: leadForm.first_name.trim() || undefined,
        last_name: leadForm.last_name.trim() || undefined,
        company_name: leadForm.company_name.trim() || undefined,
        email: leadForm.email.trim() || undefined,
        phone: leadForm.phone.trim() || undefined,
        account_type: leadForm.account_type,
        estimated_mrr: Number(leadForm.estimated_mrr) || undefined,
        market_id: currentMarket
      });
      setShowCreateModal(false);
      setLeadForm({
        first_name: '',
        last_name: '',
        company_name: '',
        email: '',
        phone: '',
        account_type: 'INDIVIDUAL',
        estimated_mrr: 1500
      });
      loadLeads();
    } catch (err) {
      setNewLeadError(err.message || 'Failed to capture lead.');
    } finally {
      setNewLeadLoading(false);
    }
  };

  const handleConvertLead = async (lead) => {
    if (isReadOnly) return;
    setConvertingId(lead.id);
    setError('');
    setConvertSuccess(null);

    try {
      const res = await api.convertLead(lead.id, {
        notes: `Converted to Customer Master from CRM Leads Portal by ${user?.email || 'Care Agent'}`
      });
      setConvertSuccess({
        leadName: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.company_name,
        customerNumber: res.customer_number,
        customerId: res.customer_id
      });
      loadLeads();
    } catch (err) {
      console.error('Lead conversion failed:', err);
      setError(err.message || 'Failed to convert lead to customer master.');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 card-shadow">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Prospect &amp; Inbound Pipeline</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 mt-1">
            CRM Leads &amp; Idempotent Customer Conversion
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track prospective subscribers in {marketConfig?.city || currentMarket} and promote them to authoritative Customer Masters with 1-click idempotent deduplication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadLeads()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
            title="Refresh leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!isReadOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Capture New Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {convertSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Conversion Complete!</span> Prospect{' '}
              <strong>{convertSuccess.leadName}</strong> promoted to Customer Master{' '}
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-900">
                {convertSuccess.customerNumber}
              </span>.
            </div>
          </div>
          {onOpen360 && convertSuccess.customerId && (
            <button
              onClick={() => onOpen360(convertSuccess.customerId)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
            >
              <span>View 360</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 font-medium"
        >
          <option value="">All Lead Statuses</option>
          <option value="NEW">NEW (Fresh Inbound)</option>
          <option value="CONTACTED">CONTACTED (Follow-up)</option>
          <option value="QUALIFIED">QUALIFIED (Sales Ready)</option>
          <option value="CONVERTED">CONVERTED (Promoted)</option>
          <option value="LOST">LOST (Disqualified)</option>
        </select>

        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer shrink-0"
        >
          Filter Leads
        </button>
      </form>

      {/* Leads Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Prospect / Lead</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Contact Details</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Account Type</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Est. MRR</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Master Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading CRM leads pipeline...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No leads found matching your criteria in {marketConfig?.city || currentMarket}.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isConverted = lead.status === 'CONVERTED';
                  const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.company_name || 'Anonymous Prospect';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{leadName}</div>
                        {lead.company_name && lead.company_name !== leadName && (
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span>{lead.company_name}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 space-y-1 font-mono text-[11px]">
                        {lead.phone && (
                          <div className="text-gray-700 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="text-gray-500 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-blue-500" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {lead.account_type || 'INDIVIDUAL'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-gray-900 font-semibold">
                        {lead.estimated_mrr ? `₹${Number(lead.estimated_mrr).toLocaleString()}/mo` : '—'}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isConverted 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : lead.status === 'QUALIFIED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : lead.status === 'CONTACTED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {lead.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {isConverted ? (
                          <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Converted</span>
                            {lead.converted_customer_id && onOpen360 && (
                              <button
                                onClick={() => onOpen360(lead.converted_customer_id)}
                                className="ml-1 text-blue-600 hover:underline cursor-pointer"
                                title="Open Customer 360"
                              >
                                View 360
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConvertLead(lead)}
                            disabled={isReadOnly || convertingId === lead.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Promote lead to Customer Master with transactional integrity"
                          >
                            {convertingId === lead.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Promoting...</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Convert to Customer</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capture Lead Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(4, 14, 54, 0.65)', backdropFilter: 'blur(6px)' }}
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg p-6 modal-shadow space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Capture Inbound Prospect</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newLeadError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {newLeadError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={leadForm.first_name}
                    onChange={(e) => setLeadForm({ ...leadForm, first_name: e.target.value })}
                    placeholder="e.g. Anand"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={leadForm.last_name}
                    onChange={(e) => setLeadForm({ ...leadForm, last_name: e.target.value })}
                    placeholder="e.g. Verma"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company / Business Name (Optional)</label>
                <input
                  type="text"
                  value={leadForm.company_name}
                  onChange={(e) => setLeadForm({ ...leadForm, company_name: e.target.value })}
                  placeholder="e.g. Apex Tech Solutions"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+91 98200 44556"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="anand@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Account Type</label>
                  <select
                    value={leadForm.account_type}
                    onChange={(e) => setLeadForm({ ...leadForm, account_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium"
                  >
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                    <option value="SME">SME</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Estimated MRR (₹)</label>
                  <input
                    type="number"
                    value={leadForm.estimated_mrr}
                    onChange={(e) => setLeadForm({ ...leadForm, estimated_mrr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newLeadLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {newLeadLoading ? 'Capturing...' : 'Save Prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmLeadsView;
