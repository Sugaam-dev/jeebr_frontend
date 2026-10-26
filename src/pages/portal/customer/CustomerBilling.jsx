import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useMarket } from '../../../context/MarketContext';
import { toast } from '../../../components/common/Toast';
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  FileText,
  ShieldCheck,
  RefreshCw,
  Receipt,
  Layers,
  Sparkles,
  ExternalLink,
  X,
  ChevronRight,
  IndianRupee,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

export const CustomerBilling = () => {
  const { user } = useAuth();
  const { currentMarket } = useMarket();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billingData, setBillingData] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const fetchBillingSummary = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getMyBillingSummary();
      setBillingData(data);
    } catch (err) {
      console.error('Failed to load billing summary:', err);
      toast.error('Unable to retrieve your billing and invoice records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBillingSummary(true);
  }, [currentMarket, user]);

  const handleDownloadPdf = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
      const blob = await api.downloadInvoicePdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoice_number || invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Downloaded Invoice ${invoice.invoice_number}`);
    } catch (err) {
      console.error('PDF download failed:', err);
      toast.error('Failed to download invoice PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    setOrderResult(null);
    setIsPayModalOpen(true);
  };

  const handleInitiatePayment = async () => {
    if (!selectedInvoice) return;
    setProcessingPayment(true);
    try {
      const payload = {
        invoice_id: selectedInvoice.id,
        amount: parseFloat(selectedInvoice.outstanding_amount || selectedInvoice.total_amount),
        payment_method: paymentMethod
      };
      const res = await api.createPaymentOrder(payload);
      setOrderResult(res);
      toast.success('Payment order generated successfully!');
      // Refresh billing data in background
      fetchBillingSummary(false);
    } catch (err) {
      console.error('Payment order failed:', err);
      toast.error(err.message || 'Failed to initialize payment gateway order.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
        </span>
      );
    }
    if (s === 'OVERDUE' || s === 'LATE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> Overdue
        </span>
      );
    }
    if (s === 'ISSUED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" /> Payment Due
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
        <div className="h-72 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const account = billingData?.billing_account;
  const subscriptions = billingData?.active_subscriptions || [];
  const invoices = billingData?.recent_invoices || [];
  const payments = billingData?.recent_payments || [];
  const totalOutstanding = billingData?.total_outstanding || 0;
  const balance = billingData?.account_balance || 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SentinelOS Financial Core &bull; GST Statutory Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Billing &amp; Tax Invoices
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              View official GST tax invoices, review active broadband subscriptions, and process secure settlements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchBillingSummary(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold backdrop-blur-xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Records'}</span>
            </button>
          </div>
        </div>

        {/* Ambient background blur elements */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Simulated Gateway Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <span className="font-bold">Sandbox Financial Gateway Mode:</span> Online checkout is connected to SentinelOS test adapter. All settlements are validated with HMAC-SHA256 signature verification and recorded in double-entry accounts receivable without live banking debits.
        </div>
      </div>

      {/* Financial Health & Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Due */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Total Outstanding</span>
              <Receipt className="w-4 h-4 text-rose-500" />
            </div>
            <div className={`text-2xl font-black ${totalOutstanding > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatCurrency(totalOutstanding)}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{totalOutstanding > 0 ? 'Immediate action required' : 'All accounts settled'}</span>
            {totalOutstanding > 0 && invoices.length > 0 && (
              <button
                onClick={() => handleOpenPayModal(invoices.find(i => i.status === 'Issued' || i.status === 'Overdue') || invoices[0])}
                className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Pay Now &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Prepaid Account Balance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Credit Balance</span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {formatCurrency(balance)}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Advance credit on account</span>
            <span className="font-semibold text-emerald-700">Available</span>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Billing Account</span>
              <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                {account?.status || 'Active'}
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {account?.account_number || 'ACC-DEFAULT'}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Customer Code: <strong className="text-slate-700 font-mono">{billingData?.customer_code}</strong></span>
          </div>
        </div>

        {/* Active Subscriptions Count */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Active Services</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {subscriptions.length} <span className="text-xs font-normal text-slate-500">Plan(s)</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>SAC: <strong className="text-slate-700 font-mono">998422</strong> (ISP Broadband)</span>
          </div>
        </div>
      </div>

      {/* Active Subscriptions Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Broadband Subscriptions</h2>
              <p className="text-xs text-slate-500">Recurring billing plans assigned to your subscriber profile</p>
            </div>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No active subscriptions found for this billing profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{sub.plan_code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                      {sub.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Cycle: <span className="font-medium text-slate-700 capitalize">{sub.billing_interval || 'Monthly'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Renewal: {formatDate(sub.current_period_end)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500">Subscribed</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Auto-renew active</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tax Invoices &amp; Receipts</h2>
            <p className="text-xs text-slate-500">Download authentic statutory GST invoices generated by ReportLab engine</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {invoices.length} invoice(s) on record
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No invoices generated yet for this billing account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Tax Treatment</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">
                      {inv.invoice_number || inv.id.substring(0, 8)}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {formatDate(inv.created_at || inv.due_date)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                        {inv.tax_treatment || 'INTRA_STATE'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="py-4 px-4">
                      {Number(inv.outstanding_amount || 0) > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatCurrency(inv.outstanding_amount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">&#8377;0.00</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Download PDF Button */}
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          disabled={downloadingId === inv.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer text-xs font-semibold disabled:opacity-50"
                          title="Download PDF Invoice"
                        >
                          <Download className={`w-3.5 h-3.5 ${downloadingId === inv.id ? 'animate-spin' : ''}`} />
                          <span>PDF</span>
                        </button>

                        {/* Pay Now Button if outstanding */}
                        {Number(inv.outstanding_amount || inv.total_amount) > 0 && inv.status !== 'Paid' && (
                          <button
                            onClick={() => handleOpenPayModal(inv)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer text-xs font-bold shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Settlements</h2>
            <p className="text-xs text-slate-500">History of online and recorded subscriber payments</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {payments.length} transaction(s)
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Payment Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Gateway Order ID</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">
                      {p.payment_number || p.reference_id || p.id.substring(0, 8)}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {formatDate(p.payment_date || p.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {p.payment_method || 'UPI'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500 text-[11px]">
                      {p.gateway_order_id ? (
                        <span className="text-blue-600 font-medium">{p.gateway_order_id}</span>
                      ) : (
                        <span className="text-slate-400">Direct / Internal</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'Captured' || p.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Online Payment Modal */}
      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Online Payment Checkout</h3>
                <p className="text-xs text-slate-400">Invoice: {selectedInvoice.invoice_number}</p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {orderResult ? (
                /* Success State */
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Payment Order Initialized</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Gateway Order ID: <code className="font-mono text-blue-600">{orderResult.order_id}</code>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(orderResult.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Provider:</span>
                      <span className="font-medium text-slate-700">{orderResult.provider_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mode:</span>
                      <span className="font-semibold text-amber-600">
                        {orderResult.is_simulated ? 'Simulated Sandbox' : 'Live Production'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsPayModalOpen(false);
                      fetchBillingSummary(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                  >
                    Done &amp; Refresh
                  </button>
                </div>
              ) : (
                /* Checkout Form */
                <>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-blue-700 font-medium">Due Amount</div>
                      <div className="text-xl font-extrabold text-blue-950">
                        {formatCurrency(selectedInvoice.outstanding_amount || selectedInvoice.total_amount)}
                      </div>
                    </div>
                    <div className="text-right text-xs text-blue-700">
                      <div>Tax Treatment</div>
                      <div className="font-mono font-bold">{selectedInvoice.tax_treatment || 'INTRA_STATE'}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Select Payment Instrument
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['UPI', 'Netbanking', 'Card'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                            paymentMethod === method
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{method}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Razorpay 256-bit SSL encrypted transaction with webhook reconciliation.</span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPayModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      disabled={processingPayment}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingPayment && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{processingPayment ? 'Processing...' : 'Authorize Payment'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBilling;
