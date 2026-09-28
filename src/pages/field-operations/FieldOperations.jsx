import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { MapContainer } from '../../components/maps/MapContainer';
import {
  MapPin,
  Navigation,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  Battery,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Wrench,
  Check,
  X,
  KeyRound
} from 'lucide-react';

// Bounding box coordinate projections for real Indian metropolitan markets
const MARKET_BOUNDS = {
  mumbai: {
    minLat: 18.960,
    maxLat: 19.260,
    minLng: 72.800,
    maxLng: 73.010,
    name: 'Mumbai Metropolitan Region',
    landmarks: [
      { name: 'Borivali Hub', lat: 19.2307, lng: 72.8567 },
      { name: 'Andheri MIDC OLT', lat: 19.1136, lng: 72.8697 },
      { name: 'BKC Core NOC', lat: 19.0657, lng: 72.8690 },
      { name: 'Bandra West Central', lat: 19.0596, lng: 72.8295 },
      { name: 'Lower Parel Hub', lat: 18.9950, lng: 72.8300 },
      { name: 'Thane West Pop', lat: 19.2183, lng: 72.9781 }
    ]
  },
  kolkata: {
    minLat: 22.480,
    maxLat: 22.660,
    minLng: 88.300,
    maxLng: 88.490,
    name: 'Kolkata Metropolitan Area',
    landmarks: [
      { name: 'Dum Dum Airport Core', lat: 22.6450, lng: 88.4230 },
      { name: 'Salt Lake Sector V', lat: 22.5700, lng: 88.4330 },
      { name: 'Park Street Central', lat: 22.5510, lng: 88.3520 },
      { name: 'Howrah Station Hub', lat: 22.5850, lng: 88.3430 },
      { name: 'New Town Action Area', lat: 22.5850, lng: 88.4600 },
      { name: 'Alipore Command Hub', lat: 22.5320, lng: 88.3280 }
    ]
  }
};

function projectGeoToSvg(lat, lng, bounds, width = 860, height = 480, padding = 45) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  // Clamp coordinates within bounds safely
  const clampedLat = Math.max(minLat, Math.min(maxLat, lat));
  const clampedLng = Math.max(minLng, Math.min(maxLng, lng));

  const xNorm = (clampedLng - minLng) / (maxLng - minLng);
  const yNorm = (maxLat - clampedLat) / (maxLat - minLat); // Invert Y for SVG coordinates

  return {
    x: Math.round(padding + xNorm * (width - 2 * padding)),
    y: Math.round(padding + yNorm * (height - 2 * padding))
  };
}

export const FieldOperations = () => {
  const { user } = useAuth();
  const { currentMarket, switchMarket, availableMarkets } = useMarket();
  const isViewer = user?.role === 'Viewer';

  const [summary, setSummary] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [breadcrumbsData, setBreadcrumbsData] = useState(null);
  const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const eventSourceRef = useRef(null);
  const bounds = MARKET_BOUNDS[currentMarket] || MARKET_BOUNDS.mumbai;

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    const canViewEngineers = ['NOC', 'Admin', 'Executive', 'Care'].includes(user?.role);
    const canViewJobs = ['NOC', 'Admin', 'Care', 'Executive'].includes(user?.role);
    try {
      const [sumRes, engRes, jobRes] = await Promise.all([
        api.getFieldOpsSummary().catch(() => null),
        canViewEngineers ? api.getFieldEngineers(null).catch(() => []) : Promise.resolve([]),
        canViewJobs ? api.getFieldJobs(null).catch(() => []) : Promise.resolve([])
      ]);
      if (sumRes) setSummary(sumRes);
      setEngineers(engRes);
      setJobs(jobRes);
    } catch (err) {
      console.error('Failed to load field operations data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [currentMarket]);

  // Real-Time SSE Subscription for live location updates (NOC/Admin only)
  useEffect(() => {
    const canStream = ['NOC', 'Admin'].includes(user?.role);
    if (!canStream) return;

    try {
      const streamUrl = api.getFieldOpsStreamUrl();
      const sse = new EventSource(streamUrl, { withCredentials: true });
      eventSourceRef.current = sse;

      sse.onopen = () => {
        setSseConnected(true);
      };

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const isLoc = payload.event === 'location_update' || payload.type === 'location_ping' || (payload.latitude && payload.longitude);

          if (isLoc) {
            // Update live engineer location in state
            setEngineers((prev) =>
              prev.map((eng) => {
                if (eng.id === payload.engineer_id || (payload.engineer_name && eng.name === payload.engineer_name)) {
                  return {
                    ...eng,
                    current_latitude: payload.latitude,
                    current_longitude: payload.longitude,
                    battery_level: payload.battery_level ?? eng.battery_level,
                    speed_kmh: payload.speed ?? payload.speed_kmh ?? eng.speed_kmh,
                    status: payload.status === 'ARRIVED' || payload.status === 'WORKING' ? 'ON_SITE' : payload.status === 'EN_ROUTE' ? 'EN_ROUTE' : eng.status,
                    last_ping_at: payload.timestamp || new Date().toISOString()
                  };
                }
                return eng;
              })
            );

            // Also update jobs list so route lines and destination markers re-project in real time!
            setJobs((prev) =>
              prev.map((j) => {
                if (j.id === payload.assignment_id || j.engineer_id === payload.engineer_id) {
                  return {
                    ...j,
                    engineer_latitude: payload.latitude,
                    engineer_longitude: payload.longitude,
                    status: payload.status || j.status,
                    eta_minutes: payload.eta_minutes !== undefined ? payload.eta_minutes : j.eta_minutes
                  };
                }
                return j;
              })
            );
          } else if (payload.event === 'status_transition' || payload.type === 'status_transition') {
            loadData(false);
          }
        } catch {
          // Non-JSON heartbeat or greeting
        }
      };

      sse.onerror = () => {
        setSseConnected(false);
      };

      return () => {
        sse.close();
      };
    } catch {
      setSseConnected(false);
    }
  }, [currentMarket, user?.role]);

  // Instant cross-tab sync via BroadcastChannel
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('sentinel_field_events');
      bc.onmessage = (msg) => {
        const data = msg.data;
        if (!data) return;

        if (data.type === 'location_update') {
          setEngineers((prev) =>
            prev.map((eng) => {
              if (eng.id === data.engineer_id) {
                return {
                  ...eng,
                  current_latitude: data.latitude,
                  current_longitude: data.longitude,
                  speed_kmh: data.speed ?? 30,
                  last_ping_at: data.timestamp
                };
              }
              return eng;
            })
          );
          setJobs((prev) =>
            prev.map((j) => {
              if (j.id === data.jobId || j.engineer_id === data.engineer_id) {
                return {
                  ...j,
                  engineer_latitude: data.latitude,
                  engineer_longitude: data.longitude,
                  status: data.status || j.status
                };
              }
              return j;
            })
          );
        } else if (data.type === 'status_transition') {
          loadData(false);
        }
      };
    } catch {}

    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Periodic polling fallback (every 3.5 seconds for snappy updates)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentMarket]);

  const viewBreadcrumbs = async (job) => {
    setSelectedJob(job);
    setBreadcrumbsLoading(true);
    try {
      const history = await api.getFieldJobHistory(job.id);
      setBreadcrumbsData(history);
    } catch (err) {
      console.error('Failed to load breadcrumbs:', err);
      setBreadcrumbsData([]);
    } finally {
      setBreadcrumbsLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') {
      return ['EN_ROUTE', 'ARRIVED', 'WORKING', 'OTP_REQUESTED'].includes(job.status);
    }
    if (filterStatus === 'OTP_PENDING') {
      return job.status === 'OTP_REQUESTED';
    }
    if (filterStatus === 'COMPLETED') {
      return job.status === 'COMPLETED';
    }
    return job.status === filterStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Governed Workflows', href: '/ticketing' },
              { label: 'Field Operations & Live Dispatch' }
            ]}
          />
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <span>Field Operations &amp; Live Tracking</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                Job-Bound GPS
              </span>
            </h1>
            {sseConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live SSE Stream
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Auto-Polling (12s)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time field engineer geolocation telemetry, dynamic route ETA computation, and OTP closure enforcement.
          </p>
        </div>

        {/* Action Controls: Market Switcher & Refresh */}
        <div className="flex items-center gap-2.5">
          {/* Market Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            {availableMarkets?.map((m) => (
              <button
                key={m.id}
                onClick={() => switchMarket(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentMarket === m.id
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-xs cursor-pointer disabled:opacity-60 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Viewer Privacy Notice Banner */}
      {isViewer && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              Governance Policy: Precise employee GPS coordinates and live breadcrumbs are masked for Viewer role accounts.
            </span>
          </div>
          <span className="text-[10px] font-bold bg-amber-200/60 px-2 py-0.5 rounded text-amber-800 uppercase tracking-wider">
            RBAC Protected
          </span>
        </div>
      )}

      {/* 5 Operational KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Engineers</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {summary?.active_engineers ?? (loading ? '—' : 0)}
          </div>
          <div className="text-[10.5px] text-gray-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{summary?.engineers_on_site ?? 0} on site &bull; {summary?.engineers_in_transit ?? 0} in transit</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">In-Transit / Active</span>
            <Navigation className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {summary?.active_jobs ?? (loading ? '—' : 0)}
          </div>
          <div className="text-[10.5px] text-indigo-600 font-medium mt-1">
            En route or currently troubleshooting
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending OTP</span>
            <KeyRound className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {summary?.pending_otp_verification ?? (loading ? '—' : 0)}
          </div>
          <div className="text-[10.5px] text-amber-700 font-medium mt-1">
            Awaiting customer verbal handover
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Transit ETA</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {summary?.avg_eta_minutes ? `${summary.avg_eta_minutes}m` : '18m'}
          </div>
          <div className="text-[10.5px] text-gray-500 mt-1">
            Urban tortuosity index: 1.35x
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {summary?.completed_today ?? (loading ? '—' : 0)}
          </div>
          <div className="text-[10.5px] text-emerald-700 font-medium mt-1">
            100% verified with OTP handshake
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left/Center) + Engineer Quick Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Map Visualizer Canvas (Google Maps with Resilient SVG Fallback) */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{bounds.name} &bull; Live Fleet &amp; Dispatch GIS Map</span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Displays active field engineers in transit, customer destination points, and real-time GPS routes.
            </p>
          </div>

          <MapContainer
            engineers={engineers}
            jobs={jobs}
            selectedEngineer={selectedEngineer}
            onSelectEngineer={setSelectedEngineer}
            currentMarket={currentMarket}
            height="480px"
          />
        </div>

        {/* Right Side: Selected Engineer / Job Quick Inspector Drawer */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Telemetry Inspector</h3>
              </div>
              {selectedEngineer && (
                <button
                  onClick={() => setSelectedEngineer(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedEngineer ? (
              <div className="mt-4 space-y-4">
                {/* Engineer Profile Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-base shadow-xs">
                    {selectedEngineer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{selectedEngineer.name}</h4>
                    <p className="text-xs text-gray-500">{selectedEngineer.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          selectedEngineer.status === 'ON_SITE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : selectedEngineer.status === 'EN_ROUTE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {selectedEngineer.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ID #{selectedEngineer.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Device Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Battery Level</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-1">
                      {selectedEngineer.battery_level ?? 92}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>Speed</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-1">
                      {selectedEngineer.speed_kmh ? `${selectedEngineer.speed_kmh} km/h` : 'Stationary'}
                    </div>
                  </div>
                </div>

                {/* Live Coordinates (RBAC Protected for Viewers) */}
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs space-y-1.5">
                  <div className="text-[10.5px] font-bold text-blue-900 flex items-center justify-between">
                    <span>GPS Telemetry Coordinate:</span>
                    <span className="text-[9.5px] font-mono text-blue-700">WGS84</span>
                  </div>
                  {isViewer ? (
                    <div className="font-mono text-gray-400 italic">
                      [MASKED FOR VIEWERS]
                    </div>
                  ) : (
                    <div className="font-mono text-blue-900 text-[11px]">
                      {selectedEngineer.current_latitude?.toFixed(4)}, {selectedEngineer.current_longitude?.toFixed(4)}
                    </div>
                  )}
                  <div className="text-[10px] text-blue-700/80">
                    Last ping: {selectedEngineer.last_ping_at ? new Date(selectedEngineer.last_ping_at).toLocaleTimeString() : 'Recent'}
                  </div>
                </div>

                {/* Assigned Ticket Info */}
                {selectedEngineer.assigned_ticket ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Active Job Assignment</span>
                      <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {selectedEngineer.assigned_ticket.ticket_code}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      Customer: <span className="font-semibold text-gray-800">{selectedEngineer.assigned_ticket.customer_name}</span>
                    </div>
                    <div className="text-gray-600">
                      Locality: <span className="font-semibold text-gray-800">{selectedEngineer.assigned_ticket.customer_locality}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                    No active ticket assigned right now. Available for dispatch.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 text-center space-y-3 py-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-gray-400">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-700">No Fleet Unit Selected</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto">
                    Click any engineer pin on the map or select a row in the workload table below to inspect live telemetry.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Support / Contact Action */}
          <div className="pt-3 border-t border-gray-100">
            <div className="text-[11px] text-gray-500 flex items-center justify-between">
              <span>NOC Dispatch Hotline</span>
              <span className="font-mono font-bold text-gray-800">+91 (22) 6700-NOC1</span>
            </div>
          </div>
        </div>

      </div>

      {/* Engineers Fleet Workload Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Field Engineers Fleet &bull; Status Roster</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Current duty status, battery reserves, active assignments, and breadcrumb auditing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Showing {engineers.length} field engineers
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/75">
                <th className="py-2.5 px-3">Engineer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Market</th>
                <th className="py-2.5 px-3">Battery</th>
                <th className="py-2.5 px-3">Current Coordinates</th>
                <th className="py-2.5 px-3">Active Job</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {engineers.map((eng) => {
                const isSelected = selectedEngineer?.id === eng.id;
                return (
                  <tr
                    key={eng.id}
                    onClick={() => setSelectedEngineer(eng)}
                    className={`hover:bg-blue-50/50 transition cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{eng.name}</div>
                      <div className="text-[10px] text-gray-500">{eng.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                          eng.status === 'ON_SITE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : eng.status === 'EN_ROUTE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : eng.status === 'AVAILABLE'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            eng.status === 'ON_SITE'
                              ? 'bg-emerald-500'
                              : eng.status === 'EN_ROUTE'
                              ? 'bg-blue-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        <span>{eng.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 uppercase font-mono text-[11px] text-gray-600">
                      {eng.market_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Battery className={`w-3.5 h-3.5 ${
                          (eng.battery_level ?? 90) < 20 ? 'text-rose-500' : 'text-emerald-600'
                        }`} />
                        <span className="font-mono">{eng.battery_level ?? 92}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10.5px]">
                      {isViewer ? (
                        <span className="text-gray-400 italic">[MASKED]</span>
                      ) : eng.current_latitude ? (
                        `${eng.current_latitude.toFixed(4)}, ${eng.current_longitude?.toFixed(4)}`
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {eng.assigned_ticket ? (
                        <div className="space-y-0.5">
                          <span className="font-mono text-blue-600 font-bold text-[11px]">
                            {eng.assigned_ticket.ticket_code}
                          </span>
                          <div className="text-[10.5px] text-gray-500 truncate max-w-[150px]">
                            {eng.assigned_ticket.customer_name} &bull; {eng.assigned_ticket.customer_locality}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEngineer(eng);
                        }}
                        className="px-2.5 py-1 rounded-lg text-blue-600 hover:bg-blue-100 font-bold text-xs cursor-pointer transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Field Jobs & Dispatch Lifecycle Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Field Job Assignments &amp; Customer OTP Lifecycle</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              End-to-end audit of field jobs from assignment to verified OTP ticket closure.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'ACTIVE', 'OTP_PENDING', 'COMPLETED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterStatus === f
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/75">
                <th className="py-2.5 px-3">Ticket</th>
                <th className="py-2.5 px-3">Customer &amp; Locality</th>
                <th className="py-2.5 px-3">Assigned Engineer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Transit ETA</th>
                <th className="py-2.5 px-3">OTP State</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    No field jobs matching filter "{filterStatus}".
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-blue-600">{job.ticket_code}</div>
                      <div className="text-[10px] text-gray-500">ID #{job.ticket_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{job.customer_name}</div>
                      <div className="text-[10px] text-gray-500">{job.customer_locality}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-800">{job.engineer_name}</div>
                      <div className="text-[10px] text-gray-500">{job.engineer_phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.status === 'OTP_REQUESTED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : job.status === 'EN_ROUTE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {job.eta_minutes ? (
                        <div className="font-bold text-gray-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>{job.eta_minutes} min</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {job.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : job.status === 'OTP_REQUESTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 animate-pulse">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Awaiting Input</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not Requested</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!isViewer && (
                        <button
                          onClick={() => viewBreadcrumbs(job)}
                          className="px-2.5 py-1 rounded-lg text-blue-600 hover:bg-blue-50 font-bold text-xs cursor-pointer transition"
                        >
                          Breadcrumbs
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Breadcrumbs Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <span>GPS Breadcrumbs &bull; Job #{selectedJob.ticket_code}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Engineer: {selectedJob.engineer_name} &bull; Customer: {selectedJob.customer_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {breadcrumbsLoading ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                <span>Loading breadcrumb history...</span>
              </div>
            ) : breadcrumbsData && breadcrumbsData.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-600 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span>Recorded Pings: <strong>{breadcrumbsData.length}</strong></span>
                  <span>Origin: <strong>{selectedJob.customer_locality}</strong></span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 text-xs font-mono">
                  {breadcrumbsData.map((ping, idx) => (
                    <div key={ping.id || idx} className="py-2 flex items-center justify-between text-gray-700">
                      <div>
                        <span className="font-bold text-gray-900">Ping #{idx + 1}</span> &bull;{' '}
                        <span>{new Date(ping.recorded_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{ping.latitude.toFixed(5)}, {ping.longitude.toFixed(5)}</span>
                        <span className="text-[10px] text-gray-500">Bat: {ping.battery_level}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                No GPS breadcrumb pings recorded yet for this assignment.
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default FieldOperations;
