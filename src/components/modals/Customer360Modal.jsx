import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  X, 
  Sparkles, 
  Smartphone, 
  CreditCard, 
  Clock, 
  IndianRupee, 
  Info, 
  ExternalLink, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const Customer360Modal = ({ customerId, onClose }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArpuTooltip, setShowArpuTooltip] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    api.getCustomer360(customerId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (!customerId) return null;

  const isPrepaid = data?.customer?.customer_type === 'Prepaid';
  const isExpired = data?.customer?.days_to_expiry < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
      style={{ background: 'rgba(4, 14, 54, 0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden modal-shadow animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="bg-slate-50 border-b border-gray-200 p-4 sm:p-5 flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-bold text-gray-900 truncate">
                {loading ? 'Loading subscriber profile...' : data?.customer?.name}
              </h2>
              {data && (
                <>
                  <span className="text-xs font-mono text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md font-semibold">
                    {data.customer.customer_code}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isPrepaid 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {isPrepaid ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <CreditCard className="w-3 h-3 text-indigo-600" />}
                    <span>{data.customer.customer_type || 'Prepaid'} Subscriber</span>
                  </span>
                  {data.customer.status === 'At-Risk' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-3 h-3" />
                      At-Risk Churn
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              SentinelOS Correlated Subscriber 360 &bull; Network Telemetry &bull; Billing &bull; Autonomous Retention
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs bg-[#F5F8FF]">
          {loading && (
            <div className="text-center py-12 text-gray-500 space-y-2">
              <div className="w-6 h-6 border-2 border-[#2463EB] border-t-transparent rounded-full animate-spin mx-auto" />
              <div>Aggregating subscriber telemetry and ARPU calculations...</div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Key Subscriber Stats Row: Separate Plan Price vs Actual ARPU */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Plan Price / Pack Sticker Value */}
                {/* 1. Plan Value */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 card-shadow space-y-1">
                  <div className="text-gray-500 text-[11px] font-medium flex items-center justify-between">
                    <span>Plan Value</span>
                    <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="text-base font-extrabold text-gray-900 font-mono">
                    &#8377;{(data.customer.plan_price || data.customer.arpu).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate" title={data.customer.plan_name}>
                    {isPrepaid ? `${data.customer.recharge_validity_days || 28}d Pack Price` : 'Monthly Base Rental'}
                  </div>
                </div>

                {/* 2. Customer ARPU (30D) */}
                <div className="bg-white border-2 border-emerald-300 rounded-xl p-3.5 card-shadow space-y-1 relative bg-emerald-50/20">
                  <div className="text-emerald-800 text-[11px] font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      Customer ARPU (30D)
                      <button 
                        onClick={() => setShowArpuTooltip(!showArpuTooltip)}
                        className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
                        title="Customer ARPU (30D): Revenue generated by this subscriber over the last 30 days."
                      >
                        <HelpCircle className="w-3.5 h-3.5 inline" />
                      </button>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      30D
                    </span>
                  </div>
                  <div className="text-lg font-black text-emerald-800 font-mono">
                    &#8377;{(data.customer.revenue_30d || data.customer.actual_arpu || data.customer.arpu).toLocaleString()}
                    <span className="text-[10px] font-normal text-gray-500 ml-0.5">/mo</span>
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    {isPrepaid ? '30d Recognized + Boosters' : 'Billed Usage + Add-ons'}
                  </div>

                  {/* Info Tooltip Popup */}
                  {showArpuTooltip && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-20 p-3 bg-gray-900 text-white rounded-lg shadow-xl text-[11px] space-y-1">
                      <div className="font-bold text-emerald-300">Customer ARPU (30D):</div>
                      <div className="text-gray-300 text-[11px]">
                        Revenue generated by this subscriber over the last 30 days.
                      </div>
                      <div className="font-mono text-[10px] text-cyan-200 pt-1 border-t border-gray-700">
                        {isPrepaid 
                          ? `(Pack Price ₹${data.customer.plan_price || data.customer.arpu} ÷ ${data.customer.recharge_validity_days || 28}d × 30) + Booster Spend`
                          : `Monthly Billed Charges + Add-on Lines`}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Locality & Node */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 card-shadow space-y-1">
                  <div className="text-gray-500 text-[11px] font-medium">Locality &amp; Network Hub</div>
                  <div className="text-sm font-bold text-gray-900 truncate">{data.customer.locality}</div>
                  <div className="font-mono text-gray-500 text-[11px] truncate flex items-center justify-between">
                    <span>{data.node?.node_name || 'Unassigned'}</span>
                    {data.node && (
                      <span className={`px-1 rounded text-[10px] font-bold ${
                        data.node.health_score < 70 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {data.node.health_score}%
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Tenure & NPS CSAT */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 card-shadow space-y-1">
                  <div className="text-gray-500 text-[11px] font-medium">Tenure &amp; CSAT Sentiment</div>
                  <div className="text-sm font-bold text-gray-900 font-mono">{data.customer.tenure_months} months</div>
                  <div className="font-mono text-gray-500 text-[11px]">
                    NPS: <span className="font-bold text-gray-900">{data.customer.nps_score}/10</span> ({data.customer.nps_score >= 8 ? 'Promoter' : data.customer.nps_score <= 5 ? 'Detractor' : 'Passive'})
                  </div>
                </div>

                {/* 5. Churn Risk Score */}
                <div className={`rounded-xl p-3.5 border card-shadow space-y-1 ${
                  data.churn_risk_score >= 60
                    ? 'border-rose-300 bg-rose-50/70'
                    : 'border-emerald-300 bg-emerald-50/70'
                }`}>
                  <div className="text-gray-600 text-[11px] font-medium">AI Churn Propensity</div>
                  <div className={`text-base font-bold font-mono ${
                    data.churn_risk_score >= 60 ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {data.churn_risk_score}%
                  </div>
                  <div className="font-mono text-gray-600 text-[11px] flex items-center justify-between">
                    <span>{data.churn_risk_level} Risk</span>
                    {data.churn_risk_score >= 40 && (
                      <button
                        onClick={() => {
                          onClose();
                          navigate('/churn');
                        }}
                        className="text-blue-600 hover:underline font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Prepaid Mobile Telemetry Card (Daily Quota + Validity Expiry Countdown) */}
              {isPrepaid && (
                <div className="bg-white border border-emerald-200 rounded-xl p-4 card-shadow space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-xs">Prepaid Pack Behavioral Telemetry</span>
                        <span className="text-[11px] text-gray-500 ml-2">Indian Telecom Standard FUP &amp; Recharge Tracking</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isExpired 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : data.customer.days_to_expiry <= 2 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {isExpired ? `Overdue (Grace Period - ${Math.abs(data.customer.days_to_expiry)}d ago)` : `Validity: ${data.customer.days_to_expiry} Days Remaining`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Daily FUP Data Consumption Meter */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 font-medium">Daily High-Speed Data FUP</span>
                        <span className="font-mono font-bold text-gray-900">
                          {data.customer.daily_data_used_gb || 0.8} / {data.customer.daily_data_quota_gb || 1.5} GB
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, ((data.customer.daily_data_used_gb || 0.8) / (data.customer.daily_data_quota_gb || 1.5)) * 100)}%` }}
                          className={`h-full rounded-full transition-all ${
                            (data.customer.daily_data_used_gb || 0.8) >= (data.customer.daily_data_quota_gb || 1.5) * 0.9
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {(data.customer.daily_data_used_gb || 0.8) >= (data.customer.daily_data_quota_gb || 1.5) * 0.9 
                          ? '⚠️ Quota exhausted; throttled to 64 Kbps' 
                          : 'High-speed 5G connectivity active'}
                      </span>
                    </div>

                    {/* Validity Pack Details */}
                    <div className="bg-slate-50 rounded-lg p-2.5 space-y-1">
                      <span className="text-gray-500 text-[10px] block uppercase font-semibold">Active Base Pack</span>
                      <div className="font-bold text-gray-900 text-xs truncate">{data.customer.plan_name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Valid for {data.customer.recharge_validity_days || 28} calendar days
                      </div>
                    </div>

                    {/* Last Recharge Channel */}
                    <div className="bg-slate-50 rounded-lg p-2.5 space-y-1">
                      <span className="text-gray-500 text-[10px] block uppercase font-semibold">Last Recharge &amp; Method</span>
                      <div className="font-bold text-emerald-800 text-xs font-mono">
                        &#8377;{data.customer.last_recharge_amount || data.customer.plan_price}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Via {data.customer.payment_method || 'UPI (PhonePe)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Next-Best-Action Banner */}
              <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-2 card-shadow">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-[#2463EB] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommended Next-Best-Action (Stage: {data.customer.current_stage || 'Use'}):</span>
                  </span>
                  <span className="font-mono bg-blue-50 text-[#2463EB] px-2 py-0.5 rounded-full font-semibold">
                    {(data.next_best_action.confidence * 100).toFixed(0)}% AI confidence
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {data.next_best_action.action}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100 flex-wrap gap-2">
                  <div>
                    <strong>Reason:</strong> {data.next_best_action.reason} &bull; <strong>Channel:</strong> {data.next_best_action.channel}
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/journeys');
                    }}
                    className="text-[#2463EB] hover:underline font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in Journeys</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Contributing Churn Signals */}
              {data.churn_factors?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span>Contributing Risk Drivers &amp; Telemetry Signals</span>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/churn');
                      }}
                      className="text-blue-600 hover:underline normal-case text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Churn Explainability Engine</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
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

              {/* Upstream Network Node Telemetry */}
              {data.node && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span>Upstream Node Telemetry ({data.node.node_name} &bull; {data.node.area})</span>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/assurance');
                      }}
                      className="text-blue-600 hover:underline normal-case text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Predictive Service Assurance</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-gray-200 rounded-xl p-4 card-shadow">
                    <div>
                      <div className="text-gray-500 text-[11px]">Node health</div>
                      <div className={`font-mono font-bold mt-0.5 ${
                        data.node.health_score < 70 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {data.node.health_score}% ({data.node.status})
                      </div>
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

              {/* Tickets & Recharge/Billing Records */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tickets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span>Recent Incidents / Tickets ({data.recent_tickets?.length || 0})</span>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/orchestration');
                      }}
                      className="text-blue-600 hover:underline normal-case text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>OSS Queue</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {data.recent_tickets?.map((t) => (
                      <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-2.5 card-shadow">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-gray-900 font-semibold">{t.ticket_code}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            t.status === 'Open' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-0.5 text-[11px]">{t.description}</p>
                      </div>
                    ))}
                    {(!data.recent_tickets || data.recent_tickets.length === 0) && (
                      <div className="text-gray-500 py-2">No recent tickets logged.</div>
                    )}
                  </div>
                </div>

                {/* Recharge / Invoices */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span>{isPrepaid ? 'Recharges & Booster Add-ons' : 'Billing Ledger & Invoices'}</span>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/revenue');
                      }}
                      className="text-blue-600 hover:underline normal-case text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Revenue Assurance</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {data.recent_invoices?.map((inv) => (
                      <div key={inv.id} className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-between font-mono card-shadow">
                        <div>
                          <div className="text-gray-900 font-semibold flex items-center gap-2">
                            <span>{inv.invoice_code}</span>
                            <span className="text-[10px] font-sans text-gray-400">
                              {inv.transaction_type || (isPrepaid ? 'Pack Recharge' : 'Monthly Bill')}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            &#8377;{inv.billed_amount} &bull; {inv.payment_method || 'UPI'} &bull; {inv.status}
                          </div>
                        </div>
                        {inv.anomaly_flag && (
                          <span 
                            onClick={() => {
                              onClose();
                              navigate('/revenue');
                            }}
                            className="text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer flex items-center gap-1"
                            title="Click to view in Revenue Assurance"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            <span>{inv.anomaly_type || 'Leakage'}</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cross-Module Quick Jump Bar */}
              <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-semibold text-gray-700">Quick Module Jump:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/churn');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors cursor-pointer"
                  >
                    Churn Prediction
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/journeys');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors cursor-pointer"
                  >
                    Customer Journeys
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/revenue');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 hover:text-amber-700 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors cursor-pointer"
                  >
                    Revenue Assurance
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/assurance');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors cursor-pointer"
                  >
                    Service Assurance
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-gray-500 font-medium">
            PMRG Telecom Cognitive Operations POC &bull; 70% Prepaid / 30% Postpaid
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
