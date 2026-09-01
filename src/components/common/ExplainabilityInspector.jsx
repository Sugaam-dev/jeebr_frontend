import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  X, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);

  const isCritical = score >= 60 || level === 'Critical';
  const isAlert = (score >= 35 && score < 60) || level === 'High';

  const inspectorContent = (isModal = false) => (
    <div className={`space-y-4 text-slate-800 font-sans ${isModal ? 'p-6 sm:p-8 max-h-[85vh] overflow-y-auto' : ''}`}>
      
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-slate-900 ${isModal ? 'text-lg sm:text-xl' : 'text-sm'}`}>
              {title}
            </h3>
            {!isModal && (
              <button
                onClick={() => setIsExpanded(true)}
                title="Maximize & view full details"
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium font-mono break-words">
              {subtitle}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{scoreLabel}</div>
          <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
            <span className={`font-extrabold font-mono ${
              isModal ? 'text-2xl sm:text-3xl' : 'text-xl'
            } ${
              isCritical ? 'text-rose-600' : isAlert ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {score}%
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              ({level})
            </span>
          </div>
        </div>
      </div>

      {/* Confidence & Metrics Strip */}
      <div className={`grid gap-2.5 text-xs ${isModal ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <span className="text-slate-500 font-medium">Model confidence</span>
          <span className="font-mono font-bold text-slate-900 text-xs">{(confidence * 100).toFixed(0)}%</span>
        </div>

        {customMetricLabel && (
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
            <span className="text-slate-500 font-medium mr-2">{customMetricLabel}</span>
            <span className="font-mono font-bold text-blue-700 text-xs">{customMetric}</span>
          </div>
        )}

        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <span className="text-slate-500 font-medium">Governance state</span>
          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
            isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {isPending ? 'Pending sign-off' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Contributing Signals Breakdown - Full Clarity without text truncation */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Contributing signals ({signals.length})</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">Click signal for details</span>
        </div>

        <div className={`space-y-2.5 ${isModal ? 'max-h-[380px]' : 'max-h-64'} overflow-y-auto pr-1`}>
          {signals.map((sig, idx) => {
            const isPos = sig.impact_type === 'positive';
            const isNeg = sig.impact_type === 'negative';
            const isSelected = selectedSignal === idx;

            return (
              <div
                key={idx}
                onClick={() => setSelectedSignal(isSelected ? null : idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300/50 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-xs flex flex-wrap items-center gap-1.5 leading-snug">
                      <span>{sig.signal}:</span>
                      <span className="font-mono text-blue-700 bg-blue-100/50 px-1.5 py-0.2 rounded font-semibold break-all">
                        {sig.value}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed break-words font-normal">
                      {sig.detail}
                    </p>
                  </div>

                  <span className={`font-mono text-xs font-bold shrink-0 px-2 py-0.5 rounded-md ${
                    isNeg ? 'bg-rose-100 text-rose-700' : isPos ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {sig.weight}
                  </span>
                </div>

                {/* Weight bar */}
                <div className="mt-2.5 h-1.5 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(12, Math.abs(parseFloat(sig.weight || 0) * 8)))}%`,
                      backgroundColor: isNeg ? '#EF4444' : isPos ? '#10B981' : '#2563EB'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Action & 1-Click Governance Proposal */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="uppercase tracking-wider text-[11px] text-blue-900 font-extrabold">AI Recommended Action:</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium break-words">
          {suggestedAction}
        </p>

        <div className="pt-1">
          {isPending ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Action already in governance queue</span>
            </button>
          ) : (
            <button
              disabled={isProposing}
              onClick={onPropose}
              className="w-full px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isProposing ? 'Submitting proposal...' : actionButtonLabel}</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Standard In-Page Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 lg:p-6 card-shadow relative">
        {inspectorContent(false)}
      </div>

      {/* Full Expanded / Maximized Modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setIsExpanded(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full relative overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Top Header Bar */}
            <div className="h-14 bg-gradient-to-r from-[#142C6F] to-[#1E3A8A] text-white px-6 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Activity className="w-4 h-4 text-cyan-300" />
                <span>Explainability Signal Inspector &bull; Full View</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {inspectorContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
