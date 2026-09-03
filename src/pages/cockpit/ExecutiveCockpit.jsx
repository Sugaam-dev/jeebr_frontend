import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MumbaiNetworkMap } from '../../components/common/MumbaiNetworkMap';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  AlertTriangle, 
  Activity, 
  IndianRupee, 
  CheckCircle2, 
  ArrowUpRight, 
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Smartphone,
  CreditCard,
  Users,
  ExternalLink,
  Zap,
  Info
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
  const [showArpuTooltip, setShowArpuTooltip] = useState(false);

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
      <Breadcrumbs items={[{ label: 'Executive Cockpit', icon: Activity }]} />

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

      {/* Prepaid & Postpaid Portfolio Split & Aggregate ARPU Card (70% Prepaid / 30% Postpaid) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 lg:p-6 card-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Subscriber Base &amp; Aggregate ARPU Performance
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Indian Telecom Focus (70% Prepaid / 30% Postpaid)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Aggregate revenue analytics tracking normalized 30-day recharge behavior vs postpaid billed collections across active subscriber cohorts.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/customers?customer_type=Prepaid')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>View Prepaid ({kpis.prepaid_subscribers_count || 700})</span>
            </button>
            <button
              onClick={() => navigate('/customers?customer_type=Postpaid')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              <span>View Postpaid ({kpis.postpaid_subscribers_count || 300})</span>
            </button>
          </div>
        </div>

        {/* Aggregate ARPU Comparison Grid: Overall vs Prepaid vs Postpaid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Overall Blended ARPU */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span>Overall Blended ARPU</span>
                <button 
                  onClick={() => setShowArpuTooltip(!showArpuTooltip)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="ARPU: Average revenue generated per active subscriber during the selected period."
                >
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </span>
              <span className="text-[10px] font-semibold bg-gray-200/70 text-gray-700 px-1.5 py-0.5 rounded">
                Active Base
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                &#8377;{(kpis.overall_arpu || 512).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 font-medium">/mo per subscriber</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
              <span>Total 30D Rev: &#8377;{(kpis.total_monthly_revenue || (kpis.overall_arpu * kpis.total_active_customers)).toLocaleString()}</span>
              <span className="font-mono text-[10px] text-gray-400">Total Rev ÷ Active Sub</span>
            </div>
          </div>

          {/* Prepaid ARPU (Indian Telecom Focus) */}
          <div 
            onClick={() => navigate('/customers?customer_type=Prepaid')}
            className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:border-emerald-300 transition-all cursor-pointer group relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prepaid ARPU (30D)</span>
                <span title="ARPU: Average revenue generated per active subscriber during the selected period.">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                </span>
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                70% Base
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-800 font-mono tracking-tight">
                &#8377;{kpis.avg_prepaid_arpu || 295}
              </span>
              <span className="text-xs text-emerald-700 font-medium">/mo per prepaid user</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center justify-between">
              <span>Cohort Rev: &#8377;{(kpis.prepaid_revenue_30d || (kpis.avg_prepaid_arpu * (kpis.prepaid_subscribers_count || 700))).toLocaleString()}</span>
              <span className="font-mono text-[10px] text-emerald-600">{kpis.prepaid_subscribers_count || 700} subscribers</span>
            </div>
          </div>

          {/* Postpaid ARPU */}
          <div 
            onClick={() => navigate('/customers?customer_type=Postpaid')}
            className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 hover:border-indigo-300 transition-all cursor-pointer group relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Postpaid ARPU (Billed)</span>
                <span title="ARPU: Average revenue generated per active subscriber during the selected period.">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                </span>
              </span>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-300">
                30% Base
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-900 font-mono tracking-tight">
                &#8377;{kpis.avg_postpaid_arpu ? kpis.avg_postpaid_arpu.toLocaleString() : '1,020'}
              </span>
              <span className="text-xs text-indigo-700 font-medium">/mo per account</span>
            </div>
            <div className="text-[11px] text-indigo-700 mt-1 flex items-center justify-between">
              <span>Cohort Rev: &#8377;{(kpis.postpaid_revenue_30d || (kpis.avg_postpaid_arpu * (kpis.postpaid_subscribers_count || 300))).toLocaleString()}</span>
              <span className="font-mono text-[10px] text-indigo-600">{kpis.postpaid_subscribers_count || 300} accounts</span>
            </div>
          </div>
        </div>

        {/* Global ARPU Tooltip Callout */}
        {showArpuTooltip && (
          <div className="p-3 rounded-lg bg-gray-900 text-white text-xs flex items-start justify-between gap-3 animate-fadeIn">
            <div className="space-y-1">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>ARPU Metric Definition:</span>
              </div>
              <p className="text-gray-300 text-[11px]">
                ARPU: Average revenue generated per active subscriber during the selected period.
              </p>
              <p className="text-gray-400 text-[10px] font-mono">
                Formula: Overall ARPU = Total Revenue during the period ÷ Average/Active Subscribers during the period. Not calculated by averaging sticker plan prices.
              </p>
            </div>
            <button 
              onClick={() => setShowArpuTooltip(false)}
              className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded bg-gray-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dual Ratio Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Prepaid Subscribers: 70% ({kpis.prepaid_subscribers_count || 700} Accounts)
            </span>
            <span className="text-indigo-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Postpaid Accounts: 30% ({kpis.postpaid_subscribers_count || 300} Accounts)
            </span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div 
              style={{ width: '70%' }} 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" 
              title="70% Prepaid Subscribers"
            />
            <div 
              style={{ width: '30%' }} 
              className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full transition-all duration-500" 
              title="30% Postpaid Accounts"
            />
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Prepaid Stats Tile */}
          <div 
            onClick={() => navigate('/customers?customer_type=Prepaid')}
            className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Prepaid Mobile Portfolio</span>
                  <span className="text-[11px] text-gray-500">28d, 56d, 84d &amp; 365d packs • Daily 1.5-2.5GB FUP</span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-emerald-100/80 pt-2">
              <div>
                <span className="text-[11px] text-gray-500">Monthly ARPU (Normalized 30d)</span>
                <div className="text-lg font-extrabold text-emerald-800 font-mono">
                  &#8377;{kpis.avg_prepaid_arpu || 285}
                  <span className="text-[11px] font-normal text-gray-500 ml-1">/mo</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-500">Active Subscribers</span>
                <div className="text-lg font-extrabold text-gray-900 font-mono">
                  {kpis.prepaid_subscribers_count || 700}
                </div>
              </div>
            </div>
          </div>

          {/* Postpaid Stats Tile */}
          <div 
            onClick={() => navigate('/customers?customer_type=Postpaid')}
            className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Postpaid &amp; Corporate Portfolio</span>
                  <span className="text-[11px] text-gray-500">Monthly billing • Auto-debit NACH • Dedicated ILL</span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-indigo-100/80 pt-2">
              <div>
                <span className="text-[11px] text-gray-500">Monthly ARPU (Billed)</span>
                <div className="text-lg font-extrabold text-indigo-800 font-mono">
                  &#8377;{kpis.avg_postpaid_arpu ? kpis.avg_postpaid_arpu.toLocaleString() : '1,420'}
                  <span className="text-[11px] font-normal text-gray-500 ml-1">/mo</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-500">Active Accounts</span>
                <div className="text-lg font-extrabold text-gray-900 font-mono">
                  {kpis.postpaid_subscribers_count || 300}
                </div>
              </div>
            </div>
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
