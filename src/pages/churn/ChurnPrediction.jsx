import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { ExplainabilityInspector } from '../../components/common/ExplainabilityInspector';
import { Search, CheckCircle2, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react';

export const ChurnPrediction = () => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const onOpen360 = outletCtx?.onOpen360;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localityFilter, setLocalityFilter] = useState('');
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
    api.getAtRiskCustomers(30, Boolean(force))
      .then((data) => {
        setCustomers(data);
        if (data.length > 0) {
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
    return matchesSearch && matchesLocality;
  });

  const uniqueLocalities = Array.from(new Set(customers.map((c) => c.locality))).filter(Boolean);

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB]">Scored Intelligence Engine</div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Subscriber Churn Risk Scoring &amp; Retention AI
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Composite risk scoring combining complaint recency, bandwidth drops, node health exposure, and payment delays.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-[#2463EB]' : ''}`} />
          <span>{refreshing ? 'Re-scoring ML Engine...' : 'Re-score Subscribers'}</span>
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
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Subscriber</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Locality</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">ARPU</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Churn Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filtered.map((c) => {
                  const isSelected = selectedCust?.customer_id === c.customer_id;
                  const isCritical = c.churn_risk_score >= 70;

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
                          {onOpen360 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpen360(c.customer_id);
                              }}
                              className="text-gray-400 hover:text-[#2463EB] transition-colors cursor-pointer"
                              title="View Customer 360"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">{c.customer_code} &bull; {c.plan_name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 font-sans">{c.locality}</td>
                      <td className="px-4 py-3.5 text-gray-900 font-semibold">&#8377;{c.arpu}</td>
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
        <div className="lg:col-span-5">
          {selectedCust && (
            <ExplainabilityInspector
              title={selectedCust.name}
              subtitle={`${selectedCust.customer_code} • ${selectedCust.locality} • ${selectedCust.plan_name}`}
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
              customMetricLabel="Annualized contract value"
            />
          )}
        </div>

      </div>
    </div>
  );
};
