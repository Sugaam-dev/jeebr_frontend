import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MumbaiNetworkMap } from '../components/MumbaiNetworkMap';
import { Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export const ExecutiveCockpit = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getCockpitSummary(),
      api.getNodePredictions()
    ])
      .then(([summary, preds]) => {
        setData(summary);
        setPredictions(preds);
        if (preds.length > 0) setSelectedNode(preds[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-[#8B8F99] space-y-3">
        <div className="w-6 h-6 border-2 border-[#4FAE8C] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="text-xs font-mono">Querying PostgreSQL Aggregations & ML Telemetry...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-3 rounded bg-[#232733] border border-[#C1514B] text-[#C1514B] text-xs">
          Failed to load cockpit: {error}
        </div>
      </div>
    );
  }

  const { kpis, module_statuses, locality_risk_distribution, leakage_by_category, recent_audit_events } = data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Compact Horizontal Status Strip (Replaces 4 Large Separate Cards) */}
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-4">
        <div 
          onClick={() => onNavigate('churn')}
          className="flex items-baseline space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-[#8B8F99]">At-risk subscribers:</span>
          <span className="font-mono text-base font-bold text-[#C1514B]">{kpis.total_at_risk_customers}</span>
          <span className="text-xs text-[#8B8F99] font-mono">/ {kpis.total_active_customers}</span>
        </div>

        <div className="h-4 w-px bg-[#2C303C] hidden md:block"></div>

        <div 
          onClick={() => onNavigate('assurance')}
          className="flex items-baseline space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-[#8B8F99]">Degraded nodes:</span>
          <span className="font-mono text-base font-bold text-[#C9822E]">{kpis.open_degraded_nodes}</span>
          <span className="text-xs text-[#8B8F99] font-mono">({kpis.customers_impacted_by_degradation} users impacted)</span>
        </div>

        <div className="h-4 w-px bg-[#2C303C] hidden md:block"></div>

        <div 
          onClick={() => onNavigate('revenue')}
          className="flex items-baseline space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-[#8B8F99]">Detected leakage:</span>
          <span className="font-mono text-base font-bold text-[#EDEBE6]">&#8377;{kpis.total_detected_leakage_inr.toLocaleString()}</span>
        </div>

        <div className="h-4 w-px bg-[#2C303C] hidden md:block"></div>

        <div 
          onClick={() => onNavigate('governance')}
          className="flex items-baseline space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-[#8B8F99]">Pending approvals:</span>
          <span className="font-mono text-base font-bold text-[#C9822E]">{kpis.pending_governance_approvals}</span>
          <span className="text-xs text-[#8B8F99] font-mono">(avg turnaround {kpis.avg_approval_turnaround_mins}m)</span>
        </div>

        <button
          onClick={loadData}
          className="px-2.5 py-1 rounded bg-[#232733] hover:bg-[#2C303C] text-xs font-medium text-[#EDEBE6] transition-colors border border-[#2C303C]"
        >
          Refresh
        </button>
      </div>

      {/* Primary Visual Anchor: Mumbai Topological Network Map */}
      <MumbaiNetworkMap
        nodes={predictions}
        selectedNodeId={selectedNode?.node_id}
        onSelectNode={(n) => {
          setSelectedNode(n);
          onNavigate('assurance');
        }}
      />

      {/* Dense Portfolio Status Table (Replaces 6 Identical Cards) */}
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#2C303C] pb-2">
          <h3 className="text-xs font-semibold text-[#EDEBE6]">
            PMRG AI Overlay portfolio status & engine health
          </h3>
          <span className="text-xs text-[#8B8F99] font-mono">4 Scored ML engines + 2 Workflow layers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2C303C] text-[#8B8F99]">
                <th className="pb-2 font-medium">Offering</th>
                <th className="pb-2 font-medium">Underlying logic</th>
                <th className="pb-2 font-medium">Current status</th>
                <th className="pb-2 font-medium">Active alerts / items</th>
                <th className="pb-2 font-medium text-right">Confidence avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C303C] text-[#EDEBE6]">
              {module_statuses.map((m, idx) => (
                <tr key={idx} className="hover:bg-[#14161C] transition-colors">
                  <td className="py-2.5 font-medium">{m.module_name}</td>
                  <td className="py-2.5 text-[#8B8F99]">
                    {idx < 4 ? 'Scored ML Engine (PostgreSQL)' : 'Governed Workflow Rule-Engine'}
                  </td>
                  <td className="py-2.5 text-xs text-[#4FAE8C]">{m.status}</td>
                  <td className="py-2.5 font-mono">{m.active_alerts}</td>
                  <td className="py-2.5 text-right font-mono font-medium">
                    {(m.confidence_avg * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 rounded-lg bg-[#1C1F27] border border-[#2C303C] space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-[#EDEBE6]">Mumbai subscriber risk distribution by neighborhood</h3>
            <p className="text-[11px] text-[#8B8F99]">Total subscribers vs at-risk accounts</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locality_risk_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C303C" />
                <XAxis dataKey="locality" stroke="#8B8F99" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis stroke="#8B8F99" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#14161C', borderColor: '#2C303C', fontSize: '11px', color: '#EDEBE6' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="total_customers" name="Total subscribers" fill="#8B8F99" radius={[2, 2, 0, 0]} />
                <Bar dataKey="at_risk_customers" name="At-risk" fill="#C1514B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#1C1F27] border border-[#2C303C] space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-[#EDEBE6]">Revenue leakage by anomaly category</h3>
            <p className="text-[11px] text-[#8B8F99]">Quantified INR leakage across billing ledgers</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leakage_by_category} layout="vertical" margin={{ top: 10, right: 20, left: 35, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C303C" />
                <XAxis type="number" stroke="#8B8F99" tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" stroke="#8B8F99" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#14161C', borderColor: '#2C303C', fontSize: '11px', color: '#EDEBE6' }} />
                <Bar dataKey="amount" name="Leakage amount (₹)" fill="#C9822E" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Governance Audit Table */}
      <div className="p-4 rounded-lg bg-[#1C1F27] border border-[#2C303C] space-y-3">
        <div className="flex items-center justify-between border-b border-[#2C303C] pb-2">
          <div>
            <h3 className="text-xs font-semibold text-[#EDEBE6]">Recent governance decisions</h3>
            <p className="text-[11px] text-[#8B8F99]">Chronological audit log of human approvals & executions</p>
          </div>
          <button
            onClick={() => onNavigate('governance')}
            className="text-xs text-[#EDEBE6] hover:underline font-medium flex items-center space-x-1"
          >
            <span>Full audit log</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2C303C] text-[#8B8F99]">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Module</th>
                <th className="pb-2 font-medium">Decision</th>
                <th className="pb-2 font-medium">Responsible user</th>
                <th className="pb-2 font-medium">Action executed</th>
                <th className="pb-2 font-medium text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C303C]">
              {recent_audit_events.map((a) => (
                <tr key={a.id} className="text-[#EDEBE6] hover:bg-[#14161C] transition-colors">
                  <td className="py-2 text-[#8B8F99] font-mono">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2">{a.source_module}</td>
                  <td className="py-2">
                    {/* Badge strictly for workflow state */}
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                      a.decision === 'APPROVED' ? 'bg-[#14161C] text-[#4FAE8C] border border-[#4FAE8C]/40' : 'bg-[#14161C] text-[#C1514B] border border-[#C1514B]/40'
                    }`}>
                      {a.decision.toLowerCase()}
                    </span>
                  </td>
                  <td className="py-2">
                    {a.user_name} <span className="text-[#8B8F99]">({a.user_role})</span>
                  </td>
                  <td className="py-2 text-[#8B8F99] max-w-xs truncate">{a.action_taken}</td>
                  <td className="py-2 text-right font-mono">
                    {(a.confidence_score * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
