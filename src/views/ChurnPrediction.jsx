import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExplainabilityInspector } from '../components/ExplainabilityInspector';
import { Search, CheckCircle2, ExternalLink } from 'lucide-react';

export const ChurnPrediction = ({ onOpen360, onOpenGovernance }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [localityFilter, setLocalityFilter] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  const [proposing, setProposing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getAtRiskCustomers(30)
      .then((data) => {
        setCustomers(data);
        if (data.length > 0 && !selectedCust) {
          setSelectedCust(data[0]);
        }
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
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
      setSuccessMsg(`Retention recommendation #${rec.id} submitted to governance queue.`);
      loadData();
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#8B8F99]">Scored intelligence engine</div>
          <h1 className="text-base font-bold text-[#EDEBE6] mt-0.5">
            Subscriber Churn Risk Scoring & Retention AI
          </h1>
          <p className="text-xs text-[#8B8F99] mt-0.5">
            Composite risk scoring combining complaint recency, bandwidth drops, node health exposure, and payment delays.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-[#232733] hover:bg-[#2C303C] text-xs font-medium text-[#EDEBE6] rounded transition-colors shrink-0 border border-[#2C303C]"
        >
          Re-score subscribers
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-[#232733] border border-[#4FAE8C] text-[#4FAE8C] text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={onOpenGovernance}
            className="underline font-medium hover:text-[#EDEBE6] ml-4 shrink-0"
          >
            View in approval queue &rarr;
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8B8F99] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by subscriber name or account code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded bg-[#1C1F27] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none focus:border-[#8B8F99] font-mono"
          />
        </div>
        <select
          value={localityFilter}
          onChange={(e) => setLocalityFilter(e.target.value)}
          className="px-3 py-2 rounded bg-[#1C1F27] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none font-mono"
        >
          <option value="">All Mumbai localities</option>
          {uniqueLocalities.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* 2-Column Split: Table + Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: At-Risk Table */}
        <div className="lg:col-span-7 bg-[#1C1F27] border border-[#2C303C] rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-[#2C303C] flex items-center justify-between text-xs text-[#8B8F99]">
            <span className="font-medium text-[#EDEBE6]">Ranked at-risk subscribers</span>
            <span className="font-mono">{filtered.length} accounts flagged</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#14161C] border-b border-[#2C303C] text-[#8B8F99]">
                <tr>
                  <th className="p-3 font-medium">Subscriber</th>
                  <th className="p-3 font-medium">Locality</th>
                  <th className="p-3 font-medium">ARPU</th>
                  <th className="p-3 font-medium text-right">Churn score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C303C] font-mono">
                {filtered.map((c) => {
                  const isSelected = selectedCust?.customer_id === c.customer_id;
                  const isCritical = c.churn_risk_score >= 70;

                  return (
                    <tr
                      key={c.customer_id}
                      onClick={() => setSelectedCust(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#232733] text-[#EDEBE6]'
                          : 'text-[#8B8F99] hover:bg-[#14161C] hover:text-[#EDEBE6]'
                      }`}
                    >
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-[#EDEBE6] flex items-center space-x-1.5">
                          <span>{c.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpen360(c.customer_id);
                            }}
                            className="text-[#8B8F99] hover:text-[#EDEBE6]"
                            title="View Customer 360"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[11px] text-[#8B8F99] font-mono">{c.customer_code} &bull; {c.plan_name}</div>
                      </td>
                      <td className="p-3 text-[#8B8F99] font-sans">{c.locality}</td>
                      <td className="p-3 text-[#EDEBE6]">&#8377;{c.arpu}</td>
                      <td className="p-3 text-right font-bold">
                        <span className={isCritical ? 'text-[#C1514B]' : 'text-[#C9822E]'}>
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
