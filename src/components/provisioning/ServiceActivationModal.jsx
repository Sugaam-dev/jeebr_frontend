import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Server, 
  Radio, 
  Clock, 
  IndianRupee, 
  Check, 
  Info,
  Loader2,
  HardDriveDownload,
  AlertCircle
} from 'lucide-react';

export const ServiceActivationModal = ({ 
  customer, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);

  // Fetch canonical catalog
  useEffect(() => {
    let isMounted = true;
    setLoadingPlans(true);
    api.getProvisioningPlans(customer?.account_type || null)
      .then((data) => {
        if (!isMounted) return;
        setPlans(data || []);
        if (data && data.length > 0) {
          setSelectedPlanId(data[0].plan_id);
        }
      })
      .catch((err) => {
        if (isMounted) setSubmitError(err.message || 'Failed to load plans');
      })
      .finally(() => {
        if (isMounted) setLoadingPlans(false);
      });

    return () => { isMounted = false; };
  }, [customer]);

  // Check pre-flight eligibility when plan changes
  useEffect(() => {
    if (!customer?.id || !selectedPlanId) return;

    let isMounted = true;
    setCheckingEligibility(true);
    setEligibilityError(null);
    setEligibility(null);

    api.getCustomerEligibility(customer.id, selectedPlanId)
      .then((res) => {
        if (!isMounted) return;
        setEligibility(res);
      })
      .catch((err) => {
        if (!isMounted) return;
        setEligibilityError(err.message || 'Eligibility check failed');
      })
      .finally(() => {
        if (isMounted) setCheckingEligibility(false);
      });

    return () => { isMounted = false; };
  }, [customer?.id, selectedPlanId]);

  const handleCreateOrder = async () => {
    if (!eligibility || !eligibility.eligible) return;

    setSubmitting(true);
    setSubmitError(null);

    // Generate unique client-side idempotency key
    const idempotencyKey = `ORD-${customer.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const order = await api.createProvisioningOrder({
        customer_id: customer.id,
        plan_id: selectedPlanId,
        idempotency_key: idempotencyKey,
        assigned_device_id: eligibility.suggested_device_id,
        assigned_device_code: eligibility.suggested_device_code,
        assigned_port_id: eligibility.suggested_port_id
      });
      setSuccessOrder(order);
      if (onSuccess) onSuccess(order);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create activation order');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.plan_id === selectedPlanId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-2xl">
              <Zap className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Service Activation &amp; Provisioning
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  SIMULATED
                </span>
              </h2>
              <p className="text-xs text-blue-200/80">
                Deterministic OLT/BNG/ONT automated delivery workflow
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Customer Profile Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-800 text-sm">
                {customer?.name || 'Customer'}
              </div>
              <div className="text-slate-500 font-mono mt-0.5">
                {customer?.customer_code || `ID: #${customer?.id}`} · {customer?.account_type || 'RESIDENTIAL'}
              </div>
              <div className="text-slate-500 mt-0.5">
                {customer?.address || customer?.locality || 'Address on file'}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Market: {(customer?.market_id || 'mumbai').toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                customer?.status === 'ACTIVE' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                CRM: {customer?.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          {/* Success State */}
          {successOrder ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-emerald-900">
                Service Activation Order Created!
              </h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Order <span className="font-mono font-bold">{successOrder.order_code}</span> has been created in status <span className="font-bold">{successOrder.status}</span>. Admin/NOC sign-off required prior to automated network dispatch.
              </p>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-left text-xs font-mono space-y-1 text-slate-700">
                <div>Order Code: <span className="font-bold text-slate-900">{successOrder.order_code}</span></div>
                <div>Status: <span className="font-bold text-blue-600">{successOrder.status}</span></div>
                <div>Plan: {successOrder.plan_name} (₹{successOrder.plan_price})</div>
                <div>Assigned Terminal: {successOrder.assigned_device_code || 'Pending assignment'}</div>
                <div>Telemetry Source: {successOrder.telemetry_source}</div>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Target Service Plan
                </label>
                {loadingPlans ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Loading canonical plan catalog...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {plans.map((p) => {
                      const isSelected = p.plan_id === selectedPlanId;
                      return (
                        <div
                          key={p.plan_id}
                          onClick={() => setSelectedPlanId(p.plan_id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-xs font-bold text-blue-700 flex items-center">
                              <IndianRupee className="w-3.5 h-3.5" />
                              {p.price_inr}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>Speed: <span className="font-semibold text-slate-700">{p.speed_mbps} Mbps</span> · Quota: {p.data_quota_gb} GB</div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                VLAN: {p.service_vlan}
                              </span>
                              <span className="capitalize text-slate-500">
                                {p.billing_type.toLowerCase()} · {p.validity_days}d
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pre-Flight Eligibility Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Network Pre-Flight Validation
                </label>
                {checkingEligibility ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Validating customer status, market boundary &amp; OLT capacity...</span>
                  </div>
                ) : eligibilityError ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Validation Error</div>
                      <div className="text-rose-700 mt-0.5">{eligibilityError}</div>
                    </div>
                  </div>
                ) : eligibility ? (
                  <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                    eligibility.eligible 
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {eligibility.eligible ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-900">Pre-Flight Approved: Eligible for Activation</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span className="text-rose-900">Pre-Flight Blocked: Activation Ineligible</span>
                          </>
                        )}
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-white/80 rounded border border-slate-200">
                        Market: {eligibility.market_id}
                      </span>
                    </div>

                    {/* Pre-flight Checks Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 bg-white/90 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500">Lifecycle Status:</span>{' '}
                        <span className="font-semibold">{eligibility.customer_lifecycle_status}</span>
                      </div>
                      <div className="p-2 bg-white/90 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500">Serviceability:</span>{' '}
                        <span className="font-semibold">{eligibility.serviceability_status || 'SERVICEABLE'}</span>
                      </div>
                      <div className="p-2 bg-white/90 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500">Upstream OLT:</span>{' '}
                        <span className="font-semibold font-mono">{eligibility.olt_device_code || 'Auto-allocated'}</span>
                      </div>
                      <div className="p-2 bg-white/90 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500">Assigned ONT/ONU:</span>{' '}
                        <span className="font-semibold font-mono">{eligibility.suggested_device_code || 'Auto-allocated'}</span>
                      </div>
                    </div>

                    {/* Blocking Errors */}
                    {eligibility.blocking_reasons && eligibility.blocking_reasons.length > 0 && (
                      <div className="mt-2 p-2.5 bg-rose-100/80 rounded-xl border border-rose-300 text-rose-900 text-xs">
                        <div className="font-bold flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                          Blocking Prerequisites:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {eligibility.blocking_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Simulation Transparency Banner */}
              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-2xl flex items-start gap-2.5 text-xs text-cyan-950">
                <Info className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <span className="font-bold">Transparent Simulation Environment:</span>
                  <p className="text-cyan-800">
                    This order will be processed via <span className="font-mono font-semibold">SyntheticProvisioningProvider</span> (Execution Mode: <span className="font-bold">SIMULATED</span>). No real network hardware, BNG or OLT will be altered. Real vendor adapters fail-closed when hardware is unconfigured.
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Actions */}
        {!successOrder && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={submitting || checkingEligibility || !eligibility?.eligible}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                submitting || checkingEligibility || !eligibility?.eligible
                  ? 'bg-slate-400 cursor-not-allowed opacity-70'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Order...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Submit Activation Request</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
