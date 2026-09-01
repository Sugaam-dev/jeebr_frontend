import React from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';

export const ExplainabilityInspector = ({
  title,
  subtitle,
  score,
  scoreLabel = "Risk score",
  level = "High",
  confidence = 0.92,
  signals = [],
  suggestedAction,
  actionButtonLabel = "Propose action to governance",
  onPropose,
  isProposing = false,
  isPending = false,
  customMetric,
  customMetricLabel
}) => {
  const isCritical = score >= 60 || level === 'Critical';
  const isAlert = (score >= 35 && score < 60) || level === 'High';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 lg:p-6 space-y-4 card-shadow">
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-3.5 gap-2">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-500 font-mono truncate">{subtitle}</p>}
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] text-gray-500 font-medium">{scoreLabel}</div>
          <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
            <span className={`text-xl font-bold font-mono ${
              isCritical ? 'text-rose-600' : isAlert ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {score}%
            </span>
            <span className="text-[11px] font-mono text-gray-500">
              ({level})
            </span>
          </div>
        </div>
      </div>

      {/* Confidence & Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 border border-gray-200/80 rounded-lg p-2.5 flex items-center justify-between">
          <span className="text-gray-500">Model confidence</span>
          <span className="font-mono font-semibold text-gray-900">{(confidence * 100).toFixed(0)}%</span>
        </div>

        {customMetricLabel ? (
          <div className="bg-slate-50 border border-gray-200/80 rounded-lg p-2.5 flex items-center justify-between">
            <span className="text-gray-500 truncate mr-2">{customMetricLabel}</span>
            <span className="font-mono font-semibold text-gray-900 truncate">{customMetric}</span>
          </div>
        ) : (
          <div className="bg-slate-50 border border-gray-200/80 rounded-lg p-2.5 flex items-center justify-between">
            <span className="text-gray-500">Governance state</span>
            <span className={`font-mono text-xs font-semibold ${isPending ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isPending ? 'Pending sign-off' : 'Ready'}
            </span>
          </div>
        )}
      </div>

      {/* Contributing Signals Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider">
          <span>Contributing signals</span>
          <span>Weight</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {signals.map((sig, idx) => {
            const isPos = sig.impact_type === 'positive';
            const isNeg = sig.impact_type === 'negative';
            return (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 border border-gray-200/80 flex items-start justify-between gap-2 text-xs hover:bg-slate-100/60 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                    <span>{sig.signal}:</span>
                    <span className="font-mono text-gray-500 font-normal truncate">{sig.value}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 leading-snug">{sig.detail}</div>
                  {/* Visual weight bar */}
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.abs(parseFloat(sig.weight || 0) * 10)}%`,
                        minWidth: '8%',
                        backgroundColor: isNeg ? '#EF4444' : isPos ? '#10B981' : '#2463EB'
                      }}
                    />
                  </div>
                </div>

                <span className={`font-mono text-xs font-bold shrink-0 ml-2 ${
                  isNeg ? 'text-rose-600' : isPos ? 'text-emerald-600' : 'text-gray-600'
                }`}>
                  {sig.weight}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Action & 1-Click Governance Proposal */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#2463EB]" />
          <span>AI Recommended Action:</span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          {suggestedAction}
        </p>

        {isPending ? (
          <button
            disabled
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Action in governance queue</span>
          </button>
        ) : (
          <button
            disabled={isProposing}
            onClick={onPropose}
            className="w-full px-4 py-2.5 rounded-lg bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isProposing ? 'Submitting proposal...' : actionButtonLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
