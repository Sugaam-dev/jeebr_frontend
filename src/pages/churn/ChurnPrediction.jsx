import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { ExplainabilityInspector } from '../../components/common/ExplainabilityInspector';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  ArrowRight, 
  AlertTriangle,
  Smartphone,
  CreditCard,
  Users,
  Clock,
  Info
} from 'lucide-react';

export const ChurnPrediction = () => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const onOpen360 = outletCtx?.onOpen360;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localityFilter, setLocalityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  const [proposing, setProposing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = (force = false) => {
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');
    api.getAtRiskCustomers(30, null, Boolean(force))
      .then((data) => {
        setCustomers(data || []);
        if (data && data.length > 0) {
          setSelectedCust((prev) => (prev ? data.find(d => d.customer_id === prev.customer_id) || data[0] : data[0]));
        }
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProposeSave = async () => {
    if (!selectedCust) return;
    setProposing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const rec = await api.proposeRetentionAction(selectedCust.customer_id);
      setSuccessMsg(`Retention recommendation #${rec.id} submitted to SentinelOS governance queue.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit retention proposal');
    } finally {
      setProposing(false);
    }
  };

  const filtered = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.customer_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocality = !localityFilter || c.locality === localityFilter;
    const matchesType = !typeFilter || c.customer_type === typeFilter;
    return matchesSearch && matchesLocality && matchesType;
  });

  const prepaidCount = customers.filter(c => c.customer_type === 'Prepaid').length;
  const postpaidCount = customers.filter(c => c.customer_type === 'Postpaid').length;
  const uniqueLocalities = Array.from(new Set(customers.map((c) => c.locality))).filter(Boolean);

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Back-Navigation */}
      <Breadcrumbs 
        items={[
          { label: 'Churn Prediction & Retention AI', icon: AlertTriangle },
          ...(typeFilter ? [{ label: `${typeFilter} At-Risk` }] : [])
        ]} 
        backTo="/cockpit"
        backLabel="Executive Cockpit"
      />

      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Scored Intelligence &bull; Indian Telecom Retention AI</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Subscriber Churn Risk Scoring &amp; Retention AI
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Real-time churn propensity evaluating prepaid recharge lag, daily FUP exhaustion, optical power attenuation, and repeat care complaints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-[#2463EB]' : ''}`} />
            <span>{refreshing ? 'Re-scoring ML Engine...' : 'Re-score Subscribers'}</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs: All vs Prepaid vs Postpaid */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            !typeFilter
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All At-Risk ({customers.length})</span>
        </button>

        <button
          onClick={() => setTypeFilter('Prepaid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            typeFilter === 'Prepaid'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>⚡ Prepaid At-Risk ({prepaidCount} • ~{Math.round(prepaidCount / Math.max(1, customers.length) * 100)}%)</span>
        </button>

        <button
          onClick={() => setTypeFilter('Postpaid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            typeFilter === 'Postpaid'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
          <span>📋 Postpaid At-Risk ({postpaidCount})</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => navigate('/governance')}
            className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View in approval queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by subscriber name or account code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-mono shadow-xs"
          />
        </div>
        <select
          value={localityFilter}
          onChange={(e) => setLocalityFilter(e.target.value)}
          className="w-full md:w-auto px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-medium shadow-xs"
        >
          <option value="">All Mumbai Localities</option>
          {uniqueLocalities.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* 2-Column Split: Table + Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        
        {/* Left Column: At-Risk Table */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-900">Ranked At-Risk Subscribers</span>
            <span className="font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">{filtered.length} accounts flagged</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[580px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Subscriber / Type</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Plan Value</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50/40" title="Customer ARPU (30D): Revenue generated by this subscriber over the last 30 days.">
                    Customer ARPU (30D)
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filtered.map((c) => {
                  const isSelected = selectedCust?.customer_id === c.customer_id;
                  const isCritical = c.churn_risk_score >= 70;
                  const isPrepaid = c.customer_type === 'Prepaid';

                  return (
                    <tr
                      key={c.customer_id}
                      onClick={() => setSelectedCust(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-4 border-l-[#2463EB]'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-bold text-gray-900 flex items-center space-x-2">
                          <span>{c.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isPrepaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {c.customer_type || 'Prepaid'}
                          </span>
                          {onOpen360 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpen360(c.customer_id);
                              }}
                              className="text-gray-400 hover:text-[#2463EB] transition-colors cursor-pointer"
                              title="Inspect Customer 360"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          {c.customer_code} &bull; {c.locality}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-gray-700 font-sans">
                        <div className="font-mono font-medium">&#8377;{(c.plan_price || c.arpu).toLocaleString()}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{c.plan_name}</div>
                      </td>

                      <td className="px-4 py-3.5 text-emerald-800 font-sans bg-emerald-50/20">
                        <div className="font-mono font-bold">&#8377;{(c.revenue_30d || c.actual_arpu || c.arpu).toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600/80">30d revenue</div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {c.churn_risk_score}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Unified Explainability Inspector */}
        <div className="lg:col-span-5 space-y-3">
          {selectedCust && (
            <>
              {/* Quick Customer 360 Button */}
              {onOpen360 && (
                <button
                  onClick={() => onOpen360(selectedCust.customer_id)}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-blue-600 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Open Full Customer 360 Profile ({selectedCust.name})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              <ExplainabilityInspector
                title={selectedCust.name}
                subtitle={`${selectedCust.customer_code} • ${selectedCust.customer_type || 'Prepaid'} • ${selectedCust.locality}`}
                score={selectedCust.churn_risk_score}
                scoreLabel="Churn propensity"
                level={selectedCust.risk_level}
                confidence={selectedCust.confidence_score}
                signals={selectedCust.top_factors}
                suggestedAction={selectedCust.suggested_retention_action}
                actionButtonLabel="Authorize retention save offer"
                onPropose={handleProposeSave}
                isProposing={proposing}
                isPending={selectedCust.has_pending_recommendation}
                customMetric={`₹${selectedCust.estimated_revenue_at_risk.toLocaleString()}/yr`}
                customMetricLabel="Annualized Revenue at Risk"
              />
            </>
          )}
        </div>

      </div>
    </div>
  );
};
