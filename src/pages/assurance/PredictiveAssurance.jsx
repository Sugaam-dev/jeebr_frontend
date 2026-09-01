import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { MumbaiNetworkMap } from '../../components/common/MumbaiNetworkMap';
import { ExplainabilityInspector } from '../../components/common/ExplainabilityInspector';
import { CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';

export const PredictiveAssurance = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
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
    api.getNodePredictions(Boolean(force))
      .then((data) => {
        setPredictions(data);
        if (data.length > 0) {
          setSelectedNode((prev) => (prev ? data.find(d => d.node_id === prev.node_id) || data[0] : data[0]));
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

  const handleProposeDispatch = async () => {
    if (!selectedNode) return;
    setProposing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const rec = await api.proposeAssuranceDispatch(selectedNode.node_id);
      setSuccessMsg(`Dispatch recommendation #${rec.id} submitted to SentinelOS governance queue.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit dispatch recommendation');
    } finally {
      setProposing(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB]">Scored Intelligence Engine</div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Predictive Service Assurance &amp; Node Telemetry
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time degradation scoring correlating optical attenuation (dBm), backhaul utilization, packet drops, and subscriber impact.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-[#2463EB]' : ''}`} />
          <span>{refreshing ? 'Refreshing Telemetry...' : 'Refresh Telemetry'}</span>
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

      {/* Top Mumbai Topology Map */}
      <MumbaiNetworkMap
        nodes={predictions}
        selectedNodeId={selectedNode?.node_id}
        onSelectNode={setSelectedNode}
      />

      {/* 2-Column Split: Telemetry Table + Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        
        {/* Left Column: Tabular Telemetry Grid */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-900">Mumbai Node Telemetry Leaderboard</span>
            <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{predictions.length} nodes monitored</span>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Node &amp; Hub</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Optical Rx</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Util %</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Loss %</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Subscribers</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {predictions.map((p) => {
                  const isSelected = selectedNode?.node_id === p.node_id;
                  const isCritical = p.degradation_risk_score >= 60;
                  const isMedium = p.degradation_risk_score >= 35 && p.degradation_risk_score < 60;

                  return (
                    <tr
                      key={p.node_id}
                      onClick={() => setSelectedNode(p)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-4 border-l-[#2463EB]'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-bold text-gray-900">{p.node_name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{p.node_code} &bull; {p.area}</div>
                      </td>
                      <td className={`px-4 py-3.5 font-bold ${
                        p.optical_power_dbm < -26.5 ? 'text-rose-600' : 'text-gray-900'
                      }`}>
                        {p.optical_power_dbm} dBm
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{p.utilization_pct}%</td>
                      <td className="px-4 py-3.5 text-gray-600">{p.packet_loss_pct}%</td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {p.impacted_customers_count} <span className="text-[11px] text-gray-400">({p.impacted_corporate_count} ILL)</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                          isCritical 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : isMedium 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {p.degradation_risk_score}%
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
          {selectedNode && (
            <ExplainabilityInspector
              title={selectedNode.node_name}
              subtitle={`${selectedNode.node_code} • ${selectedNode.area} • ${selectedNode.node_type}`}
              score={selectedNode.degradation_risk_score}
              scoreLabel="Degradation score"
              level={selectedNode.risk_level}
              confidence={selectedNode.confidence_score}
              signals={selectedNode.contributing_signals}
              suggestedAction={selectedNode.suggested_action}
              actionButtonLabel="Authorize field dispatch"
              onPropose={handleProposeDispatch}
              isProposing={proposing}
              isPending={selectedNode.has_pending_recommendation}
              customMetric={`${selectedNode.impacted_customers_count} (${selectedNode.impacted_corporate_count} ILL)`}
              customMetricLabel="Impacted accounts"
            />
          )}
        </div>

      </div>
    </div>
  );
};
