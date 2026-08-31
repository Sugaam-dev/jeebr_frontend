import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

export const GovernanceAudit = ({ onOpen360 }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');
  const [recommendations, setRecommendations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [moduleFilter, setModuleFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    setErrorMsg('');
    Promise.all([
      api.getRecommendations(statusFilter || undefined, moduleFilter || undefined),
      api.getAuditTrail(moduleFilter || undefined)
    ])
      .then(([recs, audits]) => {
        setRecommendations(recs);
        setAuditLogs(audits);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
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
      setSuccessMsg(`Recommendation #${id} approved & executed.`);
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: 'EXECUTED' } : r));
      api.getAuditTrail(moduleFilter || undefined).then(setAuditLogs);
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
      api.getAuditTrail(moduleFilter || undefined).then(setAuditLogs);
    } catch (err) {
      setErrorMsg(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  const modules = [
    'Predictive Service Assurance',
    'Churn Prediction & Retention AI',
    'Revenue Assurance & Leakage Analytics',
    'AI-driven OSS/BSS Orchestration',
    'Intelligent Customer Journeys'
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#8B8F99]">Cross-cutting governance layer</div>
          <h1 className="text-base font-bold text-[#EDEBE6] mt-0.5">
            Human-in-the-Loop Governance & Immutable Audit Trail
          </h1>
          <p className="text-xs text-[#8B8F99] mt-0.5">
            All AI recommendations across all four scored engines require authorized domain sign-off before simulated execution.
          </p>
        </div>
        
        {/* Tab Toggle */}
        <div className="flex items-center space-x-1.5 bg-[#14161C] p-1 rounded border border-[#2C303C] shrink-0">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'queue' ? 'bg-[#232733] text-[#EDEBE6]' : 'text-[#8B8F99] hover:text-[#EDEBE6]'
            }`}
          >
            Approval queue ({recommendations.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'audit' ? 'bg-[#232733] text-[#EDEBE6]' : 'text-[#8B8F99] hover:text-[#EDEBE6]'
            }`}
          >
            Audit trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-[#232733] border border-[#4FAE8C] text-[#4FAE8C] text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded bg-[#232733] border border-[#C1514B] text-[#C1514B] text-xs">
          {errorMsg}
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-[#1C1F27] p-3 rounded-lg border border-[#2C303C] text-xs">
        <span className="text-[#8B8F99] font-medium">Filter by module:</span>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-2.5 py-1 rounded bg-[#14161C] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none font-mono"
        >
          <option value="">All 5 modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {activeTab === 'queue' && (
          <>
            <span className="text-[#8B8F99] font-medium ml-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded bg-[#14161C] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none font-mono"
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
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const isPending = rec.status === 'PENDING';

            return (
              <div
                key={rec.id}
                className={`p-4 rounded-lg border transition-colors space-y-3 ${
                  isPending 
                    ? 'bg-[#232733] border-l-4 border-l-[#C9822E] border-[#2C303C]' 
                    : 'bg-[#1C1F27] border-[#2C303C]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#2C303C] pb-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2 text-xs font-mono text-[#8B8F99]">
                      <span>#{rec.id} &bull; {rec.source_module}</span>
                      <span>&bull; Target: {rec.target_entity_label}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#EDEBE6]">{rec.title}</h3>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-mono text-[#8B8F99]">
                      Confidence: {(rec.confidence_score * 100).toFixed(0)}%
                    </span>
                    {/* Badge strictly for workflow state */}
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                      rec.status === 'PENDING'
                        ? 'bg-[#14161C] text-[#C9822E] border border-[#C9822E]/40'
                        : rec.status === 'EXECUTED'
                        ? 'bg-[#14161C] text-[#4FAE8C] border border-[#4FAE8C]/40'
                        : 'bg-[#14161C] text-[#C1514B] border border-[#C1514B]/40'
                    }`}>
                      {rec.status.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-[#14161C] border border-[#2C303C] space-y-1">
                    <div className="text-[#8B8F99] font-medium">Proposed action</div>
                    <p className="text-[#EDEBE6] font-medium">{rec.recommended_action}</p>
                    <p className="text-[#8B8F99] text-[11px]">{rec.description}</p>
                  </div>

                  <div className="p-3 rounded bg-[#14161C] border border-[#2C303C] space-y-1">
                    <div className="text-[#8B8F99] font-medium">Underlying signals</div>
                    <div className="text-[#8B8F99] font-mono text-[11px] max-h-20 overflow-y-auto space-y-0.5">
                      {rec.action_payload?.signals ? (
                        Array.isArray(rec.action_payload.signals) ? (
                          rec.action_payload.signals.map((s, idx) => (
                            <div key={idx}>
                              {typeof s === 'object' ? `${s.signal || s.factor || Object.keys(s)[0]}: ${s.value || s.detail || Object.values(s)[0]}` : s}
                            </div>
                          ))
                        ) : (
                          <pre>{JSON.stringify(rec.action_payload.signals, null, 2)}</pre>
                        )
                      ) : (
                        <span>Verified by ML inference engine</span>
                      )}
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="pt-1 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-[#2C303C]">
                    <div className="text-xs text-[#8B8F99] font-mono">
                      Authorized sign-off required (Active user: {user?.full_name} &bull; {user?.role})
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <button
                        disabled={processingId === rec.id}
                        onClick={() => handleReject(rec.id)}
                        className="px-3 py-1.5 bg-[#14161C] hover:bg-[#2C303C] text-[#C1514B] rounded text-xs font-semibold transition-colors border border-[#2C303C]"
                      >
                        Reject
                      </button>

                      <button
                        disabled={processingId === rec.id}
                        onClick={() => handleApprove(rec.id)}
                        className="px-4 py-1.5 bg-[#14161C] hover:bg-[#2C303C] text-[#4FAE8C] rounded text-xs font-semibold transition-colors border border-[#2C303C]"
                      >
                        {processingId === rec.id ? 'Executing...' : 'Approve & execute'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {recommendations.length === 0 && (
            <div className="p-8 text-center text-[#8B8F99] text-xs bg-[#1C1F27] rounded border border-[#2C303C]">
              No recommendations matching the active filter.
            </div>
          )}
        </div>
      )}

      {/* View 2: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-[#2C303C] flex items-center justify-between text-xs text-[#8B8F99]">
            <span className="font-medium text-[#EDEBE6]">Immutable governance audit log</span>
            <span className="font-mono">{auditLogs.length} events recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#14161C] border-b border-[#2C303C] text-[#8B8F99]">
                <tr>
                  <th className="p-3 font-medium">Timestamp</th>
                  <th className="p-3 font-medium">Module</th>
                  <th className="p-3 font-medium">Action taken</th>
                  <th className="p-3 font-medium">Decision</th>
                  <th className="p-3 font-medium">Responsible user</th>
                  <th className="p-3 font-medium text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C303C] font-mono">
                {auditLogs.map((a) => (
                  <tr key={a.id} className="text-[#EDEBE6] hover:bg-[#14161C] transition-colors">
                    <td className="p-3 text-[#8B8F99]">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-sans font-medium">{a.source_module}</td>
                    <td className="p-3 font-sans text-[#8B8F99] max-w-xs truncate">{a.action_taken}</td>
                    <td className="p-3">
                      {/* Badge strictly for workflow state */}
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        a.decision === 'APPROVED' ? 'text-[#4FAE8C] bg-[#14161C] border border-[#4FAE8C]/40' : 'text-[#C1514B] bg-[#14161C] border border-[#C1514B]/40'
                      }`}>
                        {a.decision.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-3 font-sans">
                      <div>{a.user_name}</div>
                      <div className="text-[11px] text-[#8B8F99] font-mono">{a.user_role}</div>
                    </td>
                    <td className="p-3 text-right">
                      {(a.confidence_score * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
