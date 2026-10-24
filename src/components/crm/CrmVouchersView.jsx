import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { 
  Gift, 
  Zap, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Plus,
  X,
  CreditCard,
  Wifi,
  Sparkles,
  Layers
} from 'lucide-react';

export const CrmVouchersView = ({ onOpen360 }) => {
  const { user } = useAuth();
  const { currentMarket } = useMarket();
  const isReadOnly = user?.role === 'Viewer' || user?.role === 'Customer';

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Issue Voucher Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueCustomerId, setIssueCustomerId] = useState('1');
  const [issueType, setIssueType] = useState('SPEED_BOOST');
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(null);
  const [issueError, setIssueError] = useState('');

  const loadVouchers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCustomerVouchers();
      setVouchers(data || []);
    } catch (err) {
      console.error('Failed to load customer vouchers:', err);
      setError(err.message || 'Failed to fetch customer vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, [currentMarket]);

  const handleIssueVoucher = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!issueCustomerId) {
      setIssueError('Customer ID is required.');
      return;
    }

    setIssueLoading(true);
    setIssueError('');
    setIssueSuccess(null);

    try {
      const res = await api.issueCustomerVoucher(issueCustomerId, issueType);
      setIssueSuccess(res);
      loadVouchers();
    } catch (err) {
      setIssueError(err.message || 'Failed to issue courtesy voucher.');
    } finally {
      setIssueLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* External System Dependency Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs card-shadow space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
          <Layers className="w-4 h-4 text-amber-600" />
          <span>External System Dependency &amp; Architecture Boundary</span>
        </div>
        <p className="text-amber-800 leading-relaxed">
          Customer promotional and retention vouchers staged within SentinelOS CRM are recorded as <strong>STAGED</strong>. 
          Final quota credit, broadband profile modification on the OLT/BNG, and billing ledger posting are dependent on the{' '}
          <strong className="underline decoration-amber-500">OSS/BSS Billing &amp; Provisioning Engine (Phase 2)</strong>.
        </p>
      </div>

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 card-shadow">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            <span>Subscriber Loyalty &amp; Autonomous Retention</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 mt-1">
            Customer Vouchers &amp; Courtesy Grants
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            View staged broadband speed boosters, OTT subscriptions, and retention bill credits for active accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadVouchers()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
            title="Refresh vouchers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!isReadOnly && (
            <button
              onClick={() => {
                setShowIssueModal(true);
                setIssueSuccess(null);
                setIssueError('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Courtesy Voucher</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vouchers Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Voucher Code</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Customer</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Grant Type</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Validity</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Lifecycle Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Backend System Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading && vouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading customer voucher grants...</span>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No customer vouchers logged for this market.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-blue-600" />
                          <span>{v.voucher_code}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{v.customer_name}</div>
                        {onOpen360 && (
                          <button
                            onClick={() => onOpen360(v.customer_id)}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5 mt-0.5"
                          >
                            <span>Inspect 360</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          v.voucher_type === 'SPEED_BOOST' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : v.voucher_type === 'BILL_DISCOUNT'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}>
                          {v.voucher_type}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-gray-700">
                        {v.validity_days} Days
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          v.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : v.status === 'STAGED'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          {v.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[10.5px] text-gray-500">
                        {v.provisioning_dependency || 'OSS/BSS Billing & Provisioning Engine (Phase 2)'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Voucher Modal */}
      {showIssueModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(4, 14, 54, 0.65)', backdropFilter: 'blur(6px)' }}
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 modal-shadow space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Issue Retention Courtesy Voucher</h3>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {issueSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Voucher Staged Successfully!</span>
                </div>
                <div className="font-mono text-[11px]">Code: {issueSuccess.voucher_code}</div>
                <div className="text-[10px] text-emerald-700">
                  Target: {issueSuccess.provisioning_dependency}
                </div>
              </div>
            )}

            {issueError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {issueError}
              </div>
            )}

            <form onSubmit={handleIssueVoucher} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Customer ID</label>
                <input
                  type="text"
                  value={issueCustomerId}
                  onChange={(e) => setIssueCustomerId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Voucher Grant Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-medium text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="SPEED_BOOST">SPEED_BOOST (+100 Mbps Turbo Boost)</option>
                  <option value="DATA_TOPUP">DATA_TOPUP (+50 GB High-Speed Pack)</option>
                  <option value="BILL_DISCOUNT">BILL_DISCOUNT (₹200 Courtesy Bill Credit)</option>
                  <option value="OTT_PASS">OTT_PASS (30-Day Streaming Pack)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-gray-800">Provisioning Note:</div>
                <div>Status will be logged as STAGED for automated execution by Phase 2 billing engines.</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={issueLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {issueLoading ? 'Staging Voucher...' : 'Issue Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmVouchersView;
