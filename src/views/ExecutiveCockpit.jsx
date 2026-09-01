import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MumbaiNetworkMap } from '../components/MumbaiNetworkMap';
import { 
  AlertTriangle, 
  Activity, 
  IndianRupee, 
  CheckCircle2, 
  ArrowUpRight, 
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';
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

export const ExecutiveCockpit = ({ onNavigate, onOpen360 }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = (force = false) => {
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    Promise.all([
      api.getCockpitSummary(Boolean(force)),
      api.getNodePredictions(Boolean(force))
    ])
      .then(([summary, preds]) => {
        setData(summary);
        setPredictions(preds);
        if (preds.length > 0) setSelectedNode(preds[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 space-y-3">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs font-mono text-gray-600">Querying PostgreSQL Aggregations &amp; ML Telemetry...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          Failed to load cockpit: {error}
        </div>
      </div>
    );
  }

  const { kpis, module_statuses, locality_risk_distribution, leakage_by_category, recent_audit_events } = data;
  const userName = user?.full_name?.split(' ')[0] || 'Executive';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header / Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here is the real-time operational overview across your Mumbai network, subscriber risks, and governed AI workflows.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{refreshing ? 'Refreshing Data...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Recommended Pilot Bundle Quick-Launch Banner */}
      <div 
        onClick={() => onNavigate('pilot-bundle')}
        className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl p-4 md:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:shadow-lg transition-all border border-blue-800/60 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.2 rounded border border-emerald-500/30">
                Recommended Pilot Bundle
              </span>
              <span className="text-xs font-medium text-blue-200">End-to-End Governed Loop</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Experience the single connected narrative: <strong>Observe &rarr; Predict &rarr; Recommend &rarr; Approve &rarr; Execute &rarr; Learn</strong>
            </p>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onNavigate('pilot-bundle'); }}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <span>Launch E2E Trace</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Stat Cards (Top Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('churn')}
          className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-rose-500 card-shadow hover:shadow-md transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">At-Risk Subscribers</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 font-mono">{kpis.total_at_risk_customers}</span>
              <span className="text-xs text-gray-500 font-mono">/ {kpis.total_active_customers}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>+18% from last week</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('assurance')}
          className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-amber-500 card-shadow hover:shadow-md transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Degraded Nodes</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 font-mono">{kpis.open_degraded_nodes}</span>
              <span className="text-xs text-gray-500 font-mono">({kpis.customers_impacted_by_degradation} users)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>+4.2% from last week</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('revenue')}
          className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500 card-shadow hover:shadow-md transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detected Leakage</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 font-mono">&#8377;{kpis.total_detected_leakage_inr.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>-2.4% from last week</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('governance')}
          className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-emerald-500 card-shadow hover:shadow-md transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 font-mono">{kpis.pending_governance_approvals}</span>
              <span className="text-xs text-gray-500 font-mono">({kpis.avg_approval_turnaround_mins}m avg turnaround)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4 resolved today</span>
          </div>
        </div>
      </div>

      {/* Network/Topology Diagram Card */}
      <MumbaiNetworkMap
        nodes={predictions}
        selectedNodeId={selectedNode?.node_id}
        onSelectNode={(n) => {
          setSelectedNode(n);
          onNavigate('assurance');
        }}
      />

      {/* Data Table Card (PMRG AI Overlay Portfolio Status) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 card-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              PMRG AI Overlay portfolio status &amp; engine health
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">4 Scored ML engines + 2 Workflow layers</p>
          </div>
          <button
            onClick={() => onNavigate('assurance')}
            className="text-blue-600 hover:text-blue-700 font-medium text-xs flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Offering</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Underlying logic</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Current status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Active alerts / items</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Confidence avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {module_statuses.map((m, idx) => {
                const borderColors = ['border-l-rose-500', 'border-l-amber-500', 'border-l-blue-500', 'border-l-indigo-500', 'border-l-emerald-500', 'border-l-teal-500'];
                const accentBorder = borderColors[idx % borderColors.length];
                
                const moduleTabMap = {
                  'Predictive Service Assurance': 'assurance',
                  'Churn Prediction & Retention AI': 'churn',
                  'Intelligent Customer Journeys': 'journeys',
                  'AI-driven OSS/BSS Orchestration': 'orchestration',
                  'Revenue Assurance & Leakage Analytics': 'revenue',
                  'Human-in-the-Loop AI Governance': 'governance'
                };
                const targetTab = moduleTabMap[m.module_name] || 'assurance';

                return (
                  <tr 
                    key={idx} 
                    onClick={() => onNavigate(targetTab)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50/50 border-l-3 ${accentBorder}`}
                    title={`Open ${m.module_name}`}
                  >
                    <td className="px-4 py-3.5 text-gray-900 font-semibold flex items-center justify-between">
                      <span>{m.module_name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 ml-2 shrink-0 opacity-60" />
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {idx < 4 ? 'Scored ML Engine (PostgreSQL)' : 'Governed Workflow Rule-Engine'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{m.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 font-mono font-medium">{m.active_alerts}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        {(m.confidence_avg * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row (Two Side-by-Side Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 card-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Mumbai subscriber risk distribution by neighborhood</h3>
              <p className="text-xs text-gray-500 mt-0.5">Total subscribers vs at-risk accounts</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locality_risk_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="locality" stroke="#94A3B8" tick={{ fontSize: 10, fill: '#64748B' }} angle={-25} textAnchor="end" />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E2E8F0', 
                    fontSize: '11px', 
                    color: '#0F172A', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#64748B' }} />
                <Bar dataKey="total_customers" name="Total subscribers" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="at_risk_customers" name="At-risk" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 card-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Revenue leakage by anomaly category</h3>
              <p className="text-xs text-gray-500 mt-0.5">Quantified INR leakage across billing ledgers</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leakage_by_category} layout="vertical" margin={{ top: 10, right: 25, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="category" type="category" stroke="#94A3B8" tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E2E8F0', 
                    fontSize: '11px', 
                    color: '#0F172A', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                  }} 
                />
                <Bar dataKey="amount" name="Leakage amount (₹)" fill="#3B6BFF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 card-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Recent governance decisions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Chronological audit log of human approvals &amp; executions</p>
          </div>
          <button
            onClick={() => onNavigate('governance')}
            className="text-blue-600 hover:text-blue-700 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Full audit log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Timestamp</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Module</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Decision</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Responsible user</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Action executed</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent_audit_events.map((a) => {
                const isApproved = a.decision === 'APPROVED';
                return (
                  <tr 
                    key={a.id} 
                    onClick={() => onNavigate('governance')}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    title="View in Governance Audit Trail"
                  >
                    <td className="px-4 py-3.5 text-gray-500 font-mono">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 font-medium">{a.source_module}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{a.decision.toLowerCase()}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 font-medium">
                      {a.user_name} <span className="text-gray-500 font-normal">({a.user_role})</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 max-w-xs truncate">{a.action_taken}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        {(a.confidence_score * 100).toFixed(0)}%
                      </span>
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
