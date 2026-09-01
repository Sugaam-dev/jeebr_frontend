import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExplainabilityInspector } from '../components/ExplainabilityInspector';
import { CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';

export const OrchestrationQueue = ({ onOpen360, onOpenGovernance }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
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
    api.getOrchestrationQueue(Boolean(force))
      .then((data) => {
        setQueue(data);
        if (data.length > 0) {
          setSelectedTicket((prev) => (prev ? data.find(d => d.ticket_id === prev.ticket_id) || data[0] : data[0]));
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

  const handleProposeWorkflow = async () => {
    if (!selectedTicket) return;
    setProposing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const rec = await api.proposeOrchestration(selectedTicket.ticket_id);
      setSuccessMsg(`Triage workflow recommendation #${rec.id} submitted to governance queue.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit orchestration workflow');
    } finally {
      setProposing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Scored intelligence engine</div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            AI-driven OSS/BSS Orchestration &amp; Incident Triage
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Multi-factor incident triage scoring customer SLA contracts, repeat history, and upstream node context into automated vs field workflows.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{refreshing ? 'Refreshing Triage...' : 'Refresh Triage Queue'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={onOpenGovernance}
            className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 ml-4 shrink-0"
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

      {/* 2-Column Split: Ticket Table + Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Triage Ticket Table */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-900">Active triage incident queue</span>
            <span className="font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">{queue.length} incidents scored</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Incident code</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Subscriber &amp; area</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Triage path</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Priority score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {queue.map((t) => {
                  const isSelected = selectedTicket?.ticket_id === t.ticket_id;
                  const isCritical = t.triage_priority_score >= 70;

                  return (
                    <tr
                      key={t.ticket_id}
                      onClick={() => setSelectedTicket(t)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-bold text-gray-900 font-mono">{t.ticket_code}</div>
                        <div className="text-[11px] text-gray-500">{t.category} ({t.priority})</div>
                      </td>
                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-bold text-gray-900">{t.customer_name}</div>
                        <div className="text-[11px] text-gray-500">{t.locality} &bull; {t.customer_segment}</div>
                      </td>
                      <td className="px-4 py-3.5 font-sans text-gray-700 font-medium">
                        {t.workflow_type}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {t.triage_priority_score}%
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
          {selectedTicket && (
            <ExplainabilityInspector
              title={`Incident ${selectedTicket.ticket_code}`}
              subtitle={`${selectedTicket.customer_name} • ${selectedTicket.locality} • ${selectedTicket.customer_segment}`}
              score={selectedTicket.triage_priority_score}
              scoreLabel="Triage priority"
              level={selectedTicket.priority_level}
              confidence={selectedTicket.confidence_score}
              signals={selectedTicket.contributing_signals}
              suggestedAction={selectedTicket.recommended_orchestration}
              actionButtonLabel="Authorize workflow execution"
              onPropose={handleProposeWorkflow}
              isProposing={proposing}
              isPending={selectedTicket.has_pending_recommendation}
              customMetric={selectedTicket.workflow_type}
              customMetricLabel="Target workflow path"
            />
          )}
        </div>

      </div>
    </div>
  );
};
