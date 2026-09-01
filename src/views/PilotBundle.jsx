import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, Radio, UserMinus, Compass, ShieldAlert, GitBranch, 
  CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, Zap, Activity,
  ExternalLink, Layers, Terminal, AlertTriangle, ChevronRight, Check
} from 'lucide-react';

export const PilotBundle = ({ onOpen360, onOpenGovernance }) => {
  const { user } = useAuth();
  const [scenarioData, setScenarioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [approvingModule, setApprovingModule] = useState(null);
  const [actionSuccess, setActionSuccess] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = (force = false) => {
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');
    api.getPilotBundleScenario('OLT-BND-01', Boolean(force))
      .then(setScenarioData)
      .catch((err) => setErrorMsg(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveRecommendation = async (recId, moduleName) => {
    setApprovingModule(moduleName);
    setErrorMsg('');
    try {
      await api.approveRecommendation(recId, `Pilot Bundle 1-Click Approved by ${user?.full_name} (${user?.role})`);
      setActionSuccess((prev) => ({ ...prev, [moduleName]: true }));
      loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Approval failed');
    } finally {
      setApprovingModule(null);
    }
  };

  const loopPhases = [
    { num: 1, name: 'Observe', label: 'Network Telemetry', icon: Radio, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { num: 2, name: 'Predict', label: 'Churn Risk Correlation', icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { num: 3, name: 'Recommend', label: 'Journey Next-Best-Action', icon: Compass, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { num: 4, name: 'Approve', label: 'Human Governance Sign-Off', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { num: 5, name: 'Execute', label: 'Downstream Orchestration', icon: GitBranch, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { num: 6, name: 'Learn', label: 'Closed-Loop Telemetry', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  ];

  if (loading && !scenarioData) {
    return (
      <div className="p-12 text-center text-gray-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
        <span>Loading connected pilot bundle scenario from PostgreSQL...</span>
      </div>
    );
  }

  const currentTraceStep = scenarioData?.trace_steps?.find((s) => s.step_number === activeStep) || scenarioData?.trace_steps?.[0];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0B1E3D] to-[#173868] rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recommended Pilot Bundle</span>
            </span>
            <span className="text-xs font-mono text-slate-300">Live Operating Loop Trace</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            End-to-End Governed AI Overlay: Single Incident Narrative
          </h1>

          <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Demonstrating how PMRG AI Overlay seamlessly connects physical fiber telemetry degradation, downstream subscriber churn scoring, next-best-action mapping, human sign-off, and simulated execution into one closed loop:
          </p>

          {/* Operating Loop Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            {loopPhases.map((phase, idx) => (
              <React.Fragment key={phase.name}>
                <button
                  onClick={() => setActiveStep(phase.num)}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeStep === phase.num
                      ? 'bg-white text-gray-900 shadow-md font-bold ring-2 ring-blue-400'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-blue-600/40 text-[10px] flex items-center justify-center font-mono">
                    {phase.num}
                  </span>
                  <span>{phase.name}</span>
                </button>
                {idx < loopPhases.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Incident Case Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Active Pilot Scenario</div>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">{scenarioData?.scenario_title}</h2>
            <p className="text-xs text-gray-500 mt-0.5 max-w-3xl leading-snug">
              {scenarioData?.scenario_summary}
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{refreshing ? 'Refreshing Trace...' : 'Refresh Trace'}</span>
        </button>
      </div>

      {/* Main 2-Column Trace View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Vertical Step Sequence */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-1">
            Loop Sequence (Click to inspect)
          </div>

          <div className="space-y-2.5">
            {scenarioData?.trace_steps?.map((step) => {
              const phase = loopPhases[step.step_number - 1];
              const isCurrent = activeStep === step.step_number;
              const Icon = phase?.icon || Activity;

              return (
                <button
                  key={step.step_number}
                  onClick={() => setActiveStep(step.step_number)}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                    isCurrent
                      ? 'bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300 card-shadow'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${phase?.bg} ${phase?.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${phase?.color}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${phase?.color}`}>
                        Step {step.step_number}: {step.loop_phase}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {step.module_name.split(' ')[0]}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 truncate mt-0.5">{step.title}</h3>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">{step.entity_label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Trace Phase Inspector */}
        <div className="lg:col-span-8 space-y-6">
          {currentTraceStep && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 card-shadow">
              
              {/* Header of Active Step */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                      Loop Phase {currentTraceStep.step_number}/6 &bull; {currentTraceStep.loop_phase}
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      Module: {currentTraceStep.module_name}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{currentTraceStep.title}</h2>
                  <p className="text-xs text-gray-500 font-mono">{currentTraceStep.subtitle}</p>
                </div>

                <div className="text-right shrink-0 bg-slate-50 border border-gray-200 p-3 rounded-xl">
                  <div className="text-[11px] text-gray-500 font-medium">{currentTraceStep.primary_metric_label}</div>
                  <div className="text-lg font-bold font-mono text-blue-600 mt-0.5">
                    {currentTraceStep.primary_metric}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono">
                    {(currentTraceStep.confidence_score * 100).toFixed(0)}% Confidence
                  </div>
                </div>
              </div>

              {/* Narrative Description */}
              <div className="p-4 rounded-xl bg-slate-50 border border-gray-200/80 text-xs text-gray-700 leading-relaxed space-y-1.5">
                <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Governed AI Operating Narrative</span>
                </div>
                <p>{currentTraceStep.description}</p>
              </div>

              {/* Signals Evaluated in this Phase */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Signals Evaluated &amp; Telemetry Factors
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentTraceStep.signals.map((sig, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-gray-200/90 shadow-xs space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-gray-900">
                        <span>{sig.signal || sig.domain || sig.system || sig.metric || Object.keys(sig)[0]}</span>
                        <span className="font-mono text-blue-600 text-[11px]">
                          {sig.value || sig.status || sig.action || sig.before || Object.values(sig)[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug">
                        {sig.detail || sig.target || (sig.after ? `Result: ${sig.after}` : '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Actions for this Phase */}
              {activeStep === 4 ? (
                /* Step 4: Governance Dual Sign-off Interactive Section */
                <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Governance Dual-Domain Approval Queue</span>
                    </div>
                    <span className="text-xs font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                      2 Actions Awaiting Sign-Off
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* NOC Sign-off */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">1. Network Field Dispatch</span>
                        <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold">NOC Role</span>
                      </div>
                      <p className="text-[11px] text-gray-600">Dispatch field splicing crew to Bandra Central Hub for optical attenuation calibration.</p>
                      
                      {actionSuccess['Assurance'] ? (
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Field dispatch approved &amp; executed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApproveRecommendation(1, 'Assurance')}
                          disabled={approvingModule === 'Assurance'}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{approvingModule === 'Assurance' ? 'Executing...' : 'Approve field dispatch'}</span>
                        </button>
                      )}
                    </div>

                    {/* Care Sign-off */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">2. Customer Retention &amp; NBA</span>
                        <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-semibold">Care Role</span>
                      </div>
                      <p className="text-[11px] text-gray-600">Apply proactive INR 250 SLA downtime credit + schedule VIP relationship manager outreach.</p>
                      
                      {actionSuccess['Journey'] ? (
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Customer save offer approved &amp; sent</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApproveRecommendation(2, 'Journey')}
                          disabled={approvingModule === 'Journey'}
                          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{approvingModule === 'Journey' ? 'Executing...' : 'Approve retention offer'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : currentTraceStep.execution_receipt ? (
                /* Execution Receipt Terminal Block */
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Downstream Execution Receipt &amp; Telemetry State</span>
                  </div>

                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner space-y-1">
                    <div className="text-slate-400">// PostgreSQL Immutable Audit Record //</div>
                    <pre>{JSON.stringify(currentTraceStep.execution_receipt, null, 2)}</pre>
                  </div>
                </div>
              ) : null}

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
                <button
                  onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                  disabled={activeStep === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  &larr; Previous Loop Step
                </button>

                <div className="flex items-center gap-3">
                  {scenarioData?.impacted_customer?.id && (
                    <button
                      onClick={() => onOpen360(scenarioData.impacted_customer.id)}
                      className="px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Customer 360</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveStep(Math.min(6, activeStep + 1))}
                    disabled={activeStep === 6}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <span>Next Loop Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
