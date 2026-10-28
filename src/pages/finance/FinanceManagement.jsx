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
  Pause,
  RotateCcw,
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  Lock,
  Unlock,
  Activity,
  Check,
  X
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
  const [voucherCampaigns, setVoucherCampaigns] = useState([]);

  // Modals & sub-views
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDocument, setInvoiceDocument] = useState(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showCreateSubModal, setShowCreateSubModal] = useState(false);
  const [showIssueInvoiceModal, setShowIssueInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showRedeemVoucherModal, setShowRedeemVoucherModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showBulkCampaignModal, setShowBulkCampaignModal] = useState(false);
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalTargetEntry, setReversalTargetEntry] = useState(null);

  // Background Scheduler & Operations Console State
  const [schedulerOverview, setSchedulerOverview] = useState(null);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [billingJobRuns, setBillingJobRuns] = useState([]);
  const [jobRunTotal, setJobRunTotal] = useState(0);
  const [jobRunPage, setJobRunPage] = useState(1);
  const [jobRunFilterStatus, setJobRunFilterStatus] = useState('');
  const [jobRunFilterType, setJobRunFilterType] = useState('');
  const [selectedRunDetail, setSelectedRunDetail] = useState(null);
  const [showRunDetailModal, setShowRunDetailModal] = useState(false);
  const [showTriggerJobModal, setShowTriggerJobModal] = useState(false);
  const [targetJobType, setTargetJobType] = useState('RECURRING_BILLING');
  const [targetJobMarket, setTargetJobMarket] = useState('all');
  const [reconcileReason, setReconcileReason] = useState('');
  const [notificationOutbox, setNotificationOutbox] = useState([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifSummary, setNotifSummary] = useState({});
  const [notifChannelFilter, setNotifChannelFilter] = useState('');
  const [notifStatusFilter, setNotifStatusFilter] = useState('');
  const [notifPage, setNotifPage] = useState(1);

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

  const [newCampaignForm, setNewCampaignForm] = useState({
    voucher_code: '',
    campaign_name: '',
    description: '',
    voucher_type: 'BILL_DISCOUNT',
    discount_amount: '100',
    discount_percent: '0',
    max_discount_cap: '',
    min_invoice_amount: '0',
    max_redemptions: 100,
    per_customer_limit: 1,
    valid_until: '',
    market_id: 'ALL'
  });

  const [bulkCampaignForm, setBulkCampaignForm] = useState({
    prefix: 'PROMO',
    count: 10,
    campaign_name: '',
    description: '',
    voucher_type: 'BILL_DISCOUNT',
    discount_amount: '100',
    discount_percent: '0',
    max_discount_cap: '',
    min_invoice_amount: '0',
    max_redemptions: 1,
    per_customer_limit: 1,
    valid_until: '',
    market_id: 'ALL'
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
        const [vrRes, vCampRes] = await Promise.all([
          api.getVoucherRedemptions(),
          api.getVouchers()
        ]);
        setVoucherRedemptions(vrRes || []);
        setVoucherCampaigns(vCampRes || []);
      } else if (activeTab === 'scheduler') {
        const marketParam = currentMarket === 'all' ? null : currentMarket;
        const [schedOverview, runsRes, notifRes] = await Promise.all([
          api.getSchedulerOverview({ market_id: marketParam }),
          api.getBillingJobRuns({
            market_id: marketParam,
            status: jobRunFilterStatus || undefined,
            job_type: jobRunFilterType || undefined,
            page: jobRunPage,
            page_size: 10
          }),
          api.getNotificationOutbox({
            market_id: marketParam,
            channel: notifChannelFilter || undefined,
            status: notifStatusFilter || undefined,
            page: notifPage,
            page_size: 10
          })
        ]);
        setSchedulerOverview(schedOverview || null);
        setScheduledJobs(schedOverview?.jobs || []);
        setBillingJobRuns(runsRes?.items || []);
        setJobRunTotal(runsRes?.total || 0);
        setNotificationOutbox(notifRes?.items || []);
        setNotifTotal(notifRes?.total || 0);
        setNotifSummary(notifRes?.summary_by_status || {});
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

  useEffect(() => {
    if (activeTab === 'scheduler') {
      loadData();
    }
  }, [jobRunPage, jobRunFilterStatus, jobRunFilterType, notifChannelFilter, notifStatusFilter, notifPage]);

  // Background Scheduler Handlers
  const handleTriggerJobSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.runSchedulerJob(targetJobType, {
        market_id: targetJobMarket === 'all' ? null : targetJobMarket
      });
      setSuccessMsg(`Job ${targetJobType} executed successfully: ${res.processed ?? 0} records processed.`);
      setShowTriggerJobModal(false);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to trigger job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconcileRunAction = async (runId, action) => {
    if (isReadOnly) return;
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.reconcileJobRun(runId, {
        action: action,
        reason: reconcileReason || `Manual operator ${action}`
      });
      setSuccessMsg(`Job run ${runId.slice(0, 8)}... successfully ${action === 'RETRY' ? 'retried' : 'reconciled'}.`);
      setShowRunDetailModal(false);
      setSelectedRunDetail(null);
      setReconcileReason('');
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || `Failed to ${action.toLowerCase()} job run`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessOutboxNow = async () => {
    if (isReadOnly) return;
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.processNotificationOutbox();
      setSuccessMsg(`Notification Outbox processed: ${res.processed ?? 0} items dispatched.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process notification outbox');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRunner = async (enabled) => {
    if (isReadOnly) return;
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.toggleSchedulerRunner(enabled);
      setSuccessMsg(`Automated scheduler runner ${enabled ? 'started' : 'paused'} successfully.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to toggle scheduler runner');
    } finally {
      setActionLoading(false);
    }
  };

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
    if (!newAccountForm.customer_id.trim()) {
      setErrorMsg('Customer ID / code is required to establish billing account.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        customer_id: newAccountForm.customer_id.trim(),
        billing_type: newAccountForm.account_type,
        account_type: newAccountForm.account_type,
        credit_limit: parseFloat(newAccountForm.credit_limit) || 0.0,
        currency: newAccountForm.currency || 'INR',
        market_id: currentMarket === 'all' ? undefined : currentMarket
      };
      const res = await api.createBillingAccount(payload);
      setSuccessMsg(`Billing Account ${res.account_code || res.account_number} created successfully.`);
      setShowCreateAccountModal(false);
      loadData(true);
    } catch (err) {
      console.error('Account creation failed:', err);
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrorMsg(`Validation error: ${Object.entries(err.fieldErrors).map(([k, v]) => `${k} (${v})`).join(', ')}`);
      } else {
        setErrorMsg(err.message || 'Failed to create billing account');
      }
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
    if (!issueInvoiceForm.subscription_id.trim()) {
      setErrorMsg('Subscription ID / code is required to issue invoice.');
      return;
    }
    if (parseFloat(issueInvoiceForm.discount_amount) < 0) {
      setErrorMsg('Authorized discount cannot be negative.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        subscription_id: issueInvoiceForm.subscription_id.trim(),
        discount_amount: parseFloat(issueInvoiceForm.discount_amount) || 0.0,
        notes: issueInvoiceForm.notes?.trim() || undefined
      };
      const res = await api.issueInvoice(payload);
      setSuccessMsg(`Invoice ${res.invoice_code} generated for ₹${Number(res.total_amount).toLocaleString()}.`);
      setShowIssueInvoiceModal(false);
      loadData(true);
    } catch (err) {
      console.error('Invoice issuance failed:', err);
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrorMsg(`Validation error: ${Object.entries(err.fieldErrors).map(([k, v]) => `${k} (${v})`).join(', ')}`);
      } else {
        setErrorMsg(err.message || 'Failed to generate invoice');
      }
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

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      const payload = {
        ...newCampaignForm,
        discount_amount: parseFloat(newCampaignForm.discount_amount) || 0,
        discount_percent: parseFloat(newCampaignForm.discount_percent) || 0,
        max_discount_cap: newCampaignForm.max_discount_cap ? parseFloat(newCampaignForm.max_discount_cap) : null,
        min_invoice_amount: parseFloat(newCampaignForm.min_invoice_amount) || 0,
        max_redemptions: parseInt(newCampaignForm.max_redemptions, 10) || 1,
        per_customer_limit: parseInt(newCampaignForm.per_customer_limit, 10) || 1,
        valid_until: newCampaignForm.valid_until ? new Date(newCampaignForm.valid_until).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString(),
        status: 'ACTIVE'
      };
      const res = await api.createVoucher(payload);
      setSuccessMsg(`Voucher campaign '${res.voucher_code}' created successfully.`);
      setShowCreateCampaignModal(false);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkCreateCampaign = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      const payload = {
        ...bulkCampaignForm,
        count: parseInt(bulkCampaignForm.count, 10) || 5,
        discount_amount: parseFloat(bulkCampaignForm.discount_amount) || 0,
        discount_percent: parseFloat(bulkCampaignForm.discount_percent) || 0,
        max_discount_cap: bulkCampaignForm.max_discount_cap ? parseFloat(bulkCampaignForm.max_discount_cap) : null,
        min_invoice_amount: parseFloat(bulkCampaignForm.min_invoice_amount) || 0,
        max_redemptions: parseInt(bulkCampaignForm.max_redemptions, 10) || 1,
        per_customer_limit: parseInt(bulkCampaignForm.per_customer_limit, 10) || 1,
        valid_until: bulkCampaignForm.valid_until ? new Date(bulkCampaignForm.valid_until).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString()
      };
      const res = await api.bulkCreateVouchers(payload);
      setSuccessMsg(`Generated ${res.length} unique vouchers with prefix '${payload.prefix}'.`);
      setShowBulkCampaignModal(false);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to bulk generate vouchers');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVoucherStatus = async (id, currentStatus) => {
    if (isReadOnly) return;
    setActionLoading(true);
    try {
      if (currentStatus === 'ACTIVE') {
        await api.pauseVoucher(id);
        setSuccessMsg('Voucher campaign paused.');
      } else {
        await api.activateVoucher(id);
        setSuccessMsg('Voucher campaign activated.');
      }
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update voucher status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeVoucher = async (id, code) => {
    if (isReadOnly) return;
    if (!window.confirm(`Revoke voucher '${code}' permanently?`)) return;
    setActionLoading(true);
    try {
      await api.revokeVoucher(id);
      setSuccessMsg(`Voucher '${code}' revoked.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to revoke voucher');
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
          { id: 'vouchers', label: 'Vouchers & Retention', icon: Tag },
          { id: 'scheduler', label: 'Scheduler & Operations', icon: Clock }
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
          {/* Section 1: Campaign Definitions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <span>Voucher Campaigns & Rules ({voucherCampaigns.length})</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Authoritative campaign policies, quota limits, discount rules (fixed / percentage with caps), and lifecycle statuses.
              </p>
            </div>
            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkCampaignModal(true)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bulk Generate</span>
                </button>
                <button
                  onClick={() => setShowCreateCampaignModal(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Campaign</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden card-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Voucher Code / Campaign</th>
                    <th className="p-3.5">Benefit Type</th>
                    <th className="p-3.5">Discount Rate</th>
                    <th className="p-3.5">Redemption Quota</th>
                    <th className="p-3.5">Per-Customer Cap</th>
                    <th className="p-3.5">Valid Until</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {voucherCampaigns.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-indigo-700">{v.voucher_code}</div>
                        <div className="text-[11px] text-gray-500">{v.campaign_name}</div>
                      </td>
                      <td className="p-3.5 font-bold text-gray-800">
                        {v.voucher_type}
                      </td>
                      <td className="p-3.5 font-medium text-gray-900">
                        {v.voucher_type === 'PERCENT_DISCOUNT' ? (
                          <span>{v.discount_percent}% (Cap: &#8377;{v.max_discount_cap || 'None'})</span>
                        ) : v.voucher_type === 'BILL_DISCOUNT' ? (
                          <span>&#8377;{Number(v.discount_amount).toLocaleString()}</span>
                        ) : (
                          <span>Service Benefit</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-700">{v.current_redemptions} / {v.max_redemptions}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100, (v.current_redemptions / v.max_redemptions) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-600">{v.per_customer_limit} max</td>
                      <td className="p-3.5 text-gray-500 font-mono">
                        {v.valid_until ? new Date(v.valid_until).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : v.status === 'PAUSED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {!isReadOnly && v.status !== 'REVOKED' && (
                          <>
                            <button
                              onClick={() => handleToggleVoucherStatus(v.id, v.status)}
                              className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                            >
                              {v.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleRevokeVoucher(v.id, v.voucher_code)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {voucherCampaigns.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">No voucher campaign definitions configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Redemptions History */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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

      {/* ─── TAB 7: BACKGROUND SCHEDULER & OPERATIONS CONSOLE ─── */}
      {activeTab === 'scheduler' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Activity className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold tracking-tight">Background Scheduling &amp; Job Operations Console</h3>

                {schedulerOverview?.runner ? (
                  schedulerOverview.runner.enabled && schedulerOverview.runner.is_running ? (
                    schedulerOverview.runner.is_leader ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        RUNNER ACTIVE (LEADER)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        RUNNER STANDBY (REPLICA)
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                      RUNNER PAUSED
                    </span>
                  )
                ) : null}

                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  TZ: {schedulerOverview?.runner?.timezone || 'UTC'}
                </span>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Redis Distributed Locks
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Authoritative automated runner and monitoring for billing cycles, overdue dunning escalation, and durable notification outbox delivery.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {schedulerOverview?.runner && (
                <button
                  onClick={() => handleToggleRunner(!schedulerOverview.runner.enabled)}
                  disabled={isReadOnly || actionLoading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border cursor-pointer disabled:opacity-50 transition-all ${
                    schedulerOverview.runner.enabled
                      ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-700/50'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
                  }`}
                >
                  {schedulerOverview.runner.enabled ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Runner</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume Runner</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => loadData(true)}
                disabled={refreshing || actionLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>
            </div>
          </div>

          {/* Operational KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[11px] font-medium text-gray-500">Total Executions</div>
              <div className="text-xl font-bold text-gray-900 mt-1 font-mono">
                {schedulerOverview?.total_runs ?? billingJobRuns.length}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Durable execution runs</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[11px] font-medium text-gray-500">Success Rate</div>
              <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {schedulerOverview?.total_runs
                  ? `${Math.round(((schedulerOverview.successful_runs || 0) / schedulerOverview.total_runs) * 100)}%`
                  : '100%'}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">
                {schedulerOverview?.successful_runs ?? 0} completed runs
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[11px] font-medium text-gray-500">Active Distributed Locks</div>
              <div className="flex items-center gap-1.5 mt-1">
                {(schedulerOverview?.active_locks || 0) > 0 ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-xl font-bold text-amber-600 font-mono">
                      {schedulerOverview?.active_locks} Active
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xl font-bold text-emerald-600 font-mono">0 Idle</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Fail-closed concurrency protection</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[11px] font-medium text-gray-500">Failed / Stalled</div>
              <div className={`text-xl font-bold mt-1 font-mono ${(schedulerOverview?.failed_runs || 0) > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                {schedulerOverview?.failed_runs ?? 0}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Requires operator review</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[11px] font-medium text-gray-500">Outbox Pending</div>
              <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
                {schedulerOverview?.outbox_queued ?? 0}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {schedulerOverview?.outbox_sent ?? 0} dispatched successfully
              </div>
            </div>
          </div>

          {/* Section 1: Allowlisted Background Schedulers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Allowlisted Scheduled Jobs</h4>
                <p className="text-[11px] text-gray-500">Authoritative automated jobs with distributed concurrency locks and durable audit trails.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(scheduledJobs.length > 0 ? scheduledJobs : [
                {
                  job_type: 'RECURRING_BILLING',
                  name: 'Recurring Billing Cycle',
                  description: 'Evaluates active subscriptions across market tenants, generates monthly cycle invoices with GST breakdown, and tracks accounts receivable.',
                  cadence: 'Daily at 00:00 UTC (1st & 15th for monthly cycles)',
                  is_locked: false
                },
                {
                  job_type: 'OVERDUE_DUNNING',
                  name: 'Overdue Dunning & Aging Evaluation',
                  description: 'Evaluates unpaid past-due invoices, calculates aging brackets (1-30, 31-60, 61-90, 90+ days), and enqueues overdue reminders to Notification Outbox.',
                  cadence: 'Daily at 06:00 UTC',
                  is_locked: false
                },
                {
                  job_type: 'OUTBOX_DISPATCH',
                  name: 'Notification Outbox Dispatcher',
                  description: 'Processes pending outbox items and dispatches SMS/Email/WhatsApp alerts with exponential backoff and carrier delivery receipts.',
                  cadence: 'Every 5 minutes',
                  is_locked: false
                }
              ]).map((job) => (
                <div key={job.job_type} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {job.job_type}
                      </span>
                      {job.is_locked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3 text-amber-600 animate-pulse" />
                          <span>LOCKED</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>IDLE</span>
                        </span>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">{job.name}</h5>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{job.description}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>Cadence:</span>
                      </span>
                      <span className="font-semibold text-gray-700 text-[10px]">{job.cadence}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-500" />
                        <span>Next Run:</span>
                      </span>
                      <span className="font-semibold font-mono text-indigo-700 text-[10px]">
                        {job.next_run_estimated ? new Date(job.next_run_estimated).toLocaleString() : 'Automated'}
                      </span>
                    </div>
                    {job.last_run && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1 text-[10px]">
                        <div className="flex justify-between items-center text-gray-500">
                          <span>Last Run:</span>
                          <span className={`font-bold px-1.5 py-0.2 rounded ${
                            job.last_run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            job.last_run.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {job.last_run.status}
                          </span>
                        </div>
                        <div className="text-gray-400 font-mono">
                          {job.last_run.finish_time ? new Date(job.last_run.finish_time).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTargetJobType(job.job_type);
                        setTargetJobMarket(currentMarket);
                        setShowTriggerJobModal(true);
                      }}
                      disabled={isReadOnly || actionLoading || job.is_locked}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Execute Job Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Durable Job Execution History */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Durable Job Execution History</h4>
                <p className="text-[11px] text-gray-500">Immutable ledger of automated and operator-triggered billing job executions.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={jobRunFilterType}
                  onChange={(e) => setJobRunFilterType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Job Types</option>
                  <option value="RECURRING_BILLING">RECURRING_BILLING</option>
                  <option value="OVERDUE_DUNNING">OVERDUE_DUNNING</option>
                  <option value="OUTBOX_DISPATCH">OUTBOX_DISPATCH</option>
                </select>

                <select
                  value={jobRunFilterStatus}
                  onChange={(e) => setJobRunFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="RUNNING">RUNNING</option>
                  <option value="FAILED">FAILED</option>
                  <option value="SKIPPED">SKIPPED</option>
                  <option value="RECONCILED">RECONCILED</option>
                  <option value="RETRIED">RETRIED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-4">Job Run ID &amp; Type</th>
                    <th className="py-2.5 px-3">Market</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Start &amp; Duration</th>
                    <th className="py-2.5 px-3 text-right">Records Succeeded / Proc.</th>
                    <th className="py-2.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {billingJobRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-gray-900 font-bold text-xs">{run.job_type}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {run.id.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-600 uppercase">
                        {run.market_id || 'ALL MARKETS'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          run.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          run.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          run.status === 'RUNNING' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                          run.status === 'RECONCILED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          run.status === 'SKIPPED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        <div>{new Date(run.start_time).toLocaleString()}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {run.duration_seconds !== null ? `${run.duration_seconds}s` : 'Running...'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-bold text-gray-900">{run.records_succeeded}</span>
                        <span className="text-gray-400"> / {run.records_processed}</span>
                        {run.records_failed > 0 && (
                          <div className="text-[10px] text-rose-600 font-bold">
                            {run.records_failed} failed
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedRunDetail(run);
                            setShowRunDetailModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-all"
                        >
                          Inspect / Reconcile
                        </button>
                      </td>
                    </tr>
                  ))}
                  {billingJobRuns.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400">
                        No background billing job execution runs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {jobRunTotal > 10 && (
              <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Total Runs: {jobRunTotal}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={jobRunPage <= 1}
                    onClick={() => setJobRunPage(jobRunPage - 1)}
                    className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="font-mono text-gray-700">Page {jobRunPage}</span>
                  <button
                    disabled={jobRunPage * 10 >= jobRunTotal}
                    onClick={() => setJobRunPage(jobRunPage + 1)}
                    className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Durable Notification Outbox Queue */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Transactional Notification Outbox</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    PII &amp; OTP Redacted
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">Decoupled notification dispatch queue with idempotency keys and exponential backoff.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={notifChannelFilter}
                  onChange={(e) => setNotifChannelFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Channels</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="WHATSAPP">WHATSAPP</option>
                </select>

                <select
                  value={notifStatusFilter}
                  onChange={(e) => setNotifStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Delivery Statuses</option>
                  <option value="QUEUED">QUEUED</option>
                  <option value="SENT">SENT</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="RETRYING">RETRYING</option>
                </select>

                <button
                  onClick={handleProcessOutboxNow}
                  disabled={isReadOnly || actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Pending Outbox</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-4">Channel &amp; Recipient</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Message (Sanitized)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Attempts</th>
                    <th className="py-2.5 px-3">Gateway Mode</th>
                    <th className="py-2.5 px-4">Created / Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notificationOutbox.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {item.channel === 'SMS' ? <Smartphone className="w-3.5 h-3.5 text-blue-600" /> :
                           item.channel === 'EMAIL' ? <Mail className="w-3.5 h-3.5 text-indigo-600" /> :
                           <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                          <span className="font-mono font-bold text-gray-900">{item.recipient_masked}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">Key: {item.idempotency_key?.slice(0, 16)}...</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-gray-700 text-[11px] truncate" title={item.message_preview}>
                        {item.message_preview}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'SENT' || item.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.status === 'QUEUED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          item.status === 'RETRYING' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.status}
                        </span>
                        {item.last_error_sanitized && (
                          <div className="text-[10px] text-rose-600 mt-0.5 truncate max-w-xs" title={item.last_error_sanitized}>
                            {item.last_error_sanitized}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        {item.attempt_count} / {item.max_attempts}
                      </td>
                      <td className="py-3 px-3">
                        {item.is_simulated ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            SIMULATED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            LIVE CARRIER
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        <div>{new Date(item.created_at).toLocaleString()}</div>
                        {item.sent_at && (
                          <div className="text-[10px] text-emerald-600 font-mono">
                            Sent: {new Date(item.sent_at).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {notificationOutbox.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        No notification outbox items recorded for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Outbox Pagination Controls */}
            {notifTotal > 10 && (
              <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Total Notifications: {notifTotal}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={notifPage <= 1}
                    onClick={() => setNotifPage(notifPage - 1)}
                    className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="font-mono text-gray-700">Page {notifPage}</span>
                  <button
                    disabled={notifPage * 10 >= notifTotal}
                    onClick={() => setNotifPage(notifPage + 1)}
                    className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
      {/* ─── MODAL: CREATE VOUCHER CAMPAIGN ─── */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>Create Voucher Campaign</span>
              </h3>
              <button onClick={() => setShowCreateCampaignModal(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleCreateCampaign} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME100"
                    value={newCampaignForm.voucher_code}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, voucher_code: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Welcome Concession"
                    value={newCampaignForm.campaign_name}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, campaign_name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Benefit Type</label>
                  <select
                    value={newCampaignForm.voucher_type}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, voucher_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="BILL_DISCOUNT">Bill Discount (Fixed &#8377;)</option>
                    <option value="PERCENT_DISCOUNT">Percentage Discount (%)</option>
                    <option value="SPEED_BOOST">Speed Boost (+50M)</option>
                    <option value="DATA_TOPUP">Data Topup (+5G)</option>
                    <option value="OTT_PASS">OTT Pass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Market Scope</label>
                  <select
                    value={newCampaignForm.market_id}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, market_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="ALL">ALL Markets</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="kolkata">Kolkata</option>
                  </select>
                </div>
              </div>

              {newCampaignForm.voucher_type === 'BILL_DISCOUNT' ? (
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Discount Amount (&#8377;)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newCampaignForm.discount_amount}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, discount_amount: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              ) : newCampaignForm.voucher_type === 'PERCENT_DISCOUNT' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Discount Percent (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 20"
                      value={newCampaignForm.discount_percent}
                      onChange={(e) => setNewCampaignForm({ ...newCampaignForm, discount_percent: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Max Cap (&#8377;) (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 300"
                      value={newCampaignForm.max_discount_cap}
                      onChange={(e) => setNewCampaignForm({ ...newCampaignForm, max_discount_cap: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Total Global Quota</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCampaignForm.max_redemptions}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, max_redemptions: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Per-Customer Limit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCampaignForm.per_customer_limit}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, per_customer_limit: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Valid Until (Expiration Date)</label>
                <input
                  type="date"
                  value={newCampaignForm.valid_until}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, valid_until: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: BULK GENERATE VOUCHERS ─── */}
      {showBulkCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>Bulk Generate Unique Vouchers</span>
              </h3>
              <button onClick={() => setShowBulkCampaignModal(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <form onSubmit={handleBulkCreateCampaign} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Code Prefix *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH"
                    value={bulkCampaignForm.prefix}
                    onChange={(e) => setBulkCampaignForm({ ...bulkCampaignForm, prefix: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Quantity (1-500) *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={bulkCampaignForm.count}
                    onChange={(e) => setBulkCampaignForm({ ...bulkCampaignForm, count: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Sale Batch 1"
                  value={bulkCampaignForm.campaign_name}
                  onChange={(e) => setBulkCampaignForm({ ...bulkCampaignForm, campaign_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Discount Amount (&#8377;)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bulkCampaignForm.discount_amount}
                    onChange={(e) => setBulkCampaignForm({ ...bulkCampaignForm, discount_amount: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Market</label>
                  <select
                    value={bulkCampaignForm.market_id}
                    onChange={(e) => setBulkCampaignForm({ ...bulkCampaignForm, market_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="ALL">ALL</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="kolkata">Kolkata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Valid Until (Expiration Date)</label>
                <input
                  type="date"
                  value={bulkCampaignForm.valid_until}
                  onChange={(e) => setBulkCampaignForm({ ...bulkCampaignForm, valid_until: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkCampaignModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Generate Vouchers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: TRIGGER ALLOWLISTED SCHEDULER JOB ─── */}
      {showTriggerJobModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Execute Background Job</h3>
              </div>
              <button
                onClick={() => setShowTriggerJobModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleTriggerJobSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                <strong>Distributed Lock Guarantee:</strong> This job executes under a temporary distributed lock (TTL 900s). Concurrent runs on the same job and market tenant are rejected with HTTP 409 Conflict.
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Allowlisted Job Type</label>
                <select
                  value={targetJobType}
                  onChange={(e) => setTargetJobType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white font-mono"
                >
                  <option value="RECURRING_BILLING">RECURRING_BILLING (Billing Cycle &amp; Invoices)</option>
                  <option value="OVERDUE_DUNNING">OVERDUE_DUNNING (Aging &amp; Dunning Escalation)</option>
                  <option value="OUTBOX_DISPATCH">OUTBOX_DISPATCH (Transactional Notification Outbox)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Target Market Scope</label>
                <select
                  value={targetJobMarket}
                  onChange={(e) => setTargetJobMarket(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="all">All Markets (Global Tenant Scope)</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="kolkata">Kolkata</option>
                  <option value="delhi">Delhi</option>
                  <option value="bangalore">Bangalore</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTriggerJobModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  <span>{actionLoading ? 'Executing...' : 'Execute Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: JOB EXECUTION DETAIL & RECONCILIATION ─── */}
      {showRunDetailModal && selectedRunDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden modal-shadow">
            <div className="bg-slate-50 border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Job Execution Run Details</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedRunDetail.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                  selectedRunDetail.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                  selectedRunDetail.status === 'RECONCILED' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-slate-200 text-slate-800'
                }`}>
                  {selectedRunDetail.status}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowRunDetailModal(false);
                  setSelectedRunDetail(null);
                }}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="text-gray-400 text-[10px]">Job Type</div>
                  <div className="font-mono font-bold text-gray-900 mt-0.5">{selectedRunDetail.job_type}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px]">Target Market</div>
                  <div className="font-mono font-bold text-gray-900 mt-0.5 uppercase">{selectedRunDetail.market_id || 'ALL'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px]">Start Time</div>
                  <div className="text-gray-700 mt-0.5">{new Date(selectedRunDetail.start_time).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px]">Duration</div>
                  <div className="font-mono font-bold text-gray-900 mt-0.5">
                    {selectedRunDetail.duration_seconds !== null ? `${selectedRunDetail.duration_seconds} seconds` : 'In progress...'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px]">Processed / Succeeded</div>
                  <div className="font-mono font-bold text-gray-900 mt-0.5">
                    {selectedRunDetail.records_succeeded} / {selectedRunDetail.records_processed}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px]">Attempt Count</div>
                  <div className="font-mono font-bold text-gray-900 mt-0.5">{selectedRunDetail.attempt_count}</div>
                </div>
              </div>

              {/* Error Details if FAILED */}
              {selectedRunDetail.error_details && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Failure Diagnostic (Sanitized)</span>
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap break-all text-rose-800 bg-rose-100/50 p-2 rounded">
                    {selectedRunDetail.error_details}
                  </pre>
                </div>
              )}

              {/* Execution Metrics & Metadata JSON */}
              <div>
                <div className="text-gray-500 font-bold mb-1 uppercase text-[10px] tracking-wider">Execution Metrics &amp; Metadata</div>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedRunDetail.summary_metadata || {}, null, 2)}
                </pre>
              </div>

              {/* Safe Operator Reconciliation Form (for FAILED or RUNNING runs) */}
              {(selectedRunDetail.status === 'FAILED' || selectedRunDetail.status === 'RUNNING') && !isReadOnly && (
                <div className="pt-3 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Safe Operator Recovery &amp; Reconciliation</span>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-[11px] mb-1">Intervention Reason / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Cleared stuck worker lock after network restart"
                      value={reconcileReason}
                      onChange={(e) => setReconcileReason(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReconcileRunAction(selectedRunDetail.id, 'RECONCILE')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Reconcile &amp; Clear Lock
                    </button>
                    <button
                      onClick={() => handleReconcileRunAction(selectedRunDetail.id, 'RETRY')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Safe Idempotent Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default FinanceManagement;
