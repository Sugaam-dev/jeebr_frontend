import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, ShieldCheck, XCircle, RefreshCw, Lock, ChevronDown, ChevronUp } from 'lucide-react';

const MODULE_ROLE_MAP = {
  "Predictive Service Assurance": ["NOC", "Admin"],
  "Churn Prediction & Retention AI": ["Care", "Admin"],
  "Intelligent Customer Journeys": ["Care", "Admin"],
  "AI-driven OSS/BSS Orchestration": ["NOC", "Admin"],
  "Revenue Assurance & Leakage Analytics": ["Revenue", "Admin"]
};

export const GovernanceAudit = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');
  const [recommendations, setRecommendations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [moduleFilter, setModuleFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [expandedAuditId, setExpandedAuditId] = useState(null);
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
      api.getRecommendations(statusFilter || undefined, moduleFilter || undefined, Boolean(force)),
      api.getAuditTrail(moduleFilter || undefined, undefined, Boolean(force))
    ])
      .then(([recs, audits]) => {
        setRecommendations(recs);
        setAuditLogs(audits);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, moduleFilter]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.approveRecommendation(id, `Approved by ${user?.full_name} (${user?.role})`);
      setSuccessMsg(`Recommendation #${id} approved & executed successfully.`);
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: 'EXECUTED' } : r));
      api.getAuditTrail(moduleFilter || undefined, undefined, true).then(setAuditLogs);
    } catch (err) {
      setErrorMsg(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.rejectRecommendation(id, `Rejected by ${user?.full_name} (${user?.role})`);
      setSuccessMsg(`Recommendation #${id} rejected.`);
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
      api.getAuditTrail(moduleFilter || undefined, undefined, true).then(setAuditLogs);
    } catch (err) {
      setErrorMsg(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  const modules = [
    'Predictive Service Assurance',
    'Churn Prediction & Retention AI',
    'Intelligent Customer Journeys',
    'AI-driven OSS/BSS Orchestration',
    'Revenue Assurance & Leakage Analytics'
  ];

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB]">Cross-Cutting Governance Layer</div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Human-in-the-Loop Governance &amp; Immutable Audit Trail
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            All AI recommendations across all five intelligence modules require authorized domain sign-off before simulated execution.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-[#2463EB]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>

          {/* Tab Toggle — segmented control */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            {[
              { key: 'queue', label: `Approval Queue (${recommendations.filter(r => r.status === 'PENDING').length})` },
              { key: 'audit', label: `Audit Trail (${auditLogs.length})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white text-[#2463EB] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-[#E2E8F0] rounded-xl p-4 card-shadow text-xs">
        <span className="text-gray-600 font-semibold">Filter by module:</span>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-medium"
        >
          <option value="">All 5 Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {activeTab === 'queue' && (
          <>
            <span className="text-gray-600 font-semibold ml-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-medium"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending approval</option>
              <option value="EXECUTED">Executed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </>
        )}
      </div>

      {/* View 1: Approval Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const isPending = rec.status === 'PENDING';
            const allowedRoles = MODULE_ROLE_MAP[rec.source_module] || ['Admin'];
            const canApprove = user?.role === 'Admin' || allowedRoles.includes(user?.role);

            const badgeClass =
              rec.status === 'APPROVED' || rec.status === 'EXECUTED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : rec.status === 'PENDING'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-rose-50 border-rose-200 text-rose-700';

            return (
              <div
                key={rec.id}
                className={`rounded-xl p-4 sm:p-5 space-y-4 transition-colors ${
                  isPending
                    ? 'bg-white border border-[#E2E8F0] border-l-4 border-l-amber-500 card-shadow-md'
                    : 'bg-white border border-[#E2E8F0] card-shadow'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-mono text-gray-500 flex-wrap">
                      <span>#{rec.id} &bull; {rec.source_module}</span>
                      <span>&bull; Target: {rec.target_entity_label}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{rec.title}</h3>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-mono text-gray-500">
                      Confidence: {(rec.confidence_score * 100).toFixed(0)}%
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${badgeClass}`}>
                      {rec.status.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-3.5 space-y-1">
                    <div className="text-gray-500 font-semibold uppercase tracking-wider text-[11px]">Proposed action</div>
                    <p className="text-gray-900 font-bold">{rec.recommended_action}</p>
                    <p className="text-gray-600 text-[11px] mt-1">{rec.description}</p>
                  </div>

                  <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-3.5 space-y-1">
                    <div className="text-gray-500 font-semibold uppercase tracking-wider text-[11px]">Underlying signals</div>
                    <div className="text-gray-600 font-mono text-[11px] max-h-24 overflow-y-auto space-y-0.5">
                      {rec.action_payload?.signals ? (
                        Array.isArray(rec.action_payload.signals) ? (
                          rec.action_payload.signals.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between border-b border-gray-200/40 py-0.5">
                              <span>{s.signal || s.factor || Object.keys(s)[0]}: {s.value || s.detail || Object.values(s)[0]}</span>
                              {s.weight && <span className="text-[#2463EB] font-semibold">{s.weight}</span>}
                            </div>
                          ))
                        ) : (
                          <pre>{JSON.stringify(rec.action_payload.signals, null, 2)}</pre>
                        )
                      ) : (
                        <span>Verified by AI inference engine</span>
                      )}
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                      {canApprove ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Authorized Sign-Off (Role: {user?.role})</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Requires {allowedRoles.join(' or ')} Authority (Active: {user?.role})</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <button
                        disabled={processingId === rec.id || !canApprove}
                        onClick={() => handleReject(rec.id)}
                        className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          canApprove 
                            ? 'border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer' 
                            : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        disabled={processingId === rec.id || !canApprove}
                        onClick={() => handleApprove(rec.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
                          canApprove
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{processingId === rec.id ? 'Executing...' : 'Approve & execute'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {recommendations.length === 0 && (
            <div className="p-12 text-center text-gray-500 text-xs bg-white rounded-xl border border-[#E2E8F0] card-shadow">
              No recommendations matching the active filter.
            </div>
          )}
        </div>
      )}

      {/* View 2: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Immutable Governance Audit Log</h3>
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">{auditLogs.length} events recorded</span>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Timestamp</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Module</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Action Taken</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Decision</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Responsible User</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Confidence</th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {auditLogs.map((a) => {
                  const isApproved = a.decision === 'APPROVED';
                  const isExpanded = expandedAuditId === a.id;

                  return (
                    <React.Fragment key={a.id}>
                      <tr 
                        onClick={() => setExpandedAuditId(isExpanded ? null : a.id)}
                        className="cursor-pointer transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3.5 text-gray-500 font-mono text-[11px]">
                          {new Date(a.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-900">{a.source_module}</td>
                        <td className="px-4 py-3.5 text-gray-600 max-w-xs truncate">{a.action_taken}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            <span>{a.decision.toLowerCase()}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-gray-900 font-medium">{a.user_name}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{a.user_role}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            {(a.confidence_score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center text-gray-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50 border-b border-gray-200">
                          <td colSpan={7} className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                                <div className="font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Original Signals Evaluated</div>
                                <pre className="text-[11px] text-gray-600 whitespace-pre-wrap">{JSON.stringify(a.original_signals, null, 2)}</pre>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                                <div className="font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Downstream Execution Receipt</div>
                                <pre className="text-[11px] text-emerald-700 whitespace-pre-wrap">{JSON.stringify(a.execution_result, null, 2)}</pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
