import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import {
  IndianRupee,
  Receipt,
  CreditCard,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  FileText,
  Download,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Tag,
  BookOpen,
  ArrowRight,
  Zap,
  Play,
  RotateCcw
} from 'lucide-react';

export const FinanceManagement = () => {
  const { currentMarket } = useMarket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const onOpen360 = outletCtx?.onOpen360;

  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Domain data states
  const [overview, setOverview] = useState(null);
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerBalances, setLedgerBalances] = useState([]);
  const [ledgerVerification, setLedgerVerification] = useState(null);
  const [voucherRedemptions, setVoucherRedemptions] = useState([]);

  // Modals & sub-views
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDocument, setInvoiceDocument] = useState(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showCreateSubModal, setShowCreateSubModal] = useState(false);
  const [showIssueInvoiceModal, setShowIssueInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showRedeemVoucherModal, setShowRedeemVoucherModal] = useState(false);
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalTargetEntry, setReversalTargetEntry] = useState(null);

  // Form states
  const [newAccountForm, setNewAccountForm] = useState({
    customer_id: '',
    account_type: 'POSTPAID',
    credit_limit: 10000.0,
    currency: 'INR'
  });

  const [newSubForm, setNewSubForm] = useState({
    customer_id: '',
    plan_id: 'PLAN-POST-INFINITY-75G',
    billing_frequency: 'MONTHLY'
  });

  const [issueInvoiceForm, setIssueInvoiceForm] = useState({
    subscription_id: '',
    discount_amount: 0.0,
    notes: 'Standard billing cycle invoice'
  });

  const [recordPaymentForm, setRecordPaymentForm] = useState({
    customer_id: '',
    amount: '',
    payment_method: 'UPI',
    invoice_id: '',
    auto_allocate: true
  });

  const [redeemVoucherForm, setRedeemVoucherForm] = useState({
    customer_id: '',
    voucher_code: ''
  });

  const [reversalReason, setReversalReason] = useState('');

  // Filter states
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const isReadOnly = user?.role === 'Viewer';

  // Load overview and initial data
  const loadData = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setErrorMsg('');

    try {
      const [ovRes, gwRes] = await Promise.all([
        api.getFinanceOverview(currentMarket === 'all' ? null : currentMarket),
        api.getGatewayStatus()
      ]);
      setOverview(ovRes);
      setGatewayStatus(gwRes);

      // Load specific tab data based on active tab
      if (activeTab === 'overview') {
        const [invRes, payRes] = await Promise.all([
          api.getFinanceInvoices(currentMarket === 'all' ? null : currentMarket),
          api.getFinancePayments(currentMarket === 'all' ? null : currentMarket)
        ]);
        setInvoices(invRes || []);
        setPayments(payRes || []);
      } else if (activeTab === 'accounts') {
        const [accRes, subRes] = await Promise.all([
          api.getBillingAccounts(currentMarket === 'all' ? null : currentMarket),
          api.getBillingSubscriptions()
        ]);
        setAccounts(accRes || []);
        setSubscriptions(subRes || []);
      } else if (activeTab === 'invoices') {
        const invRes = await api.getFinanceInvoices(currentMarket === 'all' ? null : currentMarket);
        setInvoices(invRes || []);
      } else if (activeTab === 'payments') {
        const payRes = await api.getFinancePayments(currentMarket === 'all' ? null : currentMarket);
        setPayments(payRes || []);
      } else if (activeTab === 'ledger') {
        const [entriesRes, balancesRes, verifyRes] = await Promise.all([
          api.getLedgerEntries(currentMarket === 'all' ? null : currentMarket, 50),
          api.getLedgerBalances(currentMarket === 'all' ? null : currentMarket),
          api.verifyLedger(currentMarket === 'all' ? null : currentMarket)
        ]);
        setLedgerEntries(entriesRes || []);
        setLedgerBalances(balancesRes || []);
        setLedgerVerification(verifyRes || null);
      } else if (activeTab === 'vouchers') {
        const vrRes = await api.getVoucherRedemptions();
        setVoucherRedemptions(vrRes || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, currentMarket]);

  // Action Handlers
  const handleRunBillingJob = async () => {
    if (isReadOnly) return;
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.runBillingJob({ market_id: currentMarket === 'all' ? null : currentMarket });
      setSuccessMsg(`Billing Run completed: ${res.invoices_created} invoices generated for ${res.subscriptions_evaluated} subscriptions.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to run recurring billing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunDunningJob = async () => {
    if (isReadOnly) return;
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.runDunningJob({ market_id: currentMarket === 'all' ? null : currentMarket });
      setSuccessMsg(`Dunning completed: ${res.invoices_flagged_overdue} invoices marked overdue, ${res.accounts_suspended} delinquent accounts flagged.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to run dunning job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      const res = await api.createBillingAccount(newAccountForm);
      setSuccessMsg(`Billing Account ${res.account_code} created successfully.`);
      setShowCreateAccountModal(false);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create billing account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      const res = await api.createBillingSubscription(newSubForm);
      setSuccessMsg(`Subscription ${res.subscription_code} initiated on ${res.plan_id}.`);
      setShowCreateSubModal(false);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscriptionAction = async (subId, action) => {
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      await api.transitionSubscription(subId, action, `Manual ${action} by ${user?.email}`);
      setSuccessMsg(`Subscription state successfully updated: ${action}.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to transition subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueInvoice = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      const res = await api.issueInvoice(issueInvoiceForm);
      setSuccessMsg(`Invoice ${res.invoice_code} generated for ₹${res.total_amount.toLocaleString()}.`);
      setShowIssueInvoiceModal(false);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      const payload = {
        ...recordPaymentForm,
        amount: parseFloat(recordPaymentForm.amount),
        invoice_id: recordPaymentForm.invoice_id || null,
        idempotency_key: `pay_fe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      };
      const res = await api.recordPayment(payload);
      setSuccessMsg(`Payment ${res.payment_code} recorded. Allocated: ₹${res.allocated_amount.toLocaleString()} (Simulated: ${res.is_simulated ? 'YES' : 'NO'}).`);
      setShowRecordPaymentModal(false);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRedeemVoucher = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      const res = await api.redeemVoucher({
        ...redeemVoucherForm,
        idempotency_key: `vouch_fe_${Date.now()}`
      });
      setSuccessMsg(`Voucher ${res.voucher_code} (${res.benefit_type}) redeemed: ${res.message}.`);
      setShowRedeemVoucherModal(false);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to redeem voucher');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverseLedger = async (e) => {
    e.preventDefault();
    if (isReadOnly || !reversalTargetEntry) return;
    setActionLoading(true);
    try {
      const res = await api.reverseLedgerEntry(reversalTargetEntry.id, reversalReason);
      setSuccessMsg(`Ledger entry reversed. New reversing entry ${res.entry_number} posted.`);
      setShowReversalModal(false);
      setReversalReason('');
      setReversalTargetEntry(null);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reverse entry');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async (invId) => {
    try {
      const doc = await api.downloadInvoice(invId);
      setInvoiceDocument(doc);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch invoice document');
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceStatusFilter !== 'ALL' && inv.status !== invoiceStatusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        inv.invoice_code?.toLowerCase().includes(term) ||
        inv.customer_id?.toLowerCase().includes(term) ||
        inv.status?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Operations Cockpit', path: '/dashboard/cockpit' },
          { label: 'Finance & Billing Management', active: true }
        ]}
      />

      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB] flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-blue-600" />
            <span>SentinelOS Enterprise Billing &amp; General Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
            Finance &amp; Subscription Operations
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {currentMarket === 'all' ? 'All Markets' : currentMarket.toUpperCase()}
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Authoritative ISP billing lifecycle: canonical tariff subscriptions, automated 18% GST invoice generation, concurrency-safe payment allocation, immutable double-entry ledger, and retention voucher redemption.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
            title="Refresh Finance Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {!isReadOnly && (
            <>
              <button
                onClick={handleRunBillingJob}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Trigger Idempotent Recurring Billing Run"
              >
                <Play className="w-3.5 h-3.5 text-indigo-200" />
                <span>Run Billing Job</span>
              </button>

              <button
                onClick={handleRunDunningJob}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Evaluate Overdue Invoices and Delinquency Rules"
              >
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                <span>Evaluate Dunning</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Gateway & Environment Status Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Payment Gateway Mode */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between card-shadow ${
          gatewayStatus?.provider_mode === 'SIMULATED'
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">Payment Gateway</div>
              <div className="text-xs font-bold">
                {gatewayStatus?.provider_name || 'SimulatedProvider'}
                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-200 text-amber-800">
                  {gatewayStatus?.provider_mode || 'SIMULATED'}
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-amber-700 max-w-[150px] text-right font-medium">
            {gatewayStatus?.note || 'Safe Local Sandbox'}
          </span>
        </div>

        {/* Double-Entry Ledger Balancing */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between card-shadow ${
          overview?.ledger_is_balanced
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">General Ledger</div>
              <div className="text-xs font-bold flex items-center gap-1">
                {overview?.ledger_is_balanced ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    <span>Double-Entry Balanced</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 inline" />
                    <span>Discrepancy Detected</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Debits == Credits
          </span>
        </div>

        {/* Canonical Tariff Alignment */}
        <div className="p-3.5 rounded-xl border bg-blue-50/70 border-blue-200 text-blue-900 flex items-center justify-between card-shadow">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">Tax &amp; Compliance</div>
              <div className="text-xs font-bold">18% GST (CGST 9% + SGST 9%)</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
            HSN: 998422
          </span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between card-shadow">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between card-shadow">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: TrendingUp },
          { id: 'accounts', label: 'Accounts & Subscriptions', icon: Building },
          { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
          { id: 'payments', label: 'Payments & Allocations', icon: CreditCard },
          { id: 'ledger', label: 'General Ledger', icon: BookOpen },
          { id: 'vouchers', label: 'Vouchers & Retention', icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 card-shadow space-y-1">
              <div className="text-gray-500 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Total Invoiced</span>
                <Receipt className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 font-mono">
                &#8377;{(overview?.kpis?.total_invoiced || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-500">
                {overview?.kpis?.invoice_count || 0} Invoices Issued
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 card-shadow space-y-1">
              <div className="text-gray-500 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Total Collected</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                &#8377;{(overview?.kpis?.total_collected || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                {overview?.kpis?.payment_count || 0} Authorized Payments
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 card-shadow space-y-1">
              <div className="text-gray-500 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Accounts Receivable</span>
                <IndianRupee className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                &#8377;{(overview?.kpis?.outstanding_receivables || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-600 font-medium">
                Current Outstanding Balance
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 card-shadow space-y-1">
              <div className="text-gray-500 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Overdue Invoices</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {overview?.kpis?.overdue_count || 0}
              </div>
              <div className="text-[11px] text-rose-600 font-medium">
                Subject to Dunning / Grace Policy
              </div>
            </div>
          </div>

          {/* Recent Invoices & Recent Payments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 card-shadow space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">Recent Invoices</h3>
                </div>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Invoices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {invoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="p-3 rounded-xl border border-gray-100 hover:border-gray-300 bg-slate-50/50 flex items-center justify-between transition-colors">
                    <div>
                      <div className="text-xs font-mono font-bold text-gray-900">{inv.invoice_code}</div>
                      <div className="text-[11px] text-gray-500">
                        Total: &#8377;{Number(inv.total_amount).toLocaleString()} &bull; Tax: &#8377;{Number(inv.tax_amount).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.status === 'Partially_Paid'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : inv.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs">No invoices generated yet.</div>
                )}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 card-shadow space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900">Recent Collections</h3>
                </div>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Payments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {payments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="p-3 rounded-xl border border-gray-100 hover:border-gray-300 bg-slate-50/50 flex items-center justify-between transition-colors">
                    <div>
                      <div className="text-xs font-mono font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{pay.payment_code}</span>
                        {pay.is_simulated && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 rounded font-sans font-bold">
                            SIMULATED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Method: {pay.payment_method} &bull; Allocated: &#8377;{Number(pay.allocated_amount).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-700">
                        &#8377;{Number(pay.amount).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {pay.created_at ? new Date(pay.created_at).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs">No payments recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: ACCOUNTS & SUBSCRIPTIONS ─── */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Header & New Account Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Customer Billing Accounts ({accounts.length})</span>
            </h3>
            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateAccountModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Billing Account</span>
                </button>
                <button
                  onClick={() => setShowCreateSubModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Subscription</span>
                </button>
              </div>
            )}
          </div>

          {/* Accounts Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden card-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Account Code</th>
                    <th className="p-3.5">Customer ID</th>
                    <th className="p-3.5">Market</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Balance</th>
                    <th className="p-3.5 text-right">Credit Limit</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-600">{acc.account_code}</td>
                      <td className="p-3.5 font-mono text-gray-700">{acc.customer_id}</td>
                      <td className="p-3.5 uppercase font-semibold text-gray-600">{acc.market_id}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          acc.account_type === 'PREPAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          acc.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : acc.status === 'SUSPENDED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                        &#8377;{Number(acc.balance).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-gray-600">
                        &#8377;{Number(acc.credit_limit).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        {onOpen360 && (
                          <button
                            onClick={() => onOpen360(acc.customer_id)}
                            className="p-1 text-gray-500 hover:text-blue-600 cursor-pointer"
                            title="Inspect Customer 360"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">No billing accounts found for this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subscriptions Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Customer Service Subscriptions ({subscriptions.length})</span>
            </h3>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden card-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Sub Code</th>
                      <th className="p-3.5">Canonical Plan ID</th>
                      <th className="p-3.5">Billing Freq</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Start Date</th>
                      <th className="p-3.5">Next Billing</th>
                      <th className="p-3.5 text-center">Lifecycle Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-gray-900">{sub.subscription_code}</td>
                        <td className="p-3.5 font-mono font-semibold text-blue-700">{sub.plan_id}</td>
                        <td className="p-3.5 text-gray-600 font-semibold">{sub.billing_frequency}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sub.status === 'SUSPENDED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-500 font-mono">
                          {sub.effective_start ? new Date(sub.effective_start).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3.5 text-gray-500 font-mono">
                          {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3.5 text-center">
                          {!isReadOnly && (
                            <div className="flex items-center justify-center gap-1.5">
                              {sub.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleSubscriptionAction(sub.id, 'SUSPEND')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Suspend
                                </button>
                              )}
                              {sub.status === 'SUSPENDED' && (
                                <button
                                  onClick={() => handleSubscriptionAction(sub.id, 'REACTIVATE')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Reactivate
                                </button>
                              )}
                              {sub.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => handleSubscriptionAction(sub.id, 'CANCEL')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {subscriptions.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-400">No subscriptions created yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: INVOICES & BILLING ─── */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice code, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs font-semibold">
                {['ALL', 'Issued', 'Paid', 'Partially_Paid', 'Overdue'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      invoiceStatusFilter === st
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {!isReadOnly && (
              <button
                onClick={() => setShowIssueInvoiceModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Direct Invoice</span>
              </button>
            )}
          </div>

          {/* Invoices Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden card-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Invoice Code</th>
                    <th className="p-3.5">Customer ID</th>
                    <th className="p-3.5">Market</th>
                    <th className="p-3.5">Subtotal</th>
                    <th className="p-3.5">Tax (18% GST)</th>
                    <th className="p-3.5 text-right">Total Amount</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Outstanding</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Doc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-600">{inv.invoice_code}</td>
                      <td className="p-3.5 font-mono text-gray-700">{inv.customer_id}</td>
                      <td className="p-3.5 uppercase font-semibold text-gray-600">{inv.market_id}</td>
                      <td className="p-3.5 font-mono text-gray-700">&#8377;{Number(inv.subtotal).toLocaleString()}</td>
                      <td className="p-3.5 font-mono text-gray-600">&#8377;{Number(inv.tax_amount).toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                        &#8377;{Number(inv.total_amount).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-700 font-semibold">
                        &#8377;{Number(inv.paid_amount).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-rose-700 font-bold">
                        &#8377;{Number(inv.outstanding_amount).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.status === 'Partially_Paid'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : inv.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDownloadInvoice(inv.id)}
                          className="p-1 text-gray-500 hover:text-blue-600 cursor-pointer"
                          title="View Official Tax Invoice Breakdown"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="10" className="p-8 text-center text-gray-400">No invoices matched the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: PAYMENTS & ALLOCATIONS ─── */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Payment Records &amp; Allocations ({payments.length})</span>
            </h3>
            {!isReadOnly && (
              <button
                onClick={() => setShowRecordPaymentModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Payment</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden card-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Payment Code</th>
                    <th className="p-3.5">Customer ID</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Allocated</th>
                    <th className="p-3.5">Unallocated Credit</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Gateway / Provider</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-emerald-700">{p.payment_code}</td>
                      <td className="p-3.5 font-mono text-gray-700">{p.customer_id}</td>
                      <td className="p-3.5 font-semibold text-gray-600">{p.payment_method}</td>
                      <td className="p-3.5 font-mono font-bold text-gray-900">&#8377;{Number(p.amount).toLocaleString()}</td>
                      <td className="p-3.5 font-mono text-emerald-700">&#8377;{Number(p.allocated_amount).toLocaleString()}</td>
                      <td className="p-3.5 font-mono text-amber-600">&#8377;{Number(p.unallocated_amount).toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'ALLOCATED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'PARTIALLY_ALLOCATED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          {p.is_simulated ? 'SIMULATED' : 'LIVE GATEWAY'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-mono">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-400">No payment transactions recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: GENERAL LEDGER ─── */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Invariant Banner */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Double-Entry Ledger Integrity Status</h3>
                <p className="text-xs text-gray-500">
                  Postings: {ledgerVerification?.entries_evaluated || 0} entries evaluated.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] text-gray-500 font-semibold uppercase">Total Debits</div>
                <div className="text-sm font-mono font-bold text-gray-900">
                  &#8377;{Number(ledgerVerification?.total_debits || 0).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500 font-semibold uppercase">Total Credits</div>
                <div className="text-sm font-mono font-bold text-gray-900">
                  &#8377;{Number(ledgerVerification?.total_credits || 0).toLocaleString()}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                ledgerVerification?.is_balanced
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {ledgerVerification?.is_balanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{ledgerVerification?.is_balanced ? 'BALANCED' : 'UNBALANCED'}</span>
              </span>
            </div>
          </div>

          {/* Chart of Accounts Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Account Balances (Chart of Accounts)</h4>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {ledgerBalances.map((acc) => (
                <div key={acc.account_code} className="bg-white border border-[#E2E8F0] rounded-xl p-3 card-shadow space-y-1">
                  <div className="text-[10px] font-mono font-bold text-blue-600">{acc.account_code}</div>
                  <div className="text-xs font-bold text-gray-800 truncate" title={acc.account_name}>{acc.account_name}</div>
                  <div className="text-sm font-mono font-black text-gray-900 pt-1">
                    &#8377;{Number(acc.balance).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase">{acc.account_type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Immutable Journal Entries Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Immutable Journal Entries ({ledgerEntries.length})</h4>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden card-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Entry #</th>
                      <th className="p-3.5">Ref Type</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5">Market</th>
                      <th className="p-3.5 text-right">Debit Lines</th>
                      <th className="p-3.5 text-right">Credit Lines</th>
                      <th className="p-3.5 text-right">Total (INR)</th>
                      <th className="p-3.5 text-center">Reversal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {ledgerEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-blue-700">{e.entry_number}</td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                            {e.reference_type}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-700 max-w-xs truncate" title={e.description}>{e.description}</td>
                        <td className="p-3.5 uppercase font-semibold text-gray-600">{e.market_id}</td>
                        <td className="p-3.5 text-right font-mono text-gray-800">
                          {e.lines?.filter(l => l.entry_type === 'DEBIT').map(l => `${l.account_code}: ₹${Number(l.amount).toLocaleString()}`).join(', ') || '-'}
                        </td>
                        <td className="p-3.5 text-right font-mono text-gray-800">
                          {e.lines?.filter(l => l.entry_type === 'CREDIT').map(l => `${l.account_code}: ₹${Number(l.amount).toLocaleString()}`).join(', ') || '-'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                          &#8377;{Number(e.total_amount).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          {e.is_reversal ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              REVERSAL
                            </span>
                          ) : (
                            !isReadOnly && (
                              <button
                                onClick={() => {
                                  setReversalTargetEntry(e);
                                  setShowReversalModal(true);
                                }}
                                className="p-1 text-gray-400 hover:text-amber-600 cursor-pointer"
                                title="Post Balanced Reversal Entry"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                    {ledgerEntries.length === 0 && (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-gray-400">No ledger entries posted.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: VOUCHERS & RETENTION ─── */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <span>Retention Voucher Redemptions ({voucherRedemptions.length})</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Financial vs Service-benefit fulfillment: Bill discounts issue credit notes + ledger entries, speed boosts trigger automated provisioning, OTT passes require reconciliation.
              </p>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => setShowRedeemVoucherModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Redeem Voucher</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden card-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Voucher Code</th>
                    <th className="p-3.5">Customer ID</th>
                    <th className="p-3.5">Benefit Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Financial Credit Note</th>
                    <th className="p-3.5">Provisioning Fulfillment</th>
                    <th className="p-3.5">Redemption Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {voucherRedemptions.map((vr) => (
                    <tr key={vr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{vr.voucher_code}</td>
                      <td className="p-3.5 font-mono text-gray-700">{vr.customer_id}</td>
                      <td className="p-3.5 font-bold text-gray-800">{vr.benefit_type}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          vr.status === 'REDEEMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : vr.status === 'RECONCILIATION_REQUIRED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {vr.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-blue-600">{vr.credit_note_id || 'N/A'}</td>
                      <td className="p-3.5 font-mono text-gray-600">{vr.fulfillment_order_id || 'N/A'}</td>
                      <td className="p-3.5 text-gray-500 font-mono">
                        {vr.redeemed_at ? new Date(vr.redeemed_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {voucherRedemptions.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">No voucher redemption records logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: INVOICE DOCUMENT PREVIEW ─── */}
      {invoiceDocument && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  {invoiceDocument.document_type} &bull; {invoiceDocument.invoice_code}
                </h3>
              </div>
              <button
                onClick={() => setInvoiceDocument(null)}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
              {/* Provider & Customer Header */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-100">
                <div>
                  <div className="font-bold text-gray-900">{invoiceDocument?.provider?.legal_name || invoiceDocument?.provider?.name || 'SentinelOS Broadband Network'}</div>
                  <div className="text-gray-500 font-mono text-[11px]">GSTIN: {invoiceDocument?.provider?.gstin || '27AAACP0123M1Z5'}</div>
                  <div className="text-gray-500 font-mono text-[11px]">PAN: {invoiceDocument?.provider?.pan || 'AAACP0123M'}</div>
                  <div className="text-gray-500">{invoiceDocument?.provider?.address || invoiceDocument?.provider?.jurisdiction || 'Mumbai, Maharashtra'}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500">Billed To Customer:</div>
                  <div className="font-mono font-bold text-gray-900">{invoiceDocument?.customer?.customer_id || invoiceDocument?.customer?.code || 'Subscriber'}</div>
                  <div className="text-gray-500">Market: {(invoiceDocument?.customer?.market_id || invoiceDocument?.market || 'MUMBAI').toUpperCase()}</div>
                  <div className="text-gray-500">Place of Supply: {invoiceDocument?.customer?.place_of_supply || '27-Maharashtra'}</div>
                </div>
              </div>

              {/* Line items table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2">HSN</th>
                    <th className="py-2 text-right">Taxable</th>
                    <th className="py-2 text-right">CGST (9%)</th>
                    <th className="py-2 text-right">SGST (9%)</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {(invoiceDocument?.line_items || []).map((it, idx) => (
                    <tr key={it.item_id || it.id || idx}>
                      <td className="py-2 font-sans font-medium text-gray-900">{it.description}</td>
                      <td className="py-2 text-gray-500">{it.hsn_code || '998422'}</td>
                      <td className="py-2 text-right">&#8377;{Number(it.unit_price ?? it.amount ?? 0).toLocaleString()}</td>
                      <td className="py-2 text-right">&#8377;{Number(it.cgst_amount ?? ((it.tax_amount || 0) / 2)).toLocaleString()}</td>
                      <td className="py-2 text-right">&#8377;{Number(it.sgst_amount ?? ((it.tax_amount || 0) / 2)).toLocaleString()}</td>
                      <td className="py-2 text-right font-bold text-gray-900">&#8377;{Number(it.total_amount ?? it.total ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="pt-3 border-t border-gray-200 flex justify-end">
                <div className="w-48 space-y-1 font-mono text-right">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span>&#8377;{Number(invoiceDocument?.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST (18%):</span>
                    <span>&#8377;{Number(
                      invoiceDocument?.tax_breakdown
                        ? ((invoiceDocument.tax_breakdown.cgst_9pct || 0) + (invoiceDocument.tax_breakdown.sgst_9pct || 0))
                        : (invoiceDocument?.tax_amount || 0)
                    ).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1 text-sm">
                    <span>Total:</span>
                    <span>&#8377;{Number(invoiceDocument?.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE BILLING ACCOUNT ─── */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Open Customer Billing Account</h3>
              <button onClick={() => setShowCreateAccountModal(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleCreateAccount} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Customer ID (UUID or Code)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUST-MUM-0001"
                  value={newAccountForm.customer_id}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, customer_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Account Type</label>
                <select
                  value={newAccountForm.account_type}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, account_type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="POSTPAID">POSTPAID (Invoiced Monthly)</option>
                  <option value="PREPAID">PREPAID (Upfront Balance Quota)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Credit Limit (INR)</label>
                <input
                  type="number"
                  step="100"
                  value={newAccountForm.credit_limit}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, credit_limit: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE SUBSCRIPTION ─── */}
      {showCreateSubModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Provision Canonical Subscription</h3>
              <button onClick={() => setShowCreateSubModal(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleCreateSubscription} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Customer ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUST-MUM-0001"
                  value={newSubForm.customer_id}
                  onChange={(e) => setNewSubForm({ ...newSubForm, customer_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Canonical Plan</label>
                <select
                  value={newSubForm.plan_id}
                  onChange={(e) => setNewSubForm({ ...newSubForm, plan_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  <option value="PLAN-POST-INFINITY-75G">PLAN-POST-INFINITY-75G (₹499/mo, 75GB)</option>
                  <option value="PLAN-PRE-UNLIMITED-5G">PLAN-PRE-UNLIMITED-5G (₹299/28d, Daily 2GB)</option>
                  <option value="PLAN-POST-CORP-500M">PLAN-POST-CORP-500M (₹12,000/mo, 500Mbps Leased Line)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Billing Frequency</label>
                <select
                  value={newSubForm.billing_frequency}
                  onChange={(e) => setNewSubForm({ ...newSubForm, billing_frequency: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="ANNUAL">ANNUAL</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSubModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Bind Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ISSUE DIRECT INVOICE ─── */}
      {showIssueInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Issue Cycle Invoice</h3>
              <button onClick={() => setShowIssueInvoiceModal(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleIssueInvoice} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Subscription ID</label>
                <input
                  type="text"
                  required
                  placeholder="UUID or Code"
                  value={issueInvoiceForm.subscription_id}
                  onChange={(e) => setIssueInvoiceForm({ ...issueInvoiceForm, subscription_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Authorized Discount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={issueInvoiceForm.discount_amount}
                  onChange={(e) => setIssueInvoiceForm({ ...issueInvoiceForm, discount_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Invoice Notes</label>
                <input
                  type="text"
                  value={issueInvoiceForm.notes}
                  onChange={(e) => setIssueInvoiceForm({ ...issueInvoiceForm, notes: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueInvoiceModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: RECORD PAYMENT ─── */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Record Authorized Payment</h3>
              <button onClick={() => setShowRecordPaymentModal(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Customer ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUST-MUM-0001"
                  value={recordPaymentForm.customer_id}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, customer_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="588.82"
                  value={recordPaymentForm.amount}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, amount: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Payment Method</label>
                <select
                  value={recordPaymentForm.payment_method}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, payment_method: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UPI">UPI (Instant Settlement)</option>
                  <option value="NetBanking">NetBanking / NEFT</option>
                  <option value="CreditCard">Credit / Debit Card</option>
                  <option value="Cash">Cash / OTC Collection</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Target Invoice ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-allocate or credit balance"
                  value={recordPaymentForm.invoice_id}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, invoice_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REDEEM RETENTION VOUCHER ─── */}
      {showRedeemVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Redeem Customer Retention Voucher</h3>
              <button onClick={() => setShowRedeemVoucherModal(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleRedeemVoucher} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Customer ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUST-MUM-0001"
                  value={redeemVoucherForm.customer_id}
                  onChange={(e) => setRedeemVoucherForm({ ...redeemVoucherForm, customer_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Voucher Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VOUCH-RET-500"
                  value={redeemVoucherForm.voucher_code}
                  onChange={(e) => setRedeemVoucherForm({ ...redeemVoucherForm, voucher_code: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 space-y-1">
                <div className="font-bold">Fulfillment Routing:</div>
                <div>&bull; Bill Discount: issues Credit Note + General Ledger debit.</div>
                <div>&bull; Speed Boost / Data Top-up: invokes Provisioning engine.</div>
                <div>&bull; OTT Pass: sets Reconciliation Pending (fail-closed).</div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemVoucherModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Execute Fulfillment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REVERSE LEDGER ENTRY ─── */}
      {showReversalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Reverse Ledger Entry</h3>
              <button onClick={() => setShowReversalModal(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleReverseLedger} className="p-5 space-y-4 text-xs">
              <p className="text-gray-600">
                You are generating a balanced reversing journal entry for Entry <strong className="font-mono text-gray-900">{reversalTargetEntry?.entry_number}</strong> (₹{reversalTargetEntry?.total_amount}).
              </p>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Audit Reason for Reversal</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Explain why this entry is being reversed..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReversalModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Post Reversing Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FinanceManagement;
