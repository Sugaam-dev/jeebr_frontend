import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { ExplainabilityInspector } from '../../components/common/ExplainabilityInspector';
import { 
  CheckCircle2, ExternalLink, RefreshCw, ArrowRight, Search, 
  Layers, MessageSquare, Phone, Smartphone, Mail
} from 'lucide-react';

const STAGE_COLORS = {
  'Acquisition': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', active: 'bg-indigo-600 text-white' },
  'Install': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', active: 'bg-cyan-600 text-white' },
  'Use': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', active: 'bg-emerald-600 text-white' },
  'Renewal': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', active: 'bg-purple-600 text-white' },
  'Complaint': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', active: 'bg-rose-600 text-white' },
  'Win-back': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', active: 'bg-amber-600 text-white' }
};

export const CustomerJourneys = () => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const onOpen360 = outletCtx?.onOpen360;

  const [items, setItems] = useState([]);
  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState('All');
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
    Promise.all([
      api.getJourneyNBAs(Boolean(force)),
      api.getJourneyFunnelSummary(Boolean(force))
    ])
      .then(([nbaItems, funnel]) => {
        setItems(nbaItems);
        setFunnelData(funnel);
        if (nbaItems.length > 0) {
          setSelectedCust((prev) => (prev ? nbaItems.find(d => d.customer_id === prev.customer_id) || nbaItems[0] : nbaItems[0]));
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

  const handlePropose = async () => {
    if (!selectedCust) return;
    setProposing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const rec = await api.proposeJourneyAction(selectedCust.customer_id);
      setSuccessMsg(`Next-Best-Action for ${selectedCust.name} (${selectedCust.current_stage}) sent to SentinelOS governance queue (ID #${rec.id}).`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit journey proposal');
    } finally {
      setProposing(false);
    }
  };

  const stages = ['All', 'Acquisition', 'Install', 'Use', 'Renewal', 'Complaint', 'Win-back'];

  const filtered = items.filter((i) => {
    const matchesStage = activeStage === 'All' || i.current_stage === activeStage;
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.customer_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocality = !localityFilter || i.locality === localityFilter;
    return matchesStage && matchesSearch && matchesLocality;
  });

  const uniqueLocalities = Array.from(new Set(items.map((i) => i.locality))).filter(Boolean);

  const getChannelIcon = (channelStr = '') => {
    if (channelStr.toLowerCase().includes('phone') || channelStr.toLowerCase().includes('call')) {
      return <Phone className="w-3 h-3 text-emerald-600 inline mr-1" />;
    }
    if (channelStr.toLowerCase().includes('whatsapp')) {
      return <MessageSquare className="w-3 h-3 text-emerald-600 inline mr-1" />;
    }
    if (channelStr.toLowerCase().includes('app')) {
      return <Smartphone className="w-3 h-3 text-blue-600 inline mr-1" />;
    }
    return <Mail className="w-3 h-3 text-purple-600 inline mr-1" />;
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB]">Governed Lifecycle Engine</div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Intelligent Customer Journeys &amp; Next-Best-Action
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Rule-based Next-Best-Action mapping across Acquisition &rarr; Install &rarr; Use &rarr; Renewal &rarr; Complaint &rarr; Win-back stages.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-[#2463EB]' : ''}`} />
          <span>{refreshing ? 'Re-evaluating Journeys...' : 'Refresh Lifecycle Stages'}</span>
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

      {/* Lifecycle Funnel Pipeline Overview */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 card-shadow space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2463EB]" />
            <span className="font-bold text-gray-900">Customer Lifecycle Funnel &amp; Distribution</span>
          </div>
          <span className="text-gray-500 font-mono text-[11px] bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
            {funnelData?.total_customers || items.length} Active Subscribers
          </span>
        </div>

        {/* Funnel Stage Steps */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-1">
          {funnelData?.stages?.map((st) => {
            const isSelected = activeStage === st.stage;
            const style = STAGE_COLORS[st.stage] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

            return (
              <button
                key={st.stage}
                onClick={() => setActiveStage(isSelected ? 'All' : st.stage)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-xs'
                    : `${style.bg} ${style.border} hover:shadow-xs`
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold ${style.text}`}>{st.stage}</span>
                  <span className="text-[10px] font-mono text-gray-500">{st.percentage}%</span>
                </div>

                <div className="my-2">
                  <div className="text-base sm:text-lg font-bold font-mono text-gray-900">{st.count}</div>
                  <div className="text-[10px] sm:text-[10.5px] text-gray-500 font-mono">Avg NPS: {st.avg_nps}/10</div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[10px]">
                  <span className="font-mono text-gray-600">INR {st.total_arpu >= 1000 ? `${(st.total_arpu / 1000).toFixed(0)}k` : st.total_arpu}</span>
                  <span className={`px-1.5 py-0.2 rounded font-semibold ${
                    st.health_status === 'Action Required' ? 'bg-rose-100 text-rose-700' :
                    st.health_status === 'Opportunity' ? 'bg-amber-100 text-amber-700' :
                    st.health_status === 'Onboarding' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {st.health_status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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

        {/* Stage Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs shrink-0 max-w-full -mx-2 sm:mx-0 px-2 sm:px-0">
          {stages.map((st) => {
            const count = st === 'All' ? items.length : items.filter((i) => i.current_stage === st).length;
            const isActive = activeStage === st;
            return (
              <button
                key={st}
                onClick={() => setActiveStage(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#2463EB] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <span>{st}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>({count})</span>
              </button>
            );
          })}
        </div>

        <select
          value={localityFilter}
          onChange={(e) => setLocalityFilter(e.target.value)}
          className="w-full md:w-auto px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-medium shadow-xs shrink-0"
        >
          <option value="">All Mumbai Localities</option>
          {uniqueLocalities.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* 2-Column Split: Table + Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        
        {/* Left Column: Customer Journeys Table */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-900">Lifecycle Subscribers ({filtered.length})</span>
            <span className="font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">Click row to inspect NBA</span>
          </div>

          <div className="overflow-x-auto max-h-[620px] overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Subscriber</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Stage</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Next-Best-Action</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filtered.slice(0, 50).map((item) => {
                  const isSelected = selectedCust?.customer_id === item.customer_id;
                  const style = STAGE_COLORS[item.current_stage] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

                  return (
                    <tr
                      key={item.customer_id}
                      onClick={() => setSelectedCust(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {onOpen360 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onOpen360(item.customer_id); }}
                              className="text-gray-400 hover:text-[#2463EB] transition-colors cursor-pointer"
                              title="Open Customer 360"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          {item.customer_code} &bull; {item.locality}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                          {item.current_stage}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="text-gray-900 font-medium truncate text-xs">
                          {item.next_best_action}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">
                          {getChannelIcon(item.suggested_channel)}
                          <span>{item.suggested_channel}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {(item.confidence_score * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Explainability Inspector Panel */}
        <div className="lg:col-span-5 space-y-4">
          {selectedCust ? (
            <ExplainabilityInspector
              title={selectedCust.name}
              subtitle={`${selectedCust.customer_code} • ${selectedCust.locality} • ${selectedCust.segment}`}
              score={(selectedCust.confidence_score * 100).toFixed(0)}
              scoreLabel="NBA Confidence"
              level={selectedCust.current_stage}
              confidence={selectedCust.confidence_score}
              signals={selectedCust.contributing_signals}
              suggestedAction={selectedCust.next_best_action}
              actionButtonLabel={`Propose ${selectedCust.current_stage} Action to Governance`}
              onPropose={handlePropose}
              isProposing={proposing}
              isPending={selectedCust.has_pending_recommendation}
              customMetric={selectedCust.suggested_channel}
              customMetricLabel="Recommended Channel"
            />
          ) : (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-[#E2E8F0] card-shadow text-xs">
              Select a customer to inspect Next-Best-Action signals and propose to governance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
