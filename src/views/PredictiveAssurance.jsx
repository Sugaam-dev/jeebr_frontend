import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MumbaiNetworkMap } from '../components/MumbaiNetworkMap';
import { ExplainabilityInspector } from '../components/ExplainabilityInspector';
import { CheckCircle2 } from 'lucide-react';

export const PredictiveAssurance = ({ onOpen360, onOpenGovernance }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [proposing, setProposing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getNodePredictions()
      .then((data) => {
        setPredictions(data);
        if (data.length > 0 && !selectedNode) {
          setSelectedNode(data[0]);
        }
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
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
      setSuccessMsg(`Dispatch recommendation #${rec.id} submitted to governance queue.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit dispatch recommendation');
    } finally {
      setProposing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#8B8F99]">Scored intelligence engine</div>
          <h1 className="text-base font-bold text-[#EDEBE6] mt-0.5">
            Predictive Service Assurance & Node Telemetry
          </h1>
          <p className="text-xs text-[#8B8F99] mt-0.5">
            Real-time degradation scoring correlating optical attenuation (dBm), backhaul utilization, packet drops, and subscriber impact.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-[#232733] hover:bg-[#2C303C] text-xs font-medium text-[#EDEBE6] rounded transition-colors shrink-0 border border-[#2C303C]"
        >
          Refresh telemetry
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

      {errorMsg && (
        <div className="p-3 rounded bg-[#232733] border border-[#C1514B] text-[#C1514B] text-xs">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tabular Telemetry Grid */}
        <div className="lg:col-span-7 bg-[#1C1F27] border border-[#2C303C] rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-[#2C303C] flex items-center justify-between text-xs text-[#8B8F99]">
            <span className="font-medium text-[#EDEBE6]">Mumbai node telemetry leaderboard</span>
            <span className="font-mono">{predictions.length} nodes monitored</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#14161C] border-b border-[#2C303C] text-[#8B8F99]">
                <tr>
                  <th className="p-3 font-medium">Node & hub</th>
                  <th className="p-3 font-medium">Optical Rx</th>
                  <th className="p-3 font-medium">Util %</th>
                  <th className="p-3 font-medium">Loss %</th>
                  <th className="p-3 font-medium">Subscribers</th>
                  <th className="p-3 font-medium text-right">Risk score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C303C] font-mono">
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
                          ? 'bg-[#232733] text-[#EDEBE6]'
                          : 'text-[#8B8F99] hover:bg-[#14161C] hover:text-[#EDEBE6]'
                      }`}
                    >
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-[#EDEBE6]">{p.node_name}</div>
                        <div className="text-[11px] text-[#8B8F99] font-mono">{p.node_code} &bull; {p.area}</div>
                      </td>
                      <td className={`p-3 font-bold ${
                        p.optical_power_dbm < -26.5 ? 'text-[#C1514B]' : 'text-[#EDEBE6]'
                      }`}>
                        {p.optical_power_dbm} dBm
                      </td>
                      <td className="p-3 text-[#8B8F99]">{p.utilization_pct}%</td>
                      <td className="p-3 text-[#8B8F99]">{p.packet_loss_pct}%</td>
                      <td className="p-3 text-[#8B8F99]">
                        {p.impacted_customers_count} <span className="text-[11px]">({p.impacted_corporate_count} ILL)</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-bold text-xs ${
                          isCritical ? 'text-[#C1514B]' : isMedium ? 'text-[#C9822E]' : 'text-[#4FAE8C]'
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
