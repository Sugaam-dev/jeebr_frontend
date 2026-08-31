import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExplainabilityInspector } from '../components/ExplainabilityInspector';
import { CheckCircle2 } from 'lucide-react';

export const RevenueAssurance = ({ onOpen360, onOpenGovernance }) => {
  const [leakages, setLeakages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInv, setSelectedInv] = useState(null);
  const [proposing, setProposing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getRevenueLeakages()
      .then((data) => {
        setLeakages(data);
        if (data.length > 0 && !selectedInv) {
          setSelectedInv(data[0]);
        }
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalLeakage = leakages.reduce((sum, item) => sum + item.leakage_amount, 0);

  const handleProposeFix = async () => {
    if (!selectedInv) return;
    setProposing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const rec = await api.proposeRevenueRemediation(selectedInv.invoice_id);
      setSuccessMsg(`Billing remediation recommendation #${rec.id} submitted to governance queue.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit billing remediation');
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
            Revenue Assurance & Billing Anomaly Detection
          </h1>
          <p className="text-xs text-[#8B8F99] mt-0.5">
            Multi-signal scoring detecting catalog rate mismatches, duplicate credit adjustments, unbilled add-on usage, and dunning collection gaps.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-[#8B8F99]">Total unrecovered leakage</div>
          <div className="text-lg font-bold text-[#EDEBE6] font-mono">&#8377;{totalLeakage.toLocaleString()}</div>
        </div>
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

      {/* 2-Column Split: Anomaly Table + Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Anomaly Invoices Table */}
        <div className="lg:col-span-7 bg-[#1C1F27] border border-[#2C303C] rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-[#2C303C] flex items-center justify-between text-xs text-[#8B8F99]">
            <span className="font-medium text-[#EDEBE6]">Flagged billing anomaly ledger</span>
            <span className="font-mono">{leakages.length} anomalies scored</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#14161C] border-b border-[#2C303C] text-[#8B8F99]">
                <tr>
                  <th className="p-3 font-medium">Invoice & subscriber</th>
                  <th className="p-3 font-medium">Anomaly vector</th>
                  <th className="p-3 font-medium">Leakage</th>
                  <th className="p-3 font-medium text-right">Anomaly score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C303C] font-mono">
                {leakages.map((inv) => {
                  const isSelected = selectedInv?.invoice_id === inv.invoice_id;

                  return (
                    <tr
                      key={inv.invoice_id}
                      onClick={() => setSelectedInv(inv)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#232733] text-[#EDEBE6]'
                          : 'text-[#8B8F99] hover:bg-[#14161C] hover:text-[#EDEBE6]'
                      }`}
                    >
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-[#EDEBE6]">{inv.customer_name}</div>
                        <div className="text-[11px] text-[#8B8F99] font-mono">{inv.invoice_code} &bull; {inv.locality}</div>
                      </td>
                      <td className="p-3 font-sans text-[#EDEBE6]">
                        {inv.anomaly_type}
                      </td>
                      <td className="p-3 text-[#C1514B] font-bold">
                        &#8377;{inv.leakage_amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-[#EDEBE6]">
                        {inv.leakage_risk_score}%
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
          {selectedInv && (
            <ExplainabilityInspector
              title={`Invoice ${selectedInv.invoice_code}`}
              subtitle={`${selectedInv.customer_name} • ${selectedInv.plan_name}`}
              score={selectedInv.leakage_risk_score}
              scoreLabel="Anomaly likelihood"
              level={selectedInv.risk_level}
              confidence={selectedInv.confidence_score}
              signals={selectedInv.contributing_signals}
              suggestedAction={selectedInv.recommended_action}
              actionButtonLabel="Authorize billing ledger adjustment"
              onPropose={handleProposeFix}
              isProposing={proposing}
              isPending={selectedInv.has_pending_recommendation}
              customMetric={`₹${selectedInv.leakage_amount.toLocaleString()}`}
              customMetricLabel="Quantified leakage"
            />
          )}
        </div>

      </div>
    </div>
  );
};
