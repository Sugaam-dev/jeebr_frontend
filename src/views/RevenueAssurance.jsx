import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExplainabilityInspector } from '../components/ExplainabilityInspector';
import { CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

export const RevenueAssurance = ({ onOpen360, onOpenGovernance }) => {
  const [leakages, setLeakages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);
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
    api.getRevenueLeakages(Boolean(force))
      .then((data) => {
        setLeakages(data);
        if (data.length > 0) {
          setSelectedInv((prev) => (prev ? data.find(d => d.invoice_id === prev.invoice_id) || data[0] : data[0]));
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

  const totalLeakage = leakages.reduce((sum, item) => sum + item.leakage_amount, 0);

  const handleProposeFix = async () => {
    if (!selectedInv) return;
    setProposing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const rec = await api.proposeRevenueRemediation(selectedInv.invoice_id);
      setSuccessMsg(`Billing remediation recommendation #${rec.id} submitted to governance queue.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit billing remediation');
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
            Revenue Assurance &amp; Billing Anomaly Detection
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Multi-signal scoring detecting catalog rate mismatches, duplicate credit adjustments, unbilled add-on usage, and dunning collection gaps.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Refreshing Ledger...' : 'Refresh Ledger'}</span>
          </button>

          <div className="text-left md:text-right bg-blue-50/60 border border-blue-100 px-4 py-2.5 rounded-xl">
            <div className="text-[10.5px] font-semibold text-gray-600 uppercase tracking-wider">Unrecovered leakage</div>
            <div className="text-xl font-bold text-gray-900 font-mono">&#8377;{totalLeakage.toLocaleString()}</div>
          </div>
        </div>
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

      {/* 2-Column Split: Anomaly Table + Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Anomaly Invoices Table */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Flagged billing anomaly ledger</span>
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">{leakages.length} anomalies scored</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Invoice &amp; subscriber</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Anomaly vector</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Leakage</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Anomaly score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {leakages.map((inv) => {
                  const isSelected = selectedInv?.invoice_id === inv.invoice_id;

                  return (
                    <tr
                      key={inv.invoice_id}
                      onClick={() => setSelectedInv(inv)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-bold text-gray-900">{inv.customer_name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{inv.invoice_code} &bull; {inv.locality}</div>
                      </td>
                      <td className="px-4 py-3.5 font-sans text-gray-700 font-medium">
                        {inv.anomaly_type}
                      </td>
                      <td className="px-4 py-3.5 text-rose-600 font-bold font-mono">
                        &#8377;{inv.leakage_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                          {inv.leakage_risk_score}%
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
