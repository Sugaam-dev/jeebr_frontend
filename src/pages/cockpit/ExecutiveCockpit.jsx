import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MumbaiNetworkMap } from '../../components/common/MumbaiNetworkMap';
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

export const ExecutiveCockpit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      <div className="p-8 sm:p-12 text-center text-gray-500 space-y-4 max-w-7xl mx-auto">
        <div className="w-8 h-8 border-3 border-[#2463EB] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs font-mono text-gray-600 font-medium">Connecting to SentinelOS Telemetry &amp; Models...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
          <span>Failed to load SentinelOS cockpit: {error}</span>
          <button 
            onClick={() => loadData(true)}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { kpis, module_statuses, locality_risk_distribution, leakage_by_category, recent_audit_events } = data;
  const userName = user?.full_name?.split(' ')[0] || 'Executive';

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner matching Reference Design */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 lg:p-7 card-shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#071B63] tracking-tight">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-900/70 max-w-2xl font-normal">
              Here's what's happening with your AI ecosystem and telecom operations today. All models, telemetry, and audit queues are operating under autonomous SentinelOS governance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => navigate('/pilot-bundle')}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Pilot Bundle Trace</span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:bg-slate-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Soft Background Visual Effect */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-blue-100/30 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards Row (4 Columns matching Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
        {/* Card 1: Risk Alerts / At-Risk Subscribers */}
        <div
          onClick={() => navigate('/churn')}
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 card-shadow hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Risk Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
                {kpis.total_at_risk_customers}
              </span>
              <span className="text-xs text-gray-400 font-medium">/ {kpis.total_active_customers} active</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200/60">
              <ArrowUp className="w-3 h-3" />
              <span>18%</span>
            </span>
            <span className="text-gray-500 text-[11px] font-normal">vs previous cycle</span>
          </div>
        </div>

        {/* Card 2: Degraded Nodes */}
        <div
          onClick={() => navigate('/assurance')}
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 card-shadow hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Degraded Nodes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
                {kpis.open_degraded_nodes}
              </span>
              <span className="text-xs text-gray-400 font-medium">({kpis.customers_impacted_by_degradation} impacted)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/60">
              <ArrowUp className="w-3 h-3" />
              <span>4.2%</span>
            </span>
            <span className="text-gray-500 text-[11px] font-normal">attenuation drift</span>
          </div>
        </div>

        {/* Card 3: Detected Leakage */}
        <div
          onClick={() => navigate('/revenue')}
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 card-shadow hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Leakage Identified</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
                &#8377;{kpis.total_detected_leakage_inr.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60">
              <ArrowDown className="w-3 h-3" />
              <span>2.4%</span>
            </span>
            <span className="text-gray-500 text-[11px] font-normal">reconciled billing</span>
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div
          onClick={() => navigate('/governance')}
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 card-shadow hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
                {kpis.pending_governance_approvals}
              </span>
              <span className="text-xs text-gray-400 font-medium">({kpis.avg_approval_turnaround_mins}m SLA)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60">
              <CheckCircle2 className="w-3 h-3" />
              <span>4 sign-offs today</span>
            </span>
          </div>
        </div>
      </div>

      {/* AI Risk Topology Visualization */}
      <MumbaiNetworkMap
        nodes={predictions}
        selectedNodeId={selectedNode?.node_id}
        onSelectNode={(n) => {
          setSelectedNode(n);
          navigate('/assurance');
        }}
      />

      {/* Portfolio Status Table matching Reference Style */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 lg:p-6 space-y-4 card-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                AI Overview: Portfolio Status &amp; Region Health
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                Active Modules
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">4 Scored ML engines + 2 Workflow automation layers</p>
          </div>
          <button
            onClick={() => navigate('/assurance')}
            className="text-[#2463EB] hover:text-[#1D4ED8] font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead className="bg-[#F1F5FD] border-b border-[#E2E8F0] text-gray-700">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Portfolio / Initiative</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Lifecycle Stage</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Current Status</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Active Alerts</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {module_statuses.map((m, idx) => {
                const moduleTabMap = {
                  'Predictive Service Assurance': '/assurance',
                  'Churn Prediction & Retention AI': '/churn',
                  'Intelligent Customer Journeys': '/journeys',
                  'AI-driven OSS/BSS Orchestration': '/orchestration',
                  'Revenue Assurance & Leakage Analytics': '/revenue',
                  'Human-in-the-Loop AI Governance': '/governance'
                };
                const targetTab = moduleTabMap[m.module_name] || '/assurance';

                const statusStyles = [
                  'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                  'bg-blue-50 text-blue-700 border-blue-200/80',
                  'bg-indigo-50 text-indigo-700 border-indigo-200/80',
                  'bg-teal-50 text-teal-700 border-teal-200/80'
                ];
                const pillStyle = statusStyles[idx % statusStyles.length];

                return (
                  <tr 
                    key={idx} 
                    onClick={() => navigate(targetTab)}
                    className="cursor-pointer transition-colors hover:bg-blue-50/40 group"
                    title={`Open ${m.module_name}`}
                  >
                    <td className="px-4 py-3.5 text-gray-900 font-semibold flex items-center justify-between">
                      <span className="group-hover:text-[#2463EB] transition-colors">{m.module_name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#2463EB] ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 font-medium">
                      {idx < 4 ? 'Scored ML Engine (Production)' : 'Governed Workflow Layer'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${pillStyle}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{m.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 font-mono font-medium">{m.active_alerts}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
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

      {/* Analytics Section (Side-by-Side Grid matching Reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        {/* Chart 1: Risk Distribution */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 lg:p-6 card-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Model Risk Distribution by Risk Level
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Total subscribers vs at-risk accounts across Mumbai clusters</p>
            </div>
            <span className="text-[11px] font-mono text-gray-400 font-medium">Total: 1,000</span>
          </div>
          <div className="h-60 sm:h-64">
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
                    borderRadius: '10px', 
                    boxShadow: '0 4px 14px rgba(15,23,42,0.08)' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#64748B' }} />
                <Bar dataKey="total_customers" name="Total subscribers" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="at_risk_customers" name="At-risk accounts" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Detected Leakage */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 lg:p-6 card-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Detected Leakage by Leakage Type
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Quantified INR discrepancy breakdown across SAP BRIM ledgers</p>
            </div>
            <span className="text-[11px] font-mono text-gray-400 font-medium">Categories: 4</span>
          </div>
          <div className="h-60 sm:h-64">
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
                    borderRadius: '10px', 
                    boxShadow: '0 4px 14px rgba(15,23,42,0.08)' 
                  }} 
                />
                <Bar dataKey="amount" name="Leakage amount (₹)" fill="#2463EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Governance Decisions Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 lg:p-6 space-y-4 card-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Recent Governance Decisions
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Audit Trail
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Latest human-in-the-loop approvals, denials, and automated actions</p>
          </div>
          <button
            onClick={() => navigate('/governance')}
            className="text-[#2463EB] hover:text-[#1D4ED8] font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-[#F1F5FD] border-b border-[#E2E8F0] text-gray-700">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Module / Area</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Decision</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Responsible</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Action Taken</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent_audit_events.map((a) => {
                const isApproved = a.decision === 'APPROVED';
                return (
                  <tr 
                    key={a.id} 
                    onClick={() => navigate('/governance')}
                    className="cursor-pointer transition-colors hover:bg-blue-50/40 group"
                    title="View in Governance Audit Trail"
                  >
                    <td className="px-4 py-3.5 text-gray-500 font-mono text-[11px]">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 font-semibold">{a.source_module}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{a.decision.toLowerCase()}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 font-medium">
                      {a.user_name} <span className="text-gray-400 font-normal">({a.user_role})</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 max-w-xs truncate">{a.action_taken}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
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
