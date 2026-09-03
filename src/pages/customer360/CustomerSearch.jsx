import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  Search, 
  ExternalLink, 
  Users, 
  Smartphone, 
  CreditCard, 
  AlertTriangle, 
  Info, 
  Zap,
  Clock,
  Database
} from 'lucide-react';

export const CustomerSearch = () => {
  const outletCtx = useOutletContext();
  const onOpen360 = outletCtx?.onOpen360;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const paramType = searchParams.get('customer_type') || '';
  const paramStatus = searchParams.get('status') || '';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locality, setLocality] = useState('');
  const [segment, setSegment] = useState('');
  const [customerType, setCustomerType] = useState(paramType);
  const [statusFilter, setStatusFilter] = useState(paramStatus);

  // Sync state when URL params change
  useEffect(() => {
    setCustomerType(searchParams.get('customer_type') || '');
    setStatusFilter(searchParams.get('status') || '');
  }, [searchParams]);

  const loadData = () => {
    setLoading(true);
    api.getCustomers(searchTerm, locality, segment, customerType, statusFilter)
      .then((data) => setCustomers(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [locality, segment, customerType, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleTabSelect = (type, status = '') => {
    setCustomerType(type);
    setStatusFilter(status);
    const params = new URLSearchParams();
    if (type) params.set('customer_type', type);
    if (status) params.set('status', status);
    setSearchParams(params);
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumbs for Smooth Back-Navigation */}
      <Breadcrumbs 
        items={[
          { label: 'Subscribers & 360', icon: Users },
          ...(customerType ? [{ label: `${customerType} Subscribers` }] : []),
          ...(statusFilter ? [{ label: `Status: ${statusFilter}` }] : [])
        ]} 
        backTo="/cockpit"
        backLabel="Executive Cockpit"
      />

      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 card-shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Integration &amp; Customer 360 Layer</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">
              Subscriber Directory &amp; ARPU Profile Explorer
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-3xl">
              Dataset represents ~70% Indian Telecom Prepaid subscribers (UPI recharges, 28/56/84d validity packs, daily data quotas) and ~30% Postpaid accounts. Select any subscriber to inspect the correlated Customer 360 profile.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong className="text-gray-900">ARPU Distinction:</strong> Pack sticker price vs actual 30-day normalized revenue.
            </span>
          </div>
        </div>

        {/* Quick Filter Tabs: 70% Prepaid / 30% Postpaid / At-Risk */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabSelect('', '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              !customerType && !statusFilter
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Subscribers (1,000)</span>
          </button>

          <button
            onClick={() => handleTabSelect('Prepaid', '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              customerType === 'Prepaid' && !statusFilter
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>⚡ Prepaid Focus (700 • 70%)</span>
          </button>

          <button
            onClick={() => handleTabSelect('Postpaid', '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              customerType === 'Postpaid' && !statusFilter
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span>📋 Postpaid Accounts (300 • 30%)</span>
          </button>

          <button
            onClick={() => handleTabSelect('', 'At-Risk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusFilter === 'At-Risk'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>⚠️ At-Risk Churn Accounts</span>
          </button>
        </div>
      </div>

      {/* Search & Secondary Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, customer code, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-mono shadow-xs"
          />
        </div>

        <select
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          className="w-full md:w-auto px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-medium shadow-xs"
        >
          <option value="">All Mumbai Localities</option>
          <option value="Bandra West">Bandra West</option>
          <option value="Andheri East">Andheri East</option>
          <option value="BKC">BKC</option>
          <option value="Powai">Powai</option>
          <option value="Lower Parel">Lower Parel</option>
          <option value="Dadar">Dadar</option>
          <option value="Malad West">Malad West</option>
          <option value="Thane West">Thane West</option>
        </select>

        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="w-full md:w-auto px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-medium shadow-xs"
        >
          <option value="">All Segments</option>
          <option value="Prepaid - Daily Unlimited">Prepaid - Daily Unlimited</option>
          <option value="Prepaid - 5G High Speed">Prepaid - 5G High Speed</option>
          <option value="Prepaid - Long-term Bundle">Prepaid - Long-term Bundle</option>
          <option value="Postpaid - Individual Infinity">Postpaid - Individual Infinity</option>
          <option value="Postpaid - Family Plus">Postpaid - Family Plus</option>
          <option value="Postpaid - Enterprise ILL">Postpaid - Enterprise ILL</option>
        </select>

        <button
          type="submit"
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Customer List Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Subscriber Database</span>
            {customerType && (
              <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                customerType === 'Prepaid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                Filter: {customerType}
              </span>
            )}
            {statusFilter && (
              <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
                Status: {statusFilter}
              </span>
            )}
          </div>
          <span className="font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
            {loading ? 'Filtering...' : `${customers.length} subscribers found`}
          </span>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Subscriber / Code</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Type &amp; Locality</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Active Plan Pack</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                  <div className="flex items-center gap-1" title="Plan Value: Price/value of the customer's current plan">
                    <span>Plan Value</span>
                    <Info className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50/40">
                  <div className="flex items-center gap-1" title="Customer ARPU (30D): Revenue generated by this subscriber over the last 30 days.">
                    <span>Customer ARPU (30D)</span>
                    <Info className="w-3 h-3 text-emerald-600" />
                  </div>
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Validity / Quota</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Stage</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Customer 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {customers.map((c) => {
                const isPrepaid = c.customer_type === 'Prepaid';
                const isExpired = c.days_to_expiry < 0;

                return (
                  <tr 
                    key={c.id} 
                    onClick={() => onOpen360 && onOpen360(c.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 group"
                  >
                    {/* Subscriber / Code */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{c.name}</div>
                      <div className="font-mono text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span>{c.customer_code}</span>
                        {c.status === 'At-Risk' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">At-Risk</span>
                        )}
                      </div>
                    </td>

                    {/* Type & Locality */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isPrepaid 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {isPrepaid ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <CreditCard className="w-3 h-3 text-indigo-600" />}
                          {c.customer_type || 'Prepaid'}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">{c.locality}</span>
                    </td>

                    {/* Active Plan Pack */}
                    <td className="px-4 py-3.5 text-gray-900">
                      <div className="font-medium truncate max-w-[200px]" title={c.plan_name}>{c.plan_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {isPrepaid ? `${c.recharge_validity_days || 28}d Validity Pack` : c.segment}
                      </div>
                    </td>

                    {/* Plan Value */}
                    <td className="px-4 py-3.5 font-mono text-gray-700">
                      <div className="font-bold">&#8377;{(c.plan_price || c.arpu).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">
                        {isPrepaid ? `${c.recharge_validity_days || 28}d pack price` : 'monthly rental'}
                      </div>
                    </td>

                    {/* Customer ARPU (30D) */}
                    <td className="px-4 py-3.5 font-mono bg-emerald-50/20">
                      <div className="font-extrabold text-emerald-700 text-sm">
                        &#8377;{(c.revenue_30d || c.actual_arpu || c.arpu).toLocaleString()}
                        <span className="text-[10px] font-normal text-gray-400 ml-0.5">/mo</span>
                      </div>
                      <div className="text-[10px] text-emerald-600/80">
                        {isPrepaid ? '30d recognized revenue' : 'billed revenue'}
                      </div>
                    </td>

                    {/* Validity / Quota */}
                    <td className="px-4 py-3.5">
                      {isPrepaid ? (
                        <div>
                          <span className={`inline-flex items-center gap-1 font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                            isExpired 
                              ? 'bg-rose-100 text-rose-700' 
                              : c.days_to_expiry <= 2 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {isExpired ? `Expired (${Math.abs(c.days_to_expiry)}d ago)` : `${c.days_to_expiry}d left`}
                          </span>
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            Daily: {c.daily_data_used_gb || 0.8} / {c.daily_data_quota_gb || 1.5} GB
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-gray-700 font-medium">Billed Active</span>
                          <div className="text-[11px] text-gray-400 font-mono">Cycle 30d</div>
                        </div>
                      )}
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {c.current_stage || 'Use'}
                      </span>
                    </td>

                    {/* Customer 360 */}
                    <td className="px-4 py-3.5 text-right">
                      {onOpen360 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpen360(c.id);
                          }}
                          className="px-3 py-1 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>View 360</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
