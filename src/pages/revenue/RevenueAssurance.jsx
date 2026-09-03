import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { ExplainabilityInspector } from '../../components/common/ExplainabilityInspector';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { CheckCircle2, ArrowRight, RefreshCw, ExternalLink, IndianRupee, AlertTriangle } from 'lucide-react';

export const RevenueAssurance = () => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const onOpen360 = outletCtx?.onOpen360;

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
      setSuccessMsg(`Billing remediation recommendation #${rec.id} submitted to SentinelOS governance queue.`);
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit billing remediation');
    } finally {
      setProposing(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs 
        items={[{ label: 'Revenue Assurance & Billing Analytics', icon: IndianRupee }]} 
        backTo="/cockpit" 
        backLabel="Executive Cockpit" 
      />

      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB]">Scored Intelligence Engine</div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Revenue Assurance &amp; Billing Anomaly Detection
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Multi-signal scoring detecting catalog rate mismatches, duplicate credit adjustments, unbilled add-on usage, and dunning collection gaps.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-[#2463EB]' : ''}`} />
            <span>{refreshing ? 'Refreshing Ledger...' : 'Refresh Ledger'}</span>
          </button>

          <div className="text-left md:text-right bg-blue-50/60 border border-blue-100 px-4 py-2 rounded-xl">
            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Unrecovered Leakage</div>
            <div className="text-lg font-bold text-gray-900 font-mono">&#8377;{totalLeakage.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => navigate('/governance')}
            className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        
        {/* Left Column: Anomaly Invoices Table */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Flagged Billing Anomaly Ledger</span>
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">{leakages.length} anomalies scored</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Invoice &amp; Subscriber</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Anomaly Vector</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Leakage</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Anomaly Score</th>
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
                          ? 'bg-blue-50/70 border-l-4 border-l-[#2463EB]'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{inv.customer_name}</span>
                          {onOpen360 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpen360(inv.customer_id);
                              }}
                              className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Open Customer 360"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
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
        <div className="lg:col-span-5 space-y-3">
          {selectedInv && (
            <>
              {onOpen360 && (
                <button
                  onClick={() => onOpen360(selectedInv.customer_id)}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-blue-600 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Open Full Customer 360 Profile ({selectedInv.customer_name})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

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
            </>
          )}
        </div>

      </div>
    </div>
  );
};
