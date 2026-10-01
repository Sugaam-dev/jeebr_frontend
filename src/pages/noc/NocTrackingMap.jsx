/**
 * NOC Engineer Tracking Map — Phase 7A
 *
 * Professional telecom NOC-style live operations map for:
 *   SUPER_ADMIN · Admin · NOC
 *
 * Architecture:
 *  - Consumes existing backend GPS/SSE APIs (no new data sources)
 *  - Supports Google Maps AND MapLibre/OpenFreeMap — switchable in-UI
 *  - Real-time SSE-driven engineer marker updates
 *  - Engineer detail panel populated from real backend data
 *  - Customer/job detail panel populated from real backend data
 *  - Route from backend routing_service (haversine or Google Directions)
 *  - Layer visibility toggles
 *  - No hardcoded reference-image values (ENG-07, Rohit Sharma, etc.)
 *
 * Phase 7A explicitly DOES NOT implement:
 *  - OLT/ONT/ONU hardware integration (Phase 8)
 *  - Real live traffic layer (no external traffic data source)
 *  - Fiber cabinet real inventory (no backend model yet)
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import { api } from '../../services/api';
import { routingService } from '../../services/routingService';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { MapContainer } from '../../components/maps/MapContainer';
import {
  MapPin, Navigation, Radio, Clock, CheckCircle2, AlertTriangle,
  RefreshCw, Phone, Battery, Activity, Layers, ArrowRight,
  ShieldCheck, Search, ChevronRight, ChevronDown, X, KeyRound, Wifi, WifiOff,
  Globe, Eye, EyeOff, Signal, Zap, Users, Network, BarChart3,
  Building2, AlertCircle, Info, MapIcon, Filter, Server, Sliders,
  Cpu, HardDrive, Thermometer, TrendingUp, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Roles allowed to access this page (authoritative check is backend RBAC) */
const ALLOWED_ROLES = ['SUPER_ADMIN', 'Admin', 'NOC'];

const GPS_STALE_THRESHOLD_MS = 5 * 60 * 1000;   // 5 min
const GPS_OFFLINE_THRESHOLD_MS = 15 * 60 * 1000; // 15 min

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGpsAgeText(lastPingAt) {
  if (!lastPingAt) return 'No GPS';
  const ageMs = Date.now() - new Date(lastPingAt).getTime();
  const secs = Math.floor(ageMs / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function getGpsFreshness(lastPingAt) {
  if (!lastPingAt) return 'OFFLINE';
  const age = Date.now() - new Date(lastPingAt).getTime();
  if (age < GPS_STALE_THRESHOLD_MS) return 'LIVE';
  if (age < GPS_OFFLINE_THRESHOLD_MS) return 'STALE';
  return 'OFFLINE';
}

function freshnessStyle(freshness) {
  if (freshness === 'LIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (freshness === 'STALE') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function statusStyle(status) {
  const s = (status || '').toUpperCase();
  if (s === 'EN_ROUTE') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s === 'ON_SITE' || s === 'ARRIVED' || s === 'WORKING') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'OTP_REQUESTED') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'OTP_VERIFIED') return 'bg-green-50 text-green-700 border-green-200';
  if (s === 'COMPLETED') return 'bg-gray-100 text-gray-600 border-gray-200';
  if (s === 'AVAILABLE') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-gray-100 text-gray-500 border-gray-200';
}

function humanStatus(status) {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** KPI Summary Card */
function KpiCard({ label, value, icon: Icon, iconColor, sub, loading }) {
  return (
    <div className="bg-[#0F172A] border border-slate-700/60 rounded-xl p-3.5 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${iconColor || 'text-slate-500'}`} />}
      </div>
      <div className={`text-xl font-black ${loading ? 'text-slate-600' : 'text-white'}`}>
        {loading ? '—' : value ?? '—'}
      </div>
      {sub && <div className="text-[10px] text-slate-500 truncate">{sub}</div>}
    </div>
  );
}

/** GPS Freshness Badge */
function FreshnessBadge({ lastPingAt }) {
  const freshness = getGpsFreshness(lastPingAt);
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${freshnessStyle(freshness)}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${freshness === 'LIVE' ? 'bg-emerald-500 animate-pulse' : freshness === 'STALE' ? 'bg-amber-500' : 'bg-slate-400'}`} />
      {freshness}
    </span>
  );
}

/** Engineer list item in side panel */
function EngineerListItem({ engineer, isSelected, onClick, distanceKm }) {
  const freshness = getGpsFreshness(engineer.last_ping_at);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-900/30 border-blue-700/50 ring-1 ring-blue-500/40'
          : 'bg-slate-900/40 border-slate-700/40 hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
            engineer.status === 'EN_ROUTE' ? 'bg-blue-600' :
            ['ARRIVED', 'WORKING', 'ON_SITE'].includes(engineer.status) ? 'bg-emerald-600' :
            engineer.status === 'OTP_REQUESTED' ? 'bg-amber-600' : 'bg-slate-600'
          }`}>
            {(engineer.name || 'ENG').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{engineer.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{engineer.region || engineer.market_id}</div>
          </div>
        </div>
        <FreshnessBadge lastPingAt={engineer.last_ping_at} />
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusStyle(engineer.status)}`}>
          {humanStatus(engineer.status)}
        </span>
        {engineer.speed_kmh > 0 && (
          <span className="text-[10px] text-slate-400 font-mono">{Math.round(engineer.speed_kmh)} km/h</span>
        )}
        {distanceKm != null && (
          <span className="text-[10px] text-slate-400">{distanceKm.toFixed(1)} km</span>
        )}
      </div>
      <div className="mt-1 text-[9.5px] text-slate-500">
        GPS: {getGpsAgeText(engineer.last_ping_at)}
        {engineer.current_job_ticket && (
          <span className="ml-2 font-mono text-blue-400">{engineer.current_job_ticket}</span>
        )}
      </div>
    </button>
  );
}

/** Engineer Detail Panel */
function EngineerDetailPanel({ engineer, job, onClose }) {
  const freshness = getGpsFreshness(engineer.last_ping_at);

  const eta = job?.eta_minutes ?? job?.current_job_eta_minutes;
  const distKm = job?.distance_km;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow ${
            engineer.status === 'EN_ROUTE' ? 'bg-blue-600' :
            ['ARRIVED', 'WORKING', 'ON_SITE'].includes(engineer.status) ? 'bg-emerald-600' :
            'bg-slate-600'
          }`}>
            {(engineer.name || 'ENG').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{engineer.name}</div>
            <div className="text-[11px] text-slate-400">{engineer.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(engineer.status)}`}>
                {humanStatus(engineer.status)}
              </span>
              <FreshnessBadge lastPingAt={engineer.last_ping_at} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* GPS Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
          <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Speed</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {engineer.speed_kmh ? `${Math.round(engineer.speed_kmh)} km/h` : 'Stationary'}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
          <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">GPS Update</div>
          <div className="text-sm font-bold text-white mt-0.5">{getGpsAgeText(engineer.last_ping_at)}</div>
        </div>
        {eta != null && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
            <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">ETA</div>
            <div className="text-sm font-bold text-blue-400 mt-0.5">{eta} min</div>
          </div>
        )}
        {distKm != null && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
            <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Distance</div>
            <div className="text-sm font-bold text-white mt-0.5">{distKm.toFixed(1)} km</div>
          </div>
        )}
      </div>

      {/* Coordinates */}
      {engineer.current_latitude && (
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-bold text-blue-300 flex items-center justify-between">
            <span>GPS Coordinates (WGS84)</span>
            <span className="text-[9px] font-mono text-blue-500">
              {new Date(engineer.last_ping_at).toLocaleTimeString()}
            </span>
          </div>
          <div className="font-mono text-blue-200 text-[11px]">
            {engineer.current_latitude.toFixed(5)}, {engineer.current_longitude?.toFixed(5)}
          </div>
        </div>
      )}

      {/* Active Job */}
      {job && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 space-y-2">
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
            <span>Active Job</span>
            <span className="font-mono text-blue-400 text-[10px]">{job.ticket_code}</span>
          </div>
          {job.customer_name && (
            <div className="text-[11px] text-slate-300">
              Customer: <span className="font-semibold text-white">{job.customer_name}</span>
            </div>
          )}
          {job.customer_locality && (
            <div className="text-[11px] text-slate-300">
              Locality: <span className="font-semibold text-white">{job.customer_locality}</span>
            </div>
          )}
          {job.service_address && (
            <div className="text-[10px] text-slate-400 truncate">{job.service_address}</div>
          )}
          {eta == null && (
            <div className="text-[10px] text-slate-500 italic">ETA unavailable</div>
          )}
        </div>
      )}

      {/* Contact */}
      {engineer.phone && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Phone className="w-3.5 h-3.5" />
          <span className="font-mono">{engineer.phone}</span>
        </div>
      )}
    </div>
  );
}

/** Job/Customer Detail Panel with Dynamic Reverse Network Topology Path */
function JobDetailPanel({ job, onClose, onSelectDevice }) {
  const eta = job.eta_minutes ?? job.current_job_eta_minutes;
  const slaDeadline = job.sla_deadline ? new Date(job.sla_deadline) : null;
  const slaRemMs = slaDeadline ? slaDeadline - Date.now() : null;
  const slaRem = slaRemMs != null ? Math.max(0, Math.round(slaRemMs / 60000)) : null;
  const slaAtRisk = slaRem != null && slaRem < 60;

  // Dynamic Reverse Network Path
  const [topology, setTopology] = useState(null);
  const [loadingTopology, setLoadingTopology] = useState(false);

  useEffect(() => {
    if (!job?.customer_id) {
      setTopology(null);
      return;
    }
    let isMounted = true;
    setLoadingTopology(true);
    api.getCustomerNetworkTopology(job.customer_id)
      .then(data => {
        if (isMounted) setTopology(data);
      })
      .catch(() => {
        if (isMounted) setTopology(null);
      })
      .finally(() => {
        if (isMounted) setLoadingTopology(false);
      });
    return () => { isMounted = false; };
  }, [job?.customer_id]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-white">{job.ticket_code || `Ticket #${job.ticket_id}`}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {job.customer_name || 'Customer'} — {job.customer_locality}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className={`rounded-lg p-3 border ${
        slaAtRisk ? 'bg-red-950/40 border-red-800/40' : 'bg-slate-900/60 border-slate-700/50'
      }`}>
        <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">Job Status</div>
        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${statusStyle(job.status)}`}>
          {humanStatus(job.status)}
        </span>
        {slaRem != null && (
          <div className={`text-[10px] mt-1 font-semibold ${slaAtRisk ? 'text-red-400' : 'text-slate-400'}`}>
            SLA Remaining: {slaRem >= 60 ? `${Math.floor(slaRem/60)}h ${slaRem%60}m` : `${slaRem}m`}
            {slaAtRisk && ' ⚠ HIGH RISK'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {eta != null && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
            <div className="text-[9.5px] font-semibold text-slate-400 uppercase">ETA</div>
            <div className="text-sm font-bold text-blue-400 mt-0.5">{eta} min</div>
          </div>
        )}
        {job.ticket_category && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
            <div className="text-[9.5px] font-semibold text-slate-400 uppercase">Type</div>
            <div className="text-xs font-bold text-white mt-0.5 truncate">{job.ticket_category}</div>
          </div>
        )}
      </div>

      {job.engineer_name && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Assigned Engineer</div>
          <div className="text-sm font-semibold text-white">{job.engineer_name}</div>
          {job.engineer_phone && (
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Phone className="w-3 h-3" />{job.engineer_phone}
            </div>
          )}
          {eta == null && (
            <div className="text-[10px] text-slate-500 italic">ETA unavailable</div>
          )}
        </div>
      )}

      {/* Network Topology Path (Phase 7B) */}
      <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            Network Topology Path
          </div>
          <span className="text-[8.5px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            Source: Synthetic / Demo Telemetry
          </span>
        </div>

        {loadingTopology ? (
          <div className="flex items-center gap-2 py-2 text-[10px] text-slate-400">
            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Tracing optical path to OLT...</span>
          </div>
        ) : topology?.path?.length > 0 ? (
          <div className="space-y-2.5">
            {/* Visual Node Breadcrumb */}
            <div className="flex items-center flex-wrap gap-1 text-[10px]">
              {topology.path.map((node, idx) => {
                const isLast = idx === topology.path.length - 1;
                const isDegraded = node.status === 'DEGRADED' || node.status === 'OFFLINE' || node.status === 'DOWN';
                return (
                  <React.Fragment key={node.id || idx}>
                    <button
                      onClick={() => onSelectDevice && onSelectDevice(node)}
                      title={`Inspect ${node.name || node.device_code}`}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border transition cursor-pointer text-[9.5px] font-mono ${
                        isDegraded
                          ? 'bg-amber-950/40 border-amber-600/50 text-amber-300 hover:border-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <span className="font-semibold">{node.type === 'PON_PORT' ? `PON ${node.port_number || ''}` : (node.device_code || node.name)}</span>
                    </button>
                    {!isLast && <span className="text-slate-600 text-xs">→</span>}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ONT Optical Metrics */}
            {topology.ont?.health && (
              <div className="bg-slate-950/60 rounded-md p-2 border border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500">Optical Rx Power:</span>{' '}
                  <span className={`font-mono font-bold ${
                    topology.ont.health.optical_rx_dbm < -27 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {topology.ont.health.optical_rx_dbm} dBm
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Optical Tx:</span>{' '}
                  <span className="font-mono font-bold text-slate-300">
                    {topology.ont.health.optical_tx_dbm ?? '+2.3'} dBm
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">ONT Status:</span>{' '}
                  <span className="font-semibold text-slate-300">{topology.ont.status}</span>
                </div>
                <div>
                  <span className="text-slate-500">Signal:</span>{' '}
                  <span className={`font-semibold ${
                    topology.ont.health.status === 'DEGRADED' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {topology.ont.health.status || 'NORMAL'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 italic py-1">
            No topology mapping found for this customer drop.
          </div>
        )}
      </div>
    </div>
  );
}

/** Threshold Management Modal (Admin / Super Admin) */
function ThresholdManagerModal({ isOpen, onClose }) {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [editMap, setEditMap] = useState({});
  const [feedback, setFeedback] = useState(null);

  const fetchThresholds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMonitoringThresholds();
      setThresholds(data || []);
      const map = {};
      (data || []).forEach(t => {
        map[t.id] = { warning: t.warning_threshold, critical: t.critical_threshold };
      });
      setEditMap(map);
    } catch (err) {
      console.error('Failed to load thresholds:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchThresholds();
      setFeedback(null);
    }
  }, [isOpen, fetchThresholds]);

  const handleSave = async (id) => {
    const edit = editMap[id];
    if (!edit) return;
    setSavingId(id);
    setFeedback(null);
    try {
      await api.updateMonitoringThreshold(id, edit.warning, edit.critical);
      setFeedback({ type: 'success', message: 'Threshold updated successfully!' });
      fetchThresholds();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update threshold' });
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0B132B] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Monitoring Alert Thresholds</h3>
              <p className="text-[10px] text-slate-400">Carrier-grade alarm setpoints per device type & metric</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`mx-5 mt-3 p-2 rounded-lg text-xs font-semibold ${
            feedback.type === 'success' ? 'bg-emerald-950/60 border border-emerald-600/50 text-emerald-300' : 'bg-red-950/60 border border-red-600/50 text-red-300'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading configured thresholds...
            </div>
          ) : (
            thresholds.map(t => (
              <div key={t.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50">
                      {t.device_type}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {t.metric_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Unit: <span className="font-mono text-slate-300">{t.unit}</span> · Scope: <span className="uppercase text-slate-300">{t.market_id}</span>
                  </div>
                </div>

                {/* Warning Input */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <label className="text-[8.5px] font-semibold text-amber-400 uppercase">Warning ({t.unit})</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editMap[t.id]?.warning ?? t.warning_threshold}
                      onChange={(e) => setEditMap(prev => ({
                        ...prev,
                        [t.id]: { ...prev[t.id], warning: e.target.value }
                      }))}
                      className="w-18 bg-slate-950 border border-amber-800/50 rounded px-2 py-1 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Critical Input */}
                  <div className="flex flex-col">
                    <label className="text-[8.5px] font-semibold text-red-400 uppercase">Critical ({t.unit})</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editMap[t.id]?.critical ?? t.critical_threshold}
                      onChange={(e) => setEditMap(prev => ({
                        ...prev,
                        [t.id]: { ...prev[t.id], critical: e.target.value }
                      }))}
                      className="w-18 bg-slate-950 border border-red-800/50 rounded px-2 py-1 text-xs text-red-200 font-mono focus:outline-none focus:border-red-400"
                    />
                  </div>

                  <button
                    onClick={() => handleSave(t.id)}
                    disabled={savingId === t.id}
                    className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded text-[10px] font-bold cursor-pointer transition shadow"
                  >
                    {savingId === t.id ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Progress/Gauge Bar for Metrics */
function MetricGaugeBar({ label, value, unit, warningLimit, criticalLimit, maxLimit = 100, subtext, icon: Icon }) {
  if (value == null) return null;
  const numVal = Number(value);
  const pct = Math.min(100, Math.max(0, (numVal / maxLimit) * 100));

  let statusColor = 'bg-emerald-500';
  let badgeColor = 'text-emerald-400 border-emerald-800 bg-emerald-950/40';
  let statusText = 'NORMAL';

  if (criticalLimit && numVal >= criticalLimit) {
    statusColor = 'bg-rose-500';
    badgeColor = 'text-rose-400 border-rose-800 bg-rose-950/40';
    statusText = 'CRITICAL';
  } else if (warningLimit && numVal >= warningLimit) {
    statusColor = 'bg-amber-500';
    badgeColor = 'text-amber-400 border-amber-800 bg-amber-950/40';
    statusText = 'WARNING';
  }

  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          {Icon && <Icon className="w-3 h-3 text-slate-400" />}
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-white">{numVal}{unit}</span>
          <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border font-mono ${badgeColor}`}>
            {statusText}
          </span>
        </div>
      </div>
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full ${statusColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
        <span>{subtext || `Warn: ${warningLimit}${unit}`}</span>
        {criticalLimit && <span>Crit: {criticalLimit}${unit}</span>}
      </div>
    </div>
  );
}

/** Device Detail Panel (OLT, Cabinet, Splitter, ONT) with 5-Tab Multi-Inspector */
function DeviceDetailPanel({
  device,
  impact,
  health,
  metrics,
  loadingImpact,
  onClose,
  onSelectDevice,
  onSimulate,
  canSimulate = false
}) {
  const [activeTab, setActiveTab] = useState('health'); // 'overview' | 'health' | 'charts' | 'impact' | 'alarms'
  const [timeRange, setTimeRange] = useState('1h');
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Fetch Historical Telemetry for Charts
  useEffect(() => {
    if (!device?.id || activeTab !== 'charts') return;
    let isMounted = true;
    setLoadingHistory(true);
    api.getDeviceMetricsHistory(device.id, timeRange)
      .then(res => {
        if (isMounted && res?.data_points) {
          setHistoryData(res.data_points);
        }
      })
      .catch(err => console.error('Failed to load history metrics:', err))
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });
    return () => { isMounted = false; };
  }, [device?.id, timeRange, activeTab]);

  if (!device) return null;

  const overallStatus = metrics?.overall_status || device.status || 'HEALTHY';
  const isDown = overallStatus === 'DOWN';
  const isCritical = overallStatus === 'CRITICAL';
  const isDegraded = overallStatus === 'DEGRADED' || overallStatus === 'WARNING';

  const statusBadgeStyle = isDown
    ? 'bg-red-950/60 text-red-300 border-red-700/60'
    : isCritical
    ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
    : isDegraded
    ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
    : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';

  const freshness = metrics?.telemetry_freshness?.freshness_status || 'LIVE';
  const sys = metrics?.system_metrics || {};

  const handleSimulateClick = async (scenario) => {
    if (!onSimulate) return;
    setSimulating(true);
    try {
      await onSimulate(device.id, scenario);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50">
              {device.device_type || device.type || 'DEVICE'}
            </span>
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusBadgeStyle}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isDown || isCritical ? 'bg-red-400 animate-pulse' : isDegraded ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              {overallStatus}
            </span>
            <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {freshness}
            </span>
          </div>
          <div className="text-sm font-bold text-white mt-1">{device.name || device.device_code}</div>
          <div className="text-[10px] font-mono text-slate-400">{device.device_code}</div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Source Banner */}
      <div className="bg-slate-900/70 border border-slate-700/60 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[9px]">
        <span className="text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3 text-blue-400" />
          Source:
        </span>
        <span className="font-mono text-blue-400 font-semibold">Synthetic / Demo Telemetry</span>
      </div>

      {/* Inspector Tabs */}
      <div className="flex items-center border-b border-slate-800/80 gap-1 pb-1">
        {[
          { id: 'health', label: 'Health', icon: Activity },
          { id: 'charts', label: 'Charts', icon: TrendingUp },
          { id: 'overview', label: 'Specs', icon: Server },
          { id: 'impact', label: 'Impact', icon: Zap },
          { id: 'alarms', label: 'Alarms', icon: AlertTriangle },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HEALTH & TELEMETRY */}
      {activeTab === 'health' && (
        <div className="space-y-2.5">
          {/* Health reasons summary */}
          {metrics?.health_reasons?.length > 0 && (
            <div className={`p-2 rounded-lg border text-[9.5px] space-y-1 ${
              isCritical || isDown ? 'bg-red-950/40 border-red-800/60 text-red-200' :
              isDegraded ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' :
              'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
            }`}>
              <div className="font-bold flex items-center gap-1 uppercase tracking-wider text-[8.5px]">
                <Activity className="w-3 h-3" /> Health Status Rationale:
              </div>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                {metrics.health_reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* System Metric Gauges */}
          <div className="space-y-2">
            {sys.cpu_utilization_pct != null && (
              <MetricGaugeBar
                label="CPU Utilization"
                value={sys.cpu_utilization_pct}
                unit="%"
                warningLimit={70}
                criticalLimit={85}
                icon={Cpu}
              />
            )}
            {sys.memory_utilization_pct != null && (
              <MetricGaugeBar
                label="Memory Utilization"
                value={sys.memory_utilization_pct}
                unit="%"
                warningLimit={75}
                criticalLimit={90}
                subtext={`Used: ${sys.memory_used_gb ?? '—'} GB / Total: ${sys.memory_total_gb ?? '16'} GB`}
                icon={HardDrive}
              />
            )}
            {sys.temperature_celsius != null && (
              <MetricGaugeBar
                label="Chassis Temperature"
                value={sys.temperature_celsius}
                unit="°C"
                warningLimit={65}
                criticalLimit={80}
                icon={Thermometer}
              />
            )}
          </div>

          {/* Uptime and Freshness */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">System Uptime</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {sys.uptime_formatted || (health?.uptime_hours ? `${health.uptime_hours}h` : '14d 6h')}
              </div>
            </div>
            <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">Last Telemetry Ping</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {metrics?.telemetry_freshness?.label || 'Live'}
              </div>
            </div>
          </div>

          {/* Optical Telemetry */}
          {(health?.optical_rx_dbm != null || metrics?.optical?.rx_power_dbm != null) && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1">
                <Signal className="w-3 h-3 text-cyan-400" />
                Optical Physical Layer
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500">Optical Rx Power:</span>{' '}
                  <span className={`font-mono font-bold ${
                    (metrics?.optical?.rx_power_dbm ?? health?.optical_rx_dbm) < -27 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {metrics?.optical?.rx_power_dbm ?? health?.optical_rx_dbm} dBm
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Optical Tx Power:</span>{' '}
                  <span className="font-mono font-bold text-slate-300">
                    {metrics?.optical?.tx_power_dbm ?? health?.optical_tx_dbm ?? '+2.5'} dBm
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PON Ports Summary for OLT */}
          {metrics?.pon_ports?.length > 0 && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                <span>PON Interfaces ({metrics.pon_ports.length})</span>
                <span className="text-[9px] text-slate-500 font-normal">Cap: 64 ONTs/port</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {metrics.pon_ports.map(p => {
                  const isHigh = p.utilization_pct >= 75;
                  return (
                    <div key={p.id} className="text-[9px] flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                      <span className="font-mono font-semibold text-slate-300">PON {p.port_number}</span>
                      <span className="text-slate-400 font-mono">{p.connected_clients}/{p.capacity} ONTs</span>
                      <span className={`font-mono font-bold ${isHigh ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {p.utilization_pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORICAL CHARTS */}
      {activeTab === 'charts' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Metrics Over Time</span>
            <div className="flex gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
              {['1h', '6h', '24h'].map(tr => (
                <button
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold cursor-pointer transition ${
                    timeRange === tr ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>
          </div>

          {loadingHistory ? (
            <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Generating telemetry chart...
            </div>
          ) : historyData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-slate-600 text-xs">
              No historical data available for range {timeRange}.
            </div>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2">
              <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1 px-1">
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> CPU %</span>
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Memory %</span>
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Temp °C</span>
              </div>
              <ResponsiveContainer width="100%" height={165}>
                <LineChart data={historyData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1E293B" opacity={0.6} />
                  <XAxis dataKey="time_label" stroke="#475569" fontSize={8} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={8} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', borderRadius: '6px', fontSize: '10px' }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Line type="monotone" dataKey="cpu_utilization_pct" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="memory_utilization_pct" stroke="#A855F7" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="temperature_celsius" stroke="#F59E0B" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SPECIFICATIONS / OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-2.5 space-y-1.5 text-[10px]">
          {device.market_id && (
            <div className="flex justify-between">
              <span className="text-slate-500">Market Region:</span>
              <span className="font-mono text-white uppercase">{device.market_id}</span>
            </div>
          )}
          {device.ip_address && (
            <div className="flex justify-between">
              <span className="text-slate-500">Management IP:</span>
              <span className="font-mono text-slate-300">{device.ip_address}</span>
            </div>
          )}
          {device.model && (
            <div className="flex justify-between">
              <span className="text-slate-500">Hardware Model:</span>
              <span className="text-slate-300">{device.model}</span>
            </div>
          )}
          {device.serial_number && (
            <div className="flex justify-between">
              <span className="text-slate-500">Serial Number:</span>
              <span className="font-mono text-slate-300">{device.serial_number}</span>
            </div>
          )}
          {device.latitude && device.longitude && (
            <div className="flex justify-between">
              <span className="text-slate-500">GPS Coordinates:</span>
              <span className="font-mono text-slate-300">{Number(device.latitude).toFixed(4)}, {Number(device.longitude).toFixed(4)}</span>
            </div>
          )}
          {device.vendor && (
            <div className="flex justify-between">
              <span className="text-slate-500">Hardware Vendor:</span>
              <span className="text-slate-300">{device.vendor}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DETERMINISTIC DOWNSTREAM IMPACT */}
      {activeTab === 'impact' && (
        <div className={`rounded-lg p-3 border space-y-2 ${
          (impact?.total_affected_customers || 0) > 0 ? 'bg-red-950/30 border-red-800/40' : 'bg-slate-900/60 border-slate-700/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 text-slate-300">
              <Zap className={`w-3.5 h-3.5 ${(impact?.total_affected_customers || 0) > 0 ? 'text-red-400' : 'text-blue-400'}`} />
              Topology Blast Radius
            </div>
            {loadingImpact && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/60 rounded p-2 border border-slate-800/80">
              <div className="text-[9px] text-slate-500 uppercase">Downstream Nodes</div>
              <div className="text-base font-black text-white mt-0.5">
                {impact?.total_downstream_devices ?? 0}
              </div>
            </div>
            <div className="bg-slate-950/60 rounded p-2 border border-slate-800/80">
              <div className="text-[9px] text-slate-500 uppercase">Affected Subscribers</div>
              <div className={`text-base font-black mt-0.5 ${
                (impact?.total_affected_customers || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {impact?.total_affected_customers ?? 0}
              </div>
            </div>
          </div>

          {impact?.affected_customers?.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="text-[9.5px] font-semibold text-slate-400">Impacted Customer Drops:</div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {impact.affected_customers.map(c => (
                  <div key={c.id} className="text-[9px] bg-slate-950/50 rounded px-2 py-1 flex items-center justify-between border border-slate-800/50">
                    <span className="text-slate-300 truncate max-w-[140px]">{c.name}</span>
                    <span className="text-slate-500 font-mono">{c.locality || c.region}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ALARMS & TEST SIMULATION */}
      {activeTab === 'alarms' && (
        <div className="space-y-3">
          {/* Active Alarms for this Device */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Active Alarms ({(metrics?.active_alarms || []).length})
            </div>
            {(metrics?.active_alarms || []).length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800 rounded p-2 text-[10px] text-slate-500 italic">
                No active alarms detected on this device.
              </div>
            ) : (
              (metrics?.active_alarms || []).map(a => {
                const isCrit = a.severity === 'CRITICAL';
                return (
                  <div
                    key={a.id}
                    className={`p-2 rounded border text-[10px] space-y-1 ${
                      isCrit ? 'bg-red-950/40 border-red-800/50 text-red-200' : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isCrit ? 'bg-red-900 text-white' : 'bg-amber-900 text-white'
                      }`}>
                        {a.code || a.alarm_code}
                      </span>
                      <span className="text-[8.5px] font-mono text-slate-400">
                        {a.first_seen_at ? new Date(a.first_seen_at).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <div className="font-medium text-white">{a.message}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Test Scenario Simulation Controls (Only for Admin / Super Admin) */}
          {canSimulate && (
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wide flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-blue-400" />
                  Test Scenario Simulation
                </span>
                {simulating && <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />}
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">
                Simulate deterministic telemetry scenarios to test alarm lifecycles and NOC response.
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {[
                  { id: 'HEALTHY', label: 'Healthy', color: 'bg-emerald-600 hover:bg-emerald-500' },
                  { id: 'WARNING', label: 'Warning Load', color: 'bg-amber-600 hover:bg-amber-500' },
                  { id: 'CRITICAL', label: 'Critical Spike', color: 'bg-rose-600 hover:bg-rose-500' },
                  { id: 'DOWN', label: 'Device Down', color: 'bg-slate-700 hover:bg-slate-600' },
                ].map(scen => (
                  <button
                    key={scen.id}
                    disabled={simulating}
                    onClick={() => handleSimulateClick(scen.id)}
                    className={`py-1.5 px-2 rounded text-[10px] font-bold text-white transition cursor-pointer shadow disabled:opacity-50 ${scen.color}`}
                  >
                    {scen.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Layer Controls ───────────────────────────────────────────────────────────

const DEFAULT_LAYERS = {
  engineers: true,
  customers: true,
  faults: true,
  network: true,
  route: true,
};

function LayerToggle({ label, layerId, layers, onToggle, icon: Icon }) {
  return (
    <button
      onClick={() => onToggle(layerId)}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
        layers[layerId]
          ? 'bg-slate-700/60 border-slate-600 text-white'
          : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export const NocTrackingMap = () => {
  const { user, can } = useAuth();
  const { currentMarket, switchMarket, availableMarkets } = useMarket();

  // ── Data State ────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Network & Monitoring State (Phase 7B / Phase 8) ──────────────────────
  const [networkOverview, setNetworkOverview] = useState(null);
  const [monitoringOverview, setMonitoringOverview] = useState(null);
  const [networkMapLayers, setNetworkMapLayers] = useState(null);
  const [networkOlts, setNetworkOlts] = useState([]);
  const [networkAlarms, setNetworkAlarms] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceImpact, setDeviceImpact] = useState(null);
  const [deviceHealth, setDeviceHealth] = useState(null);
  const [deviceMetrics, setDeviceMetrics] = useState(null);
  const [loadingDeviceImpact, setLoadingDeviceImpact] = useState(false);
  const [expandedOltId, setExpandedOltId] = useState(null);
  const [oltPortsMap, setOltPortsMap] = useState({});
  const [loadingPortsOltId, setLoadingPortsOltId] = useState(null);
  const [showThresholdModal, setShowThresholdModal] = useState(false);

  // ── Selection State ───────────────────────────────────────────────────────
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activePanel, setActivePanel] = useState('selected'); // 'selected' | 'engineers' | 'network'

  // ── Map State ─────────────────────────────────────────────────────────────
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [routeWaypoints, setRouteWaypoints] = useState(null);
  const [routeProvider, setRouteProvider] = useState(null);

  // ── SSE State ─────────────────────────────────────────────────────────────
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef(null);

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');

  // ── Authorization guard ───────────────────────────────────────────────────
  const isAuthorized = ALLOWED_ROLES.includes(user?.role);
  const canAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'Admin';

  // ── Data Loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sumRes, engRes, jobRes, netOverviewRes, netLayersRes, netOltsRes, alarmsRes, monOverviewRes] = await Promise.all([
        api.getFieldOpsSummary().catch(() => null),
        api.getFieldEngineers(null).catch(() => []),
        api.getFieldJobs(null).catch(() => []),
        api.getNetworkOverview().catch(() => null),
        api.getNetworkMapLayers().catch(() => null),
        api.getNetworkOlts().catch(() => []),
        api.getNetworkAlarms().catch(() => []),
        api.getMonitoringOverview().catch(() => null),
      ]);
      if (sumRes) setSummary(sumRes);
      if (Array.isArray(engRes)) setEngineers(engRes);
      if (Array.isArray(jobRes)) setJobs(jobRes);
      if (netOverviewRes) setNetworkOverview(netOverviewRes);
      if (netLayersRes) setNetworkMapLayers(netLayersRes);
      if (Array.isArray(netOltsRes)) setNetworkOlts(netOltsRes);
      if (Array.isArray(alarmsRes)) setNetworkAlarms(alarmsRes);
      if (monOverviewRes) setMonitoringOverview(monOverviewRes);
    } catch (err) {
      console.error('[NocTrackingMap] Data load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Load Device Health, Metrics & Impact when selected ───────────────────
  useEffect(() => {
    if (!selectedDevice?.id) {
      setDeviceImpact(null);
      setDeviceHealth(null);
      setDeviceMetrics(null);
      return;
    }
    let isMounted = true;
    setLoadingDeviceImpact(true);
    Promise.all([
      api.getDeviceHealth(selectedDevice.id).catch(() => null),
      api.getDeviceImpact(selectedDevice.id).catch(() => null),
      api.getDeviceMetrics(selectedDevice.id).catch(() => null),
    ]).then(([h, imp, met]) => {
      if (isMounted) {
        if (h) setDeviceHealth(h);
        if (imp) setDeviceImpact(imp);
        if (met) setDeviceMetrics(met);
      }
    }).finally(() => {
      if (isMounted) setLoadingDeviceImpact(false);
    });
    return () => { isMounted = false; };
  }, [selectedDevice?.id]);

  // ── Safe Test Scenario Simulation Handler ────────────────────────────────
  const handleSimulateDevice = useCallback(async (deviceId, scenario) => {
    try {
      const res = await api.simulateDeviceScenario(deviceId, scenario);
      if (res) {
        setDeviceMetrics(res);
        setDeviceHealth(prev => ({
          ...prev,
          cpu_utilization_pct: res.system_metrics?.cpu_utilization_pct,
          temperature_c: res.system_metrics?.temperature_celsius,
          optical_rx_dbm: res.optical?.rx_power_dbm,
          status: res.overall_status,
        }));
        setSelectedDevice(prev => prev ? { ...prev, status: res.overall_status } : null);
      }
      loadData(false);
    } catch (err) {
      console.error('Simulation failed:', err);
    }
  }, [loadData]);

  // ── Expand OLT and fetch PON ports ────────────────────────────────────────
  const toggleExpandOlt = useCallback(async (oltId) => {
    if (expandedOltId === oltId) {
      setExpandedOltId(null);
      return;
    }
    setExpandedOltId(oltId);
    if (!oltPortsMap[oltId]) {
      setLoadingPortsOltId(oltId);
      try {
        const ports = await api.getNetworkOltPorts(oltId);
        setOltPortsMap(prev => ({ ...prev, [oltId]: ports || [] }));
      } catch (err) {
        console.error('Failed to load OLT ports:', err);
      } finally {
        setLoadingPortsOltId(null);
      }
    }
  }, [expandedOltId, oltPortsMap]);

  useEffect(() => {
    loadData(true);
  }, [currentMarket, loadData]);

  // ── SSE Subscription ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthorized) return;

    let sse;
    try {
      const url = api.getFieldOpsStreamUrl();
      sse = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = sse;

      sse.onopen = () => setSseConnected(true);
      sse.onerror = () => setSseConnected(false);

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const isLoc = payload.event === 'location_update' ||
            payload.type === 'location_ping' ||
            (payload.latitude && payload.longitude);

          if (isLoc) {
            // Update engineer marker — per-engineer update, no full re-render
            setEngineers(prev =>
              prev.map(eng => {
                if (eng.id === payload.engineer_id ||
                    (payload.engineer_name && eng.name === payload.engineer_name)) {
                  return {
                    ...eng,
                    current_latitude: payload.latitude,
                    current_longitude: payload.longitude,
                    speed_kmh: payload.speed ?? payload.speed_kmh ?? eng.speed_kmh,
                    heading: payload.heading ?? eng.heading,
                    status: payload.status === 'ARRIVED' || payload.status === 'WORKING'
                      ? 'ON_SITE'
                      : payload.status === 'EN_ROUTE'
                      ? 'EN_ROUTE'
                      : eng.status,
                    last_ping_at: payload.timestamp || new Date().toISOString(),
                  };
                }
                return eng;
              })
            );

            setJobs(prev =>
              prev.map(j => {
                if (j.id === payload.assignment_id || j.engineer_id === payload.engineer_id) {
                  return {
                    ...j,
                    engineer_latitude: payload.latitude,
                    engineer_longitude: payload.longitude,
                    status: payload.status || j.status,
                    eta_minutes: payload.eta_minutes !== undefined ? payload.eta_minutes : j.eta_minutes,
                  };
                }
                return j;
              })
            );

            // Update selected engineer panel
            setSelectedEngineer(prev => {
              if (!prev) return prev;
              if (prev.id === payload.engineer_id ||
                  (payload.engineer_name && prev.name === payload.engineer_name)) {
                return {
                  ...prev,
                  current_latitude: payload.latitude,
                  current_longitude: payload.longitude,
                  speed_kmh: payload.speed ?? payload.speed_kmh ?? prev.speed_kmh,
                  last_ping_at: payload.timestamp || new Date().toISOString(),
                };
              }
              return prev;
            });

          } else if (payload.event === 'status_transition' || payload.type === 'status_transition') {
            loadData(false);
          }
        } catch {
          // Non-JSON heartbeat
        }
      };
    } catch {
      setSseConnected(false);
    }

    return () => {
      if (sse) sse.close();
    };
  }, [currentMarket, isAuthorized, loadData]);

  // ── BroadcastChannel sync (cross-tab) ─────────────────────────────────────
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('sentinel_field_events');
      bc.onmessage = (msg) => {
        const data = msg.data;
        if (!data) return;
        if (data.type === 'location_update') {
          setEngineers(prev =>
            prev.map(eng =>
              eng.id === data.engineer_id
                ? { ...eng, current_latitude: data.latitude, current_longitude: data.longitude, speed_kmh: data.speed, last_ping_at: data.timestamp }
                : eng
            )
          );
        } else if (data.type === 'status_transition') {
          loadData(false);
        }
      };
    } catch {}
    return () => { if (bc) bc.close(); };
  }, [loadData]);

  // ── Route Loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedJob?.id) {
      setRouteWaypoints(null);
      setRouteProvider(null);
      return;
    }

    const activeAssignment = jobs.find(j => j.id === selectedJob.id);
    const engLat = activeAssignment?.current_latitude || selectedEngineer?.current_latitude;
    const engLng = activeAssignment?.current_longitude || selectedEngineer?.current_longitude;

    routingService.getJobRoute(selectedJob.id, engLat, engLng)
      .then(routeData => {
        if (routeData?.waypoints?.length >= 2) {
          setRouteWaypoints(routeData.waypoints);
          setRouteProvider(routeData.provider);
        } else {
          // Build 2-point straight line from known coords
          const cLat = selectedJob.service_latitude;
          const cLng = selectedJob.service_longitude;
          if (engLat && engLng && cLat && cLng) {
            setRouteWaypoints([
              { lat: engLat, lng: engLng },
              { lat: cLat, lng: cLng },
            ]);
            setRouteProvider('straight_line');
          }
        }
      })
      .catch(() => {
        setRouteWaypoints(null);
        setRouteProvider(null);
      });
  }, [selectedJob?.id, selectedEngineer?.current_latitude, selectedEngineer?.current_longitude]);

  // ── Layer toggle ──────────────────────────────────────────────────────────
  const toggleLayer = useCallback((layerId) => {
    setLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeJobs = useMemo(
    () => jobs.filter(j => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(j.status)),
    [jobs]
  );

  const filteredEngineers = useMemo(() => {
    if (!searchTerm) return engineers;
    const t = searchTerm.toLowerCase();
    return engineers.filter(e =>
      e.name?.toLowerCase().includes(t) ||
      e.email?.toLowerCase().includes(t) ||
      e.region?.toLowerCase().includes(t) ||
      e.status?.toLowerCase().includes(t)
    );
  }, [engineers, searchTerm]);

  const selectedJobData = useMemo(() => {
    if (!selectedEngineer) return selectedJob;
    return jobs.find(j => j.engineer_id === selectedEngineer.id && !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(j.status)) || selectedJob;
  }, [selectedEngineer, selectedJob, jobs]);

  const engineerDistances = useMemo(() => {
    if (!selectedJob?.service_latitude) return {};
    const res = {};
    engineers.forEach(eng => {
      if (!eng.current_latitude) return;
      // Simple Haversine
      const R = 6371;
      const dLat = (selectedJob.service_latitude - eng.current_latitude) * Math.PI / 180;
      const dLng = (selectedJob.service_longitude - eng.current_longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(eng.current_latitude * Math.PI/180) * Math.cos(selectedJob.service_latitude * Math.PI/180) * Math.sin(dLng/2)**2;
      res[eng.id] = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    });
    return res;
  }, [engineers, selectedJob]);

  // ── Authorization guard ───────────────────────────────────────────────────
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-red-500 mx-auto" />
          <div className="text-white font-bold text-lg">Access Restricted</div>
          <div className="text-slate-400 text-sm">
            NOC Tracking Map requires SUPER_ADMIN, Admin, or NOC role.
          </div>
          <div className="text-slate-600 text-xs">Your role: {user?.role || 'Unknown'}</div>
        </div>
      </div>
    );
  }

  // ── KPI values ────────────────────────────────────────────────────────────
  const kpiActiveFaults = summary?.active_jobs ?? activeJobs.length;
  const kpiSlaRisk = jobs.filter(j => {
    if (!j.sla_deadline) return false;
    const rem = new Date(j.sla_deadline) - Date.now();
    return rem > 0 && rem < 60 * 60 * 1000;
  }).length;
  const kpiFieldEngineers = engineers.length;
  const kpiCompleted = summary?.completed_today ?? 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#080E1A] text-white overflow-hidden">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-[#0A1020]/95 border-b border-slate-800/60 px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Title + Nav */}
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm font-black text-white tracking-tight">
                Last Mile Telecom Field Operations
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 font-medium">
                {['Network', 'Field Engineers', 'Faults', 'SLA', 'Live Traffic'].map(nav => (
                  <span key={nav} className="hover:text-white cursor-pointer transition">{nav}</span>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <KpiCard label="Active Faults" value={kpiActiveFaults} icon={AlertTriangle} iconColor="text-red-500" loading={loading} />
            <KpiCard label="SLA Risk" value={kpiSlaRisk} icon={Clock} iconColor="text-amber-500" loading={loading}
              sub={kpiSlaRisk > 0 ? 'Within 1 hour' : 'All on track'} />
            <KpiCard label="Field Engineers" value={kpiFieldEngineers} icon={Users} iconColor="text-blue-400" loading={loading}
              sub={`${summary?.engineers_in_transit ?? 0} en route`} />
            <KpiCard label="Completed Today" value={kpiCompleted} icon={CheckCircle2} iconColor="text-emerald-400" loading={loading}
              sub="OTP verified" />
            {/* Real Network KPIs from synthetic provider (Phase 7B) */}
            <KpiCard
              label="OLT / POP"
              value={networkOverview?.total_olts ?? '—'}
              icon={Signal}
              iconColor="text-purple-400"
              loading={loading}
              sub={`${networkOverview?.olts_online ?? 0} online · Synth`}
            />
            <KpiCard
              label="Fiber Cabinets"
              value={networkOverview?.total_fiber_cabinets ?? '—'}
              icon={Building2}
              iconColor="text-yellow-500"
              loading={loading}
              sub={`${networkOverview?.total_splitters ?? 0} splitters · Synth`}
            />
            <KpiCard
              label="ONT Fleet"
              value={networkOverview?.total_ont_onus ?? '—'}
              icon={Radio}
              iconColor="text-cyan-400"
              loading={loading}
              sub={`${networkOverview?.ont_online ?? 0} online · ${networkOverview?.active_alarms ?? 0} alarms`}
            />
          </div>

          {/* Market + Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Market Switcher */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px]">
              {availableMarkets?.map(m => (
                <button
                  key={m.id}
                  onClick={() => switchMarket(m.id)}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    currentMarket === m.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* SSE status */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${
              sseConnected
                ? 'bg-emerald-900/30 border-emerald-700/40 text-emerald-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-500'
            }`}>
              {sseConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {sseConnected ? 'LIVE' : 'Polling'}
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: MAP + RIGHT PANEL ──────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Layer Controls (slim vertical) ─────────────────────── */}
        <div className="shrink-0 w-[52px] bg-[#0A1020]/80 border-r border-slate-800/60 flex flex-col items-center gap-2 py-3">
          <div className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-1">Layers</div>
          {[
            { id: 'engineers', label: 'ENG', icon: Users },
            { id: 'customers', label: 'CUST', icon: MapPin },
            { id: 'faults', label: 'FAULT', icon: AlertTriangle },
            { id: 'route', label: 'ROUTE', icon: Navigation },
            { id: 'network', label: 'NET', icon: Network },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => toggleLayer(id)}
              title={`Toggle ${label} layer`}
              className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 border transition cursor-pointer ${
                layers[id]
                  ? 'bg-blue-600/20 border-blue-600/40 text-blue-400'
                  : 'bg-slate-800/30 border-slate-700/40 text-slate-600 hover:text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[7px] font-bold">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Center: Map ───────────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          {/* Layer toggle chips (compact, over-map) */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
            {routeWaypoints && routeProvider && (
              <div className="bg-slate-900/90 border border-slate-700 rounded-md px-2 py-1 text-[9px] font-mono text-slate-400 flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5" />
                {routeProvider === 'google_maps' ? 'Google Route' :
                 routeProvider === 'straight_line' ? 'Straight Line (approx.)' :
                 'Haversine Route (approx.)'}
              </div>
            )}
          </div>

          <MapContainer
            engineers={layers.engineers ? filteredEngineers : []}
            jobs={layers.customers ? activeJobs : []}
            selectedEngineer={selectedEngineer}
            selectedJob={selectedJobData}
            onSelectEngineer={(eng) => {
              setSelectedEngineer(eng);
              setSelectedJob(null);
              setSelectedDevice(null);
              setActivePanel('selected');
            }}
            onSelectJob={(job) => {
              setSelectedJob(job);
              setSelectedEngineer(null);
              setSelectedDevice(null);
              setActivePanel('selected');
            }}
            currentMarket={currentMarket}
            height="100%"
            showProviderSelector={true}
            layerVisibility={layers}
            routeWaypoints={routeWaypoints}
            networkLayers={layers.network ? networkMapLayers : null}
            selectedDevice={selectedDevice}
            onSelectDevice={(device) => {
              setSelectedDevice(device);
              setSelectedEngineer(null);
              setSelectedJob(null);
              setActivePanel('network');
            }}
          />

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center z-30">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-400 text-sm font-medium">Loading operational data…</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Operations Panel ───────────────────────────────────── */}
        <div className="shrink-0 w-[320px] bg-[#0A1020]/95 border-l border-slate-800/60 flex flex-col overflow-hidden">

          {/* Panel Tabs */}
          <div className="flex items-center border-b border-slate-800/60 shrink-0">
            {[
              { id: 'selected', label: 'Selected' },
              { id: 'engineers', label: 'Engineers' },
              { id: 'network', label: 'Network' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 px-3 py-2.5 text-[11px] font-bold transition border-b-2 cursor-pointer ${
                  activePanel === tab.id
                    ? 'text-blue-400 border-blue-500'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">

            {/* ── SELECTED TAB ─────────────────────────────────────────── */}
            {activePanel === 'selected' && (
              <>
                {selectedEngineer ? (
                  <EngineerDetailPanel
                    engineer={selectedEngineer}
                    job={selectedJobData}
                    onClose={() => { setSelectedEngineer(null); setSelectedJob(null); }}
                  />
                ) : selectedJob ? (
                  <JobDetailPanel
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onSelectDevice={(dev) => {
                      setSelectedDevice(dev);
                      setSelectedEngineer(null);
                      setSelectedJob(null);
                      setActivePanel('network');
                    }}
                  />
                ) : selectedDevice ? (
                  <DeviceDetailPanel
                    device={selectedDevice}
                    impact={deviceImpact}
                    health={deviceHealth}
                    metrics={deviceMetrics}
                    loadingImpact={loadingDeviceImpact}
                    onClose={() => setSelectedDevice(null)}
                    onSelectDevice={(dev) => setSelectedDevice(dev)}
                    onSimulate={handleSimulateDevice}
                    canSimulate={canAdmin}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-400">Nothing Selected</div>
                      <div className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto">
                        Click an engineer, customer, OLT, cabinet, or splitter marker to inspect live data.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── ENGINEERS TAB ────────────────────────────────────────── */}
            {activePanel === 'engineers' && (
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search engineer, region, status…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{filteredEngineers.length} engineers</span>
                  <span>·</span>
                  <span className="text-emerald-500">
                    {filteredEngineers.filter(e => getGpsFreshness(e.last_ping_at) === 'LIVE').length} live GPS
                  </span>
                  <span>·</span>
                  <span className="text-amber-500">
                    {filteredEngineers.filter(e => getGpsFreshness(e.last_ping_at) === 'STALE').length} stale
                  </span>
                </div>

                {/* List */}
                {filteredEngineers.length === 0 ? (
                  <div className="text-center text-slate-600 text-xs py-8">
                    {loading ? 'Loading…' : 'No engineers found'}
                  </div>
                ) : (
                  filteredEngineers.map(eng => (
                    <EngineerListItem
                      key={eng.id}
                      engineer={eng}
                      isSelected={selectedEngineer?.id === eng.id}
                      distanceKm={engineerDistances[eng.id]}
                      onClick={() => {
                        setSelectedEngineer(eng);
                        setActivePanel('selected');
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── NETWORK TAB ──────────────────────────────────────────── */}
            {activePanel === 'network' && (
              <div className="space-y-3">
                {selectedDevice ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedDevice(null)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      <span>Back to Network Overview</span>
                    </button>
                    <DeviceDetailPanel
                      device={selectedDevice}
                      impact={deviceImpact}
                      health={deviceHealth}
                      metrics={deviceMetrics}
                      loadingImpact={loadingDeviceImpact}
                      onClose={() => setSelectedDevice(null)}
                      onSelectDevice={(dev) => setSelectedDevice(dev)}
                      onSimulate={handleSimulateDevice}
                      canSimulate={canAdmin}
                    />
                  </div>
                ) : (
                  <>
                    {/* Synthetic Telemetry Notice Banner */}
                    <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[9.5px] font-bold text-blue-300 uppercase tracking-wide">
                          <Info className="w-3.5 h-3.5 text-blue-400" />
                          Source: Synthetic / Demo Telemetry
                        </span>
                        <span className="text-[8.5px] font-mono text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-700/50">
                          Active
                        </span>
                      </div>
                      <p className="text-slate-400 text-[9.5px] leading-relaxed">
                        Deterministic synthetic topology active for <span className="text-white font-semibold uppercase">{currentMarket}</span>.
                        Provides simulated optical power levels (dBm), chassis metrics, and downstream impact graphs.
                      </p>
                    </div>

                    {/* Admin Threshold Setpoints Action */}
                    {canAdmin && (
                      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-semibold">
                          <Sliders className="w-3.5 h-3.5 text-blue-400" />
                          <span>Metric Alert Thresholds</span>
                        </div>
                        <button
                          onClick={() => setShowThresholdModal(true)}
                          className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded text-[9.5px] font-bold transition cursor-pointer"
                        >
                          Configure Setpoints
                        </button>
                      </div>
                    )}

                    {/* Network Infrastructure KPIs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">OLTs / POPs</span>
                          <Server className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="text-lg font-black text-white mt-0.5">{networkOverview?.total_olts ?? 0}</div>
                        <div className="text-[9px] text-emerald-400 font-medium">{networkOverview?.olts_online ?? 0} online</div>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Fiber Cabinets</span>
                          <Building2 className="w-3.5 h-3.5 text-yellow-500" />
                        </div>
                        <div className="text-lg font-black text-white mt-0.5">{networkOverview?.total_fiber_cabinets ?? 0}</div>
                        <div className="text-[9px] text-slate-400 font-medium">{networkOverview?.total_splitters ?? 0} splitters</div>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">ONT / ONU Fleet</span>
                          <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div className="text-lg font-black text-white mt-0.5">{networkOverview?.total_ont_onus ?? 0}</div>
                        <div className="text-[9px] text-emerald-400 font-medium">{networkOverview?.ont_online ?? 0} online</div>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Active Alarms</span>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <div className={`text-lg font-black mt-0.5 ${(networkOverview?.active_alarms ?? 0) > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {networkOverview?.active_alarms ?? 0}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">Optical / Link alerts</div>
                      </div>
                    </div>

                    {/* Active Alarms Section */}
                    {networkAlarms.length > 0 && (
                      <div className="bg-slate-900/40 border border-red-900/30 rounded-lg p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-red-300 tracking-wide flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            Active Alarms ({networkAlarms.length})
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {networkAlarms.map(a => {
                            const isCrit = a.severity === 'CRITICAL';
                            return (
                              <div
                                key={a.id}
                                onClick={() => {
                                  if (a.device) {
                                    setSelectedDevice(a.device);
                                  }
                                }}
                                className={`p-2 rounded border cursor-pointer transition ${
                                  isCrit
                                    ? 'bg-red-950/40 border-red-800/50 hover:border-red-600'
                                    : 'bg-amber-950/40 border-amber-800/50 hover:border-amber-600'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                    isCrit ? 'bg-red-900 text-red-200' : 'bg-amber-900 text-amber-200'
                                  }`}>
                                    {a.alarm_code || a.code}
                                  </span>
                                  <span className="text-[8.5px] font-mono text-slate-500">
                                    {a.first_seen_at ? new Date(a.first_seen_at).toLocaleTimeString() : ''}
                                  </span>
                                </div>
                                <div className="text-[10px] font-medium text-slate-200 mt-1 line-clamp-2">
                                  {a.message || a.description}
                                </div>
                                {a.device_code && (
                                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                                    Target: {a.device_code}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* OLT Infrastructure Explorer */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                        <span>OLT Infrastructure ({networkOlts.length})</span>
                        <span className="text-[9px] text-slate-500 font-normal">Click to expand ports</span>
                      </div>

                      <div className="space-y-1.5">
                        {networkOlts.map(olt => {
                          const isExpanded = expandedOltId === olt.id;
                          const ports = oltPortsMap[olt.id] || [];
                          const isLoadingPorts = loadingPortsOltId === olt.id;

                          return (
                            <div
                              key={olt.id}
                              className="bg-slate-900/60 border border-slate-700/50 rounded-lg overflow-hidden transition"
                            >
                              <div
                                onClick={() => toggleExpandOlt(olt.id)}
                                className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition"
                              >
                                <div className="flex items-center gap-2">
                                  <Server className="w-3.5 h-3.5 text-purple-400" />
                                  <div>
                                    <div className="text-[11px] font-bold text-white leading-tight">{olt.name}</div>
                                    <div className="text-[9px] font-mono text-slate-400">{olt.device_code} · {olt.ip_address}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full border ${
                                    olt.status === 'ONLINE' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/50' : 'bg-amber-950/40 text-amber-300 border-amber-600/50'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${olt.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    {olt.status}
                                  </span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="border-t border-slate-800 bg-slate-950/50 p-2.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9.5px] font-bold text-slate-400 uppercase">PON Ports ({olt.active_ports || ports.length} Active)</span>
                                    <button
                                      onClick={() => {
                                        setSelectedDevice(olt);
                                      }}
                                      className="text-[9px] font-semibold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                                    >
                                      Inspect OLT & Impact →
                                    </button>
                                  </div>

                                  {isLoadingPorts ? (
                                    <div className="flex items-center gap-1.5 py-2 text-[10px] text-slate-400">
                                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                      <span>Loading PON ports telemetry...</span>
                                    </div>
                                  ) : ports.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {ports.map(p => (
                                        <div
                                          key={p.id}
                                          className="bg-slate-900/80 border border-slate-800 rounded p-1.5 text-[9px]"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-slate-200">PON {p.port_number}</span>
                                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'UP' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                          </div>
                                          <div className="text-slate-400 text-[8.5px] mt-0.5">
                                            {p.connected_ont_count ?? 0} / {p.max_capacity ?? 64} ONTs
                                          </div>
                                          <div className="text-slate-500 font-mono text-[8px] mt-0.5">
                                            Tx: {p.optical_tx_power_dbm ?? '+2.5'} dBm
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[9.5px] text-slate-500 italic py-1">No PON ports reported.</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="shrink-0 border-t border-slate-800/60 px-3 py-2 flex items-center justify-between">
            <div className="text-[9.5px] text-slate-600">NOC Operations Centre</div>
            <div className="text-[9.5px] font-mono text-slate-500">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Threshold Management Modal */}
      <ThresholdManagerModal
        isOpen={showThresholdModal}
        onClose={() => setShowThresholdModal(false)}
      />
    </div>
  );
};

export default NocTrackingMap;
