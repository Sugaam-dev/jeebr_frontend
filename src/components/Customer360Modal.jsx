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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2C303C] flex items-center justify-between bg-[#14161C]">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-[#EDEBE6]">
                {loading ? 'Loading subscriber profile...' : data?.customer?.name}
              </h2>
              {data && (
                <span className="text-xs font-mono text-[#8B8F99]">
                  {data.customer.customer_code}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8B8F99]">Unified CRM, NMS, billing, and retention intelligence</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#8B8F99] hover:text-[#EDEBE6] hover:bg-[#232733] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading && (
            <div className="text-center py-12 text-[#8B8F99] space-y-2">
              <div className="w-6 h-6 border-2 border-[#4FAE8C] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>Aggregating subscriber context from PostgreSQL...</div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-[#232733] border border-[#C1514B] text-[#C1514B]">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Key Subscriber Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded bg-[#14161C] border border-[#2C303C]">
                  <div className="text-[#8B8F99]">Plan & ARPU</div>
                  <div className="text-sm font-semibold text-[#EDEBE6] mt-0.5">{data.customer.plan_name}</div>
                  <div className="font-mono text-[#8B8F99] mt-0.5">&#8377;{data.customer.arpu.toLocaleString()}/mo</div>
                </div>

                <div className="p-3 rounded bg-[#14161C] border border-[#2C303C]">
                  <div className="text-[#8B8F99]">Locality & Node</div>
                  <div className="text-sm font-semibold text-[#EDEBE6] mt-0.5">{data.customer.locality}</div>
                  <div className="font-mono text-[#8B8F99] mt-0.5">{data.node?.node_name || 'Unassigned'}</div>
                </div>

                <div className="p-3 rounded bg-[#14161C] border border-[#2C303C]">
                  <div className="text-[#8B8F99]">Tenure & NPS</div>
                  <div className="text-sm font-semibold text-[#EDEBE6] mt-0.5 font-mono">{data.customer.tenure_months} months</div>
                  <div className="font-mono text-[#8B8F99] mt-0.5">CSAT: {data.customer.nps_score}/10</div>
                </div>

                <div className="p-3 rounded bg-[#232733] border border-[#2C303C]">
                  <div className="text-[#8B8F99]">AI Churn Risk Score</div>
                  <div className={`text-base font-bold font-mono mt-0.5 ${
                    data.churn_risk_score >= 60 ? 'text-[#C1514B]' : 'text-[#4FAE8C]'
                  }`}>
                    {data.churn_risk_score}%
                  </div>
                  <div className="text-[#8B8F99]">{data.churn_risk_level} risk level</div>
                </div>
              </div>

              {/* Next-Best-Action */}
              <div className="p-4 rounded bg-[#14161C] border border-[#2C303C] space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#8B8F99]">
                  <span className="font-medium text-[#EDEBE6]">Recommended Next-Best-Action:</span>
                  <span className="font-mono">{(data.next_best_action.confidence * 100).toFixed(0)}% confidence</span>
                </div>
                <div className="text-sm font-medium text-[#EDEBE6]">
                  {data.next_best_action.action}
                </div>
                <div className="text-xs text-[#8B8F99]">
                  <strong>Reason:</strong> {data.next_best_action.reason} &bull; <strong>Channel:</strong> {data.next_best_action.channel}
                </div>
              </div>

              {/* Contributing Churn Signals */}
              {data.churn_factors?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#8B8F99]">
                    Contributing churn factors (risk drivers)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.churn_factors.map((f, i) => (
                      <div key={i} className="p-2.5 rounded bg-[#14161C] border border-[#2C303C] flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[#EDEBE6]">{f.signal}</div>
                          <div className="text-[11px] text-[#8B8F99] mt-0.5">{f.detail}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#232733] text-[#C1514B] font-mono text-xs font-semibold shrink-0 ml-2">
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
                  <div className="text-xs font-medium text-[#8B8F99]">
                    Upstream node telemetry ({data.node.node_name})
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded bg-[#14161C] border border-[#2C303C]">
                    <div>
                      <div className="text-[#8B8F99]">Node health</div>
                      <div className="font-mono font-semibold text-[#EDEBE6] mt-0.5">{data.node.health_score}%</div>
                    </div>
                    <div>
                      <div className="text-[#8B8F99]">Optical Rx power</div>
                      <div className="font-mono font-semibold text-[#EDEBE6] mt-0.5">{data.node.optical_power_dbm} dBm</div>
                    </div>
                    <div>
                      <div className="text-[#8B8F99]">Utilization</div>
                      <div className="font-mono font-semibold text-[#EDEBE6] mt-0.5">{data.node.utilization_pct}%</div>
                    </div>
                    <div>
                      <div className="text-[#8B8F99]">Active alarms</div>
                      <div className="font-mono font-semibold text-[#C9822E] mt-0.5">{data.node.alarm_count} alarms</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tickets & Invoices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#8B8F99]">Recent tickets ({data.recent_tickets?.length || 0})</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {data.recent_tickets?.map((t) => (
                      <div key={t.id} className="p-2 rounded bg-[#14161C] border border-[#2C303C]">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-[#EDEBE6]">{t.ticket_code}</span>
                          <span className="text-[#8B8F99]">{t.status}</span>
                        </div>
                        <p className="text-[#8B8F99] mt-0.5 text-[11px]">{t.description}</p>
                      </div>
                    ))}
                    {(!data.recent_tickets || data.recent_tickets.length === 0) && (
                      <div className="text-[#8B8F99] py-2">No recent tickets logged.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#8B8F99]">Recent invoices ({data.recent_invoices?.length || 0})</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {data.recent_invoices?.map((inv) => (
                      <div key={inv.id} className="p-2 rounded bg-[#14161C] border border-[#2C303C] flex items-center justify-between font-mono">
                        <div>
                          <div className="text-[#EDEBE6]">{inv.invoice_code}</div>
                          <div className="text-[11px] text-[#8B8F99]">&#8377;{inv.billed_amount} ({inv.status})</div>
                        </div>
                        {inv.anomaly_flag && (
                          <span className="text-[#C9822E] text-[11px]">
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
        <div className="p-3 border-t border-[#2C303C] bg-[#14161C] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#232733] hover:bg-[#2C303C] text-xs font-medium text-[#EDEBE6] transition-colors border border-[#2C303C]"
          >
            Close 360 view
          </button>
        </div>

      </div>
    </div>
  );
};
