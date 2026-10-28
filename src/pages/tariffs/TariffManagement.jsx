import React, { useState, useEffect } from 'react';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Calculator,
  Calendar,
  Layers,
  DollarSign,
  Percent,
  X,
  FileText,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export const TariffManagement = () => {
  const { currentMarket } = useMarket();
  const { user } = useAuth();
  const canManageTariffs = ['Admin', 'Super Admin', 'Billing', 'Revenue'].includes(user?.role);
  const isSuperAdmin = ['Super Admin', 'SUPER_ADMIN'].includes(user?.role);

  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [freqFilter, setFreqFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    tariff_code: '',
    name: '',
    description: '',
    service_plan_code: '',
    market_id: isSuperAdmin ? 'ALL' : (currentMarket || 'mumbai'),
    version: 1,
    billing_type: 'POSTPAID',
    billing_frequency: 'MONTHLY',
    billing_timing: 'IN_ADVANCE',
    currency: 'INR',
    base_recurring_charge: '',
    setup_fee: '0',
    usage_rate_per_gb: '0',
    tax_rate_percent: '18.00',
    discount_percentage: '0.00',
    effective_from: '',
    effective_to: '',
    status: 'ACTIVE'
  });

  // Calculator states
  const [calcUsageGb, setCalcUsageGb] = useState('0');
  const [calcApplySetup, setCalcApplySetup] = useState(false);
  const [calcVoucherCode, setCalcVoucherCode] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = {};
      if (typeFilter) params.billing_type = typeFilter;
      if (freqFilter) params.billing_frequency = freqFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await api.getTariffs(params);
      setTariffs(data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load tariff plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTariffs();
  }, [typeFilter, freqFilter, statusFilter, currentMarket]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTariffs();
  };

  const handleCreateTariff = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setErrorMsg('');
      const payload = {
        ...formData,
        version: parseInt(formData.version, 10) || 1,
        base_recurring_charge: parseFloat(formData.base_recurring_charge) || 0,
        setup_fee: parseFloat(formData.setup_fee) || 0,
        usage_rate_per_gb: parseFloat(formData.usage_rate_per_gb) || 0,
        tax_rate_percent: parseFloat(formData.tax_rate_percent) || 18,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        effective_from: formData.effective_from ? new Date(formData.effective_from).toISOString() : new Date().toISOString(),
        effective_to: formData.effective_to ? new Date(formData.effective_to).toISOString() : null
      };
      await api.createTariff(payload);
      setSuccessMsg(`Tariff '${payload.tariff_code}' created successfully.`);
      setShowCreateModal(false);
      fetchTariffs();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create tariff plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (id, code) => {
    if (!window.confirm(`Are you sure you want to deactivate tariff plan '${code}'?`)) return;
    try {
      setActionLoading(true);
      await api.deactivateTariff(id);
      setSuccessMsg(`Tariff '${code}' deactivated successfully.`);
      fetchTariffs();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to deactivate tariff plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedTariffs = async () => {
    try {
      setActionLoading(true);
      const res = await api.seedTariffs();
      setSuccessMsg(`Standard tariffs seeded successfully (${res.seeded_tariffs_count || 0} added).`);
      fetchTariffs();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to seed standard tariffs');
    } finally {
      setActionLoading(false);
    }
  };

  const openCalculator = (tariff) => {
    setSelectedTariff(tariff);
    setCalcUsageGb('0');
    setCalcApplySetup(false);
    setCalcVoucherCode('');
    setCalcResult(null);
    setShowCalcModal(true);
  };

  const runCalculation = async () => {
    if (!selectedTariff) return;
    try {
      setCalcLoading(true);
      const res = await api.calculateTariffCharges({
        tariff_code: selectedTariff.tariff_code,
        usage_gb: parseFloat(calcUsageGb) || 0,
        apply_setup_fee: calcApplySetup,
        voucher_code: calcVoucherCode ? calcVoucherCode.trim() : null
      });
      setCalcResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Calculation failed');
    } finally {
      setCalcLoading(false);
    }
  };

  // Filtered tariffs
  const filteredTariffs = tariffs.filter((t) => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      t.tariff_code?.toLowerCase().includes(s) ||
      t.name?.toLowerCase().includes(s) ||
      t.service_plan_code?.toLowerCase().includes(s);
    return matchSearch;
  });

  // Metrics
  const activeCount = tariffs.filter((t) => t.status === 'ACTIVE').length;
  const prepaidCount = tariffs.filter((t) => t.billing_type === 'PREPAID').length;
  const postpaidCount = tariffs.filter((t) => t.billing_type === 'POSTPAID').length;
  const avgRecurring = tariffs.length > 0
    ? (tariffs.reduce((acc, t) => acc + (parseFloat(t.base_recurring_charge) || 0), 0) / tariffs.length).toFixed(0)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Financial & Billing Controls', path: '/finance' },
          { label: 'Tariff Plans & Dynamic Pricing', path: '/tariffs' }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-7 h-7 text-indigo-600" />
            Tariff Plans & Pricing Rules
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative telecom charging structures, recurring rates, setup fees, 18% GST tax configuration, and versioning.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition"
            title="Refresh tariffs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {isSuperAdmin && (
            <button
              onClick={handleSeedTariffs}
              disabled={actionLoading}
              className="px-3 py-2 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium transition"
            >
              Seed Standard Tariffs
            </button>
          )}
          {canManageTariffs && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Create Tariff
            </button>
          )}
        </div>
      </div>

      {/* Feedback alerts */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Active Tariffs</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{activeCount}</div>
          <p className="text-xs text-gray-500 mt-1">Currently effective in market catalog</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Prepaid Plans</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{prepaidCount}</div>
          <p className="text-xs text-gray-500 mt-1">In-advance recharge tariffs</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Postpaid Plans</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{postpaidCount}</div>
          <p className="text-xs text-gray-500 mt-1">Monthly cycle & enterprise ILL</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Avg Recurring Rate</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">₹{avgRecurring}</div>
          <p className="text-xs text-gray-500 mt-1">Base monthly charge average</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tariff or plan code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700"
          >
            <option value="">All Billing Types</option>
            <option value="PREPAID">Prepaid</option>
            <option value="POSTPAID">Postpaid</option>
          </select>

          <select
            value={freqFilter}
            onChange={(e) => setFreqFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700"
          >
            <option value="">All Frequencies</option>
            <option value="28_DAYS">28 Days</option>
            <option value="56_DAYS">56 Days</option>
            <option value="84_DAYS">84 Days</option>
            <option value="MONTHLY">Monthly</option>
            <option value="365_DAYS">Annual (365d)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Tariff List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading tariff plans...</span>
          </div>
        ) : filteredTariffs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <Tag className="w-8 h-8 text-gray-300" />
            <span className="font-medium text-gray-700">No tariff plans found</span>
            <p className="text-xs text-gray-400">Click 'Seed Standard Tariffs' or 'Create Tariff' to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="py-3 px-4">Tariff Code / Name</th>
                  <th className="py-3 px-4">Service Plan</th>
                  <th className="py-3 px-4">Type & Frequency</th>
                  <th className="py-3 px-4 text-right">Recurring (₹)</th>
                  <th className="py-3 px-4 text-right">Setup Fee</th>
                  <th className="py-3 px-4 text-center">GST Rate</th>
                  <th className="py-3 px-4">Effective Dates</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTariffs.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/75 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{t.tariff_code}</div>
                      <div className="text-xs text-gray-500">{t.name} (v{t.version})</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-700 bg-indigo-50/50 rounded inline-block my-3 px-2 py-0.5">
                      {t.service_plan_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                        t.billing_type === 'PREPAID' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {t.billing_type}
                      </span>
                      <div className="text-xs text-gray-500 mt-0.5">{t.billing_frequency} • {t.billing_timing}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                      ₹{parseFloat(t.base_recurring_charge).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-600">
                      ₹{parseFloat(t.setup_fee).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-gray-700">
                      {parseFloat(t.tax_rate_percent).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      <div>From: {t.effective_from ? new Date(t.effective_from).toLocaleDateString() : 'N/A'}</div>
                      <div>To: {t.effective_to ? new Date(t.effective_to).toLocaleDateString() : 'Indefinite'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'INACTIVE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openCalculator(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition"
                        title="Calculate charge breakdown"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        Breakdown
                      </button>
                      {t.status === 'ACTIVE' && canManageTariffs && (
                        <button
                          onClick={() => handleDeactivate(t.id, t.tariff_code)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Tariff */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                Create New Tariff Plan
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTariff} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tariff Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRF-PRE-TURBO-100M-V2"
                    value={formData.tariff_code}
                    onChange={(e) => setFormData({ ...formData, tariff_code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tariff Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Turbo 100M Summer Tier"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Service Plan Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PLAN-PRE-SUPER-5G"
                    value={formData.service_plan_code}
                    onChange={(e) => setFormData({ ...formData, service_plan_code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Market Scope</label>
                  <select
                    value={formData.market_id}
                    onChange={(e) => setFormData({ ...formData, market_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {isSuperAdmin && <option value="ALL">ALL Markets (Global Platform)</option>}
                    <option value="mumbai">Mumbai</option>
                    <option value="kolkata">Kolkata</option>
                    <option value="delhi">Delhi</option>
                    <option value="bangalore">Bangalore</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Billing Type</label>
                  <select
                    value={formData.billing_type}
                    onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="POSTPAID">Postpaid</option>
                    <option value="PREPAID">Prepaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Billing Frequency</label>
                  <select
                    value={formData.billing_frequency}
                    onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="28_DAYS">28 Days</option>
                    <option value="56_DAYS">56 Days</option>
                    <option value="84_DAYS">84 Days</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="365_DAYS">Annual (365d)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Billing Timing</label>
                  <select
                    value={formData.billing_timing}
                    onChange={(e) => setFormData({ ...formData, billing_timing: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="IN_ADVANCE">In Advance</option>
                    <option value="IN_ARREARS">In Arrears</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Base Recurring (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="699.00"
                    value={formData.base_recurring_charge}
                    onChange={(e) => setFormData({ ...formData, base_recurring_charge: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Setup Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="500.00"
                    value={formData.setup_fee}
                    onChange={(e) => setFormData({ ...formData, setup_fee: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax_rate_percent}
                    onChange={(e) => setFormData({ ...formData, tax_rate_percent: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Effective From</label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
                >
                  {actionLoading ? 'Creating...' : 'Create Tariff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Price Breakdown Calculator */}
      {showCalcModal && selectedTariff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Price Breakdown: {selectedTariff.tariff_code}
              </h2>
              <button onClick={() => setShowCalcModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                <div className="text-gray-700"><strong>Plan:</strong> {selectedTariff.service_plan_code}</div>
                <div className="text-gray-700"><strong>Base Recurring:</strong> ₹{parseFloat(selectedTariff.base_recurring_charge).toFixed(2)}</div>
                <div className="text-gray-700"><strong>Setup Fee Rate:</strong> ₹{parseFloat(selectedTariff.setup_fee).toFixed(2)}</div>
                <div className="text-gray-700"><strong>Usage Overage:</strong> ₹{parseFloat(selectedTariff.usage_rate_per_gb).toFixed(2)} / GB</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Billable Usage (GB)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={calcUsageGb}
                    onChange={(e) => setCalcUsageGb(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Coupon / Voucher Code</label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME100"
                    value={calcVoucherCode}
                    onChange={(e) => setCalcVoucherCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkSetup"
                  checked={calcApplySetup}
                  onChange={(e) => setCalcApplySetup(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="chkSetup" className="text-xs text-gray-700 select-none">
                  Include initial one-time installation / setup fee
                </label>
              </div>

              <button
                onClick={runCalculation}
                disabled={calcLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
              >
                {calcLoading ? 'Calculating...' : 'Compute Financial Breakdown'}
              </button>

              {calcResult && (
                <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-gray-700">
                    <span>Base Recurring Charge:</span>
                    <span className="font-mono font-medium">₹{parseFloat(calcResult.base_recurring_charge).toFixed(2)}</span>
                  </div>
                  {calcApplySetup && (
                    <div className="flex justify-between text-gray-700">
                      <span>Setup Fee:</span>
                      <span className="font-mono font-medium">₹{parseFloat(calcResult.setup_fee).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(calcResult.usage_charge) > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Usage Charges ({calcResult.usage_gb} GB):</span>
                      <span className="font-mono font-medium">₹{parseFloat(calcResult.usage_charge).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-800 font-semibold border-t border-indigo-100 pt-1.5">
                    <span>Gross Subtotal:</span>
                    <span className="font-mono">₹{parseFloat(calcResult.gross_subtotal).toFixed(2)}</span>
                  </div>
                  {parseFloat(calcResult.plan_discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Plan Discount:</span>
                      <span className="font-mono">-₹{parseFloat(calcResult.plan_discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(calcResult.voucher_discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Voucher Discount:</span>
                      <span className="font-mono">-₹{parseFloat(calcResult.voucher_discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Taxable Net Amount:</span>
                    <span className="font-mono font-medium">₹{parseFloat(calcResult.taxable_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>GST ({parseFloat(calcResult.tax_rate_percent).toFixed(0)}%):</span>
                    <span className="font-mono font-medium">₹{parseFloat(calcResult.tax_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-900 font-bold text-sm border-t border-indigo-200 pt-2">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono">₹{parseFloat(calcResult.total_amount_payable).toFixed(2)}</span>
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

export default TariffManagement;
