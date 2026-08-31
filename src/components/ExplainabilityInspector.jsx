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
  const isAlert = score >= 35 && score < 60 || level === 'High';

  return (
    <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-5 space-y-4">
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-[#2C303C] pb-3.5">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-[#EDEBE6]">{title}</h3>
          {subtitle && <p className="text-xs text-[#8B8F99] font-mono">{subtitle}</p>}
        </div>

        <div className="text-right">
          <div className="text-xs text-[#8B8F99]">{scoreLabel}</div>
          <div className="flex items-baseline justify-end space-x-1.5 mt-0.5">
            <span className={`text-lg font-bold font-mono ${
              isCritical ? 'text-[#C1514B]' : isAlert ? 'text-[#C9822E]' : 'text-[#4FAE8C]'
            }`}>
              {score}%
            </span>
            <span className="text-xs font-mono text-[#8B8F99]">
              ({level})
            </span>
          </div>
        </div>
      </div>

      {/* Confidence & Metrics Strip */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-[#14161C] border border-[#2C303C] flex items-center justify-between">
          <span className="text-[#8B8F99]">Model confidence</span>
          <span className="font-mono font-semibold text-[#EDEBE6]">{(confidence * 100).toFixed(0)}%</span>
        </div>

        {customMetricLabel ? (
          <div className="p-2 rounded bg-[#14161C] border border-[#2C303C] flex items-center justify-between">
            <span className="text-[#8B8F99]">{customMetricLabel}</span>
            <span className="font-mono font-semibold text-[#EDEBE6]">{customMetric}</span>
          </div>
        ) : (
          <div className="p-2 rounded bg-[#14161C] border border-[#2C303C] flex items-center justify-between">
            <span className="text-[#8B8F99]">Governance state</span>
            <span className={`font-mono text-xs ${isPending ? 'text-[#C9822E]' : 'text-[#8B8F99]'}`}>
              {isPending ? 'Pending sign-off' : 'Ready'}
            </span>
          </div>
        )}
      </div>

      {/* Contributing Signals Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-[#8B8F99]">
          <span>Contributing signals</span>
          <span>Weight</span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {signals.map((sig, idx) => {
            const isPos = sig.impact_type === 'positive';
            const isNeg = sig.impact_type === 'negative';
            return (
              <div 
                key={idx} 
                className="p-2.5 rounded bg-[#14161C] border border-[#2C303C] flex items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-medium text-[#EDEBE6] truncate flex items-center space-x-1.5">
                    <span>{sig.signal}:</span>
                    <span className="font-mono text-[#8B8F99] font-normal">{sig.value}</span>
                  </div>
                  <div className="text-[11px] text-[#8B8F99] leading-snug">{sig.detail}</div>
                </div>

                <span className={`font-mono text-xs font-semibold shrink-0 ml-2 ${
                  isNeg ? 'text-[#C1514B]' : isPos ? 'text-[#4FAE8C]' : 'text-[#8B8F99]'
                }`}>
                  {sig.weight}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Action & 1-Click Governance Proposal */}
      <div className="p-3.5 rounded bg-[#232733] border border-[#2C303C] space-y-2.5">
        <div className="text-xs font-medium text-[#EDEBE6]">
          AI recommended action:
        </div>

        <p className="text-xs text-[#8B8F99] leading-relaxed">
          {suggestedAction}
        </p>

        <button
          disabled={isProposing || isPending}
          onClick={onPropose}
          className={`w-full py-2 rounded text-xs font-semibold transition-colors flex items-center justify-center space-x-2 ${
            isPending
              ? 'bg-[#14161C] text-[#8B8F99] cursor-not-allowed border border-[#2C303C]'
              : 'bg-[#1C1F27] hover:bg-[#2C303C] text-[#EDEBE6] border border-[#2C303C]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#C9822E]" />
          <span>{isProposing ? 'Submitting proposal...' : isPending ? 'Action in governance queue' : actionButtonLabel}</span>
        </button>
      </div>
    </div>
  );
};
