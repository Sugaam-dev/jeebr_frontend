import React from 'react';
import { MapPin, ShieldCheck, AlertTriangle, X } from 'lucide-react';

export const LocationConsentModal = ({ isOpen, onClose, onAllow, job }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <MapPin className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Location Access Required</h3>
            <p className="text-xs text-slate-400">Live Field Engineer GPS Handshake</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Sentinel OS requires access to your device GPS location while you are in transit handling this workorder:
          </p>
          {job && (
            <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-700/50 flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Workorder:</span>
                <span className="font-semibold text-blue-300">{job.ticket_code || `#${job.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="font-semibold text-slate-200">{job.customer_locality || job.service_address || 'Customer Premise'}</span>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 text-amber-300/90 text-[11px] pt-1">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>
              Your real-time location will only be visible to authorized NOC dispatch personnel and the verified customer linked to this ticket during active transit.
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Tracking automatically stops upon arrival or ticket closure.</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>Allow & Start Tracking</span>
          </button>
        </div>
      </div>
    </div>
  );
};
