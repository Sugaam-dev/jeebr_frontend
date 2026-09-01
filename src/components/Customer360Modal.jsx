import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Sparkles, ExternalLink } from 'lucide-react';

export const Customer360Modal = ({ customerId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    api.getCustomer360(customerId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (!customerId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden modal-shadow">

        {/* Header */}
        <div className="bg-slate-50 border-b border-gray-200 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-gray-900">
                {loading ? 'Loading subscriber profile...' : data?.customer?.name}
              </h2>
              {data && (
                <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md font-semibold">
                  {data.customer.customer_code}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Unified CRM, NMS, billing, and retention intelligence</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs bg-[#F7F8FA]">
          {loading && (
            <div className="text-center py-12 text-gray-500 space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>Aggregating subscriber context from PostgreSQL...</div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Key Subscriber Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 card-shadow">
                  <div className="text-gray-500 text-[11px] font-medium">Plan &amp; ARPU</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">{data.customer.plan_name}</div>
                  <div className="font-mono text-gray-500 text-[11px] mt-0.5">&#8377;{data.customer.arpu.toLocaleString()}/mo</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-3.5 card-shadow">
                  <div className="text-gray-500 text-[11px] font-medium">Locality &amp; Node</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">{data.customer.locality}</div>
                  <div className="font-mono text-gray-500 text-[11px] mt-0.5">{data.node?.node_name || 'Unassigned'}</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-3.5 card-shadow">
                  <div className="text-gray-500 text-[11px] font-medium">Tenure &amp; NPS</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5 font-mono">{data.customer.tenure_months} months</div>
                  <div className="font-mono text-gray-500 text-[11px] mt-0.5">CSAT: {data.customer.nps_score}/10</div>
                </div>

                {/* Churn risk tile */}
                <div className={`rounded-xl p-3.5 border card-shadow ${
                  data.churn_risk_score >= 60
                    ? 'border-rose-300 bg-rose-50/70'
                    : 'border-emerald-300 bg-emerald-50/70'
                }`}>
                  <div className="text-gray-600 text-[11px] font-medium">AI Churn Risk Score</div>
                  <div className={`text-base font-bold font-mono mt-0.5 ${
                    data.churn_risk_score >= 60 ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {data.churn_risk_score}%
                  </div>
                  <div className="font-mono text-gray-600 text-[11px] mt-0.5">{data.churn_risk_level} risk level</div>
                </div>
              </div>

              {/* Next-Best-Action */}
              <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-1.5 card-shadow">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-blue-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommended Next-Best-Action:</span>
                  </span>
                  <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {(data.next_best_action.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {data.next_best_action.action}
                </div>
                <div className="text-xs text-gray-600">
                  <strong>Reason:</strong> {data.next_best_action.reason} &bull; <strong>Channel:</strong> {data.next_best_action.channel}
                </div>
              </div>

              {/* Contributing Churn Signals */}
              {data.churn_factors?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contributing churn factors (risk drivers)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {data.churn_factors.map((f, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between card-shadow">
                        <div>
                          <div className="font-semibold text-gray-900">{f.signal}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{f.detail}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono text-xs font-bold shrink-0 ml-2 border border-rose-200">
                          {f.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Network Node Telemetry */}
              {data.node && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Upstream node telemetry ({data.node.node_name})
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-gray-200 rounded-xl p-4 card-shadow">
                    <div>
                      <div className="text-gray-500 text-[11px]">Node health</div>
                      <div className="font-mono font-bold text-gray-900 mt-0.5">{data.node.health_score}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[11px]">Optical Rx power</div>
                      <div className="font-mono font-bold text-gray-900 mt-0.5">{data.node.optical_power_dbm} dBm</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[11px]">Utilization</div>
                      <div className="font-mono font-bold text-gray-900 mt-0.5">{data.node.utilization_pct}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[11px]">Active alarms</div>
                      <div className="font-mono font-bold text-amber-600 mt-0.5">{data.node.alarm_count} alarms</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tickets & Invoices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recent tickets ({data.recent_tickets?.length || 0})</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {data.recent_tickets?.map((t) => (
                      <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-2.5 card-shadow">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-gray-900 font-semibold">{t.ticket_code}</span>
                          <span className="text-gray-500">{t.status}</span>
                        </div>
                        <p className="text-gray-600 mt-0.5 text-[11px]">{t.description}</p>
                      </div>
                    ))}
                    {(!data.recent_tickets || data.recent_tickets.length === 0) && (
                      <div className="text-gray-500 py-2">No recent tickets logged.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recent invoices ({data.recent_invoices?.length || 0})</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {data.recent_invoices?.map((inv) => (
                      <div key={inv.id} className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-between font-mono card-shadow">
                        <div>
                          <div className="text-gray-900 font-semibold">{inv.invoice_code}</div>
                          <div className="text-[11px] text-gray-500">&#8377;{inv.billed_amount} ({inv.status})</div>
                        </div>
                        {inv.anomaly_flag && (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            {inv.anomaly_type || 'Anomaly'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors shadow-xs"
          >
            Close 360 view
          </button>
        </div>

      </div>
    </div>
  );
};
