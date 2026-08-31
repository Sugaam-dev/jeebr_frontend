import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExplainabilityInspector } from '../components/ExplainabilityInspector';
import { CheckCircle2 } from 'lucide-react';

export const OrchestrationQueue = ({ onOpen360, onOpenGovernance }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [proposing, setProposing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getOrchestrationQueue()
      .then((data) => {
        setQueue(data);
        if (data.length > 0 && !selectedTicket) {
          setSelectedTicket(data[0]);
        }
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
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
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit orchestration workflow');
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
            AI-driven OSS/BSS Orchestration & Incident Triage
          </h1>
          <p className="text-xs text-[#8B8F99] mt-0.5">
            Multi-factor incident triage scoring customer SLA contracts, repeat history, and upstream node context into automated vs field workflows.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-[#232733] hover:bg-[#2C303C] text-xs font-medium text-[#EDEBE6] rounded transition-colors shrink-0 border border-[#2C303C]"
        >
          Refresh triage queue
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

      {/* 2-Column Split: Ticket Table + Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Triage Ticket Table */}
        <div className="lg:col-span-7 bg-[#1C1F27] border border-[#2C303C] rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-[#2C303C] flex items-center justify-between text-xs text-[#8B8F99]">
            <span className="font-medium text-[#EDEBE6]">Active triage incident queue</span>
            <span className="font-mono">{queue.length} incidents scored</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#14161C] border-b border-[#2C303C] text-[#8B8F99]">
                <tr>
                  <th className="p-3 font-medium">Incident code</th>
                  <th className="p-3 font-medium">Subscriber & area</th>
                  <th className="p-3 font-medium">Triage path</th>
                  <th className="p-3 font-medium text-right">Priority score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C303C] font-mono">
                {queue.map((t) => {
                  const isSelected = selectedTicket?.ticket_id === t.ticket_id;
                  const isCritical = t.triage_priority_score >= 70;

                  return (
                    <tr
                      key={t.ticket_id}
                      onClick={() => setSelectedTicket(t)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#232733] text-[#EDEBE6]'
                          : 'text-[#8B8F99] hover:bg-[#14161C] hover:text-[#EDEBE6]'
                      }`}
                    >
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-[#EDEBE6] font-mono">{t.ticket_code}</div>
                        <div className="text-[11px] text-[#8B8F99]">{t.category} ({t.priority})</div>
                      </td>
                      <td className="p-3 font-sans">
                        <div className="font-medium text-[#EDEBE6]">{t.customer_name}</div>
                        <div className="text-[11px] text-[#8B8F99]">{t.locality} &bull; {t.customer_segment}</div>
                      </td>
                      <td className="p-3 font-sans text-[#EDEBE6]">
                        {t.workflow_type}
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span className={isCritical ? 'text-[#C1514B]' : 'text-[#EDEBE6]'}>
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
