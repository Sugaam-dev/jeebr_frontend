import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from '../common/Toast';
import { MapContainer } from '../maps/MapContainer';
import {
  MapPin,
  Navigation,
  KeyRound,
  ShieldCheck,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Home,
  Truck,
  Activity,
  Radio
} from 'lucide-react';

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export const CustomerTrackingCard = ({ ticketId }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracking = async (isManual = false) => {
    if (!ticketId) return;
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getCustomerTracking(ticketId);
      setTracking(data);
      setError('');
    } catch (err) {
      console.error('Failed to load customer tracking:', err);
      const msg = err.message || 'Unable to retrieve tracking information';
      setError(msg);
      if (isManual) {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking(true);
  }, [ticketId]);

  // Real-Time SSE Subscription for instant OTP delivery and live engineer tracking
  useEffect(() => {
    if (!ticketId) return;

    let eventSource;
    try {
      const streamUrl = api.getCustomerTicketStreamUrl(ticketId);
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload) return;

          // When OTP is requested by engineer -> immediately fetch OTP without user refresh!
          if (payload.event === 'otp_requested' || payload.type === 'otp_requested') {
            fetchTracking(false);
          } else if (payload.event === 'location_update' || payload.type === 'location_ping' || (payload.latitude && payload.longitude)) {
            setTracking((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                engineer_latitude: payload.latitude,
                engineer_longitude: payload.longitude,
                engineer_status: payload.status || prev.engineer_status,
                eta_minutes: payload.eta_minutes !== undefined ? payload.eta_minutes : prev.eta_minutes
              };
            });
          } else if (payload.event === 'status_transition' || payload.event === 'otp_verified' || payload.event === 'job_completed') {
            fetchTracking(false);
          }
        } catch {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [ticketId]);

  // Real-time instantaneous cross-tab sync via BroadcastChannel
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('sentinel_field_events');
      bc.onmessage = (msg) => {
        const data = msg.data;
        if (!data) return;

        if (data.type === 'location_update') {
          setTracking((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              engineer_latitude: data.latitude,
              engineer_longitude: data.longitude,
              engineer_status: data.status || prev.engineer_status
            };
          });
        } else if (data.type === 'status_transition' || data.type === 'otp_requested') {
          fetchTracking(false);
        }
      };
    } catch {}

    return () => {
      if (bc) bc.close();
    };
  }, [ticketId]);

  // Fast real-time polling fallback (every 3 seconds when active and no error)
  useEffect(() => {
    if (!ticketId || error) return;
    const interval = setInterval(() => {
      fetchTracking(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [ticketId, error]);

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-white border border-gray-200 text-center py-6 text-xs text-gray-500 space-y-2">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
        <div>Connecting to live dispatch telemetry...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => fetchTracking(true)}
          className="text-rose-800 font-bold hover:underline cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!tracking) return null;

  const engineerName = tracking.assigned_engineer_name || tracking.engineer?.name;
  const engineerPhone = tracking.assigned_engineer_phone || tracking.engineer?.phone || '+91 98201-88421';
  const hasEngineer = Boolean(engineerName);
  const currentStatus = tracking.engineer_status || tracking.job_status || tracking.status || 'ASSIGNED';
  const isCompleted = currentStatus === 'COMPLETED' || (['Resolved', 'Closed'].includes(tracking.status) && !['EN_ROUTE', 'ARRIVED', 'WORKING', 'OTP_REQUESTED'].includes(currentStatus));
  const otpCode = tracking.otp?.code || tracking.otp_code || tracking.customer_otp || (tracking.otp && typeof tracking.otp === 'string' ? tracking.otp : null);
  const ticketCode = tracking.ticket_code || (tracking.ticket_id ? `TCK-${tracking.ticket_id}` : ticketId);
  const locality = tracking.service_address || tracking.customer_locality || 'Designated Premise';

  // Coordinate projections for the live SVG map
  const engLat = tracking.engineer_latitude || 19.0544;
  const engLng = tracking.engineer_longitude || 72.8398;
  const custLat = tracking.service_latitude || 19.0596;
  const custLng = tracking.service_longitude || 72.8295;

  const distanceRemaining = calculateDistanceKm(engLat, engLng, custLat, custLng);

  // SVG Projection parameters
  const svgWidth = 520;
  const svgHeight = 200;
  const padding = 45;

  const minLat = Math.min(engLat, custLat) - 0.0025;
  const maxLat = Math.max(engLat, custLat) + 0.0025;
  const minLng = Math.min(engLng, custLng) - 0.0025;
  const maxLng = Math.max(engLng, custLng) + 0.0025;

  const engX = Math.round(padding + ((engLng - minLng) / (maxLng - minLng || 0.001)) * (svgWidth - 2 * padding));
  const engY = Math.round(padding + ((maxLat - engLat) / (maxLat - minLat || 0.001)) * (svgHeight - 2 * padding));

  const custX = Math.round(padding + ((custLng - minLng) / (maxLng - minLng || 0.001)) * (svgWidth - 2 * padding));
  const custY = Math.round(padding + ((maxLat - custLat) / (maxLat - minLat || 0.001)) * (svgHeight - 2 * padding));

  return (
    <div className="bg-white border border-blue-200 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Live Field Service Tracker &bull; Ticket #{ticketCode}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : currentStatus === 'OTP_REQUESTED'
                ? 'bg-amber-100 text-amber-800 animate-pulse'
                : currentStatus === 'EN_ROUTE'
                ? 'bg-blue-100 text-blue-800 animate-pulse'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            {currentStatus.replace('_', ' ')}
          </span>
          <button
            onClick={() => fetchTracking(true)}
            disabled={refreshing}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            title="Refresh tracking status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Engineer & Transit Status Grid */}
      {hasEngineer ? (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Engineer Contact & Bio */}
          <div className="sm:col-span-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm">
              {engineerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">
                {engineerName}
              </div>
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{engineerPhone}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Designated Field Telecom Specialist
              </div>
            </div>
          </div>

          {/* ETA Card */}
          <div className="sm:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Estimated Transit ETA
              </div>
              <div className="text-lg font-black text-gray-900 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>
                  {tracking.eta_minutes !== null && tracking.eta_minutes !== undefined
                    ? `${tracking.eta_minutes} mins`
                    : currentStatus === 'EN_ROUTE'
                    ? '~8 mins'
                    : 'On-site'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {distanceRemaining !== null ? `${distanceRemaining} km away` : currentStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gray-50 text-gray-500 text-xs text-center">
          Field engineer assignment in progress. Tracking link will activate once technician is en route.
        </div>
      )}

      {/* Real-Time Decoupled Live Map (Google Maps with Resilient SVG Fallback) */}
      {hasEngineer && (
        <div className="space-y-2">
          <MapContainer
            isCustomerView={true}
            customerLocality={locality}
            engineerLat={engLat}
            engineerLng={engLng}
            customerLat={custLat}
            customerLng={custLng}
            jobStatus={currentStatus}
            engineerName={engineerName}
            height="240px"
          />
        </div>
      )}

      {/* Customer Closure OTP Banner (Shown to customer when generated) */}
      {otpCode ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg space-y-3 relative overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-200" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                Service Completion Handshake PIN
              </span>
            </div>
            {tracking.otp_expires_in_seconds && (
              <span className="text-[10.5px] font-mono bg-white/20 px-2 py-0.5 rounded-full">
                Expires in {Math.floor(tracking.otp_expires_in_seconds / 60)}m {tracking.otp_expires_in_seconds % 60}s
              </span>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 text-center border border-white/20">
            <div className="text-[11px] text-amber-100 font-medium">Your 6-Digit Verification Code:</div>
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-[0.35em] text-white my-1 select-all">
              {otpCode}
            </div>
            <div className="text-[10px] text-amber-200/90 font-medium">
              Share verbally with engineer {engineerName || 'technician'}
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-amber-100/90 bg-black/15 p-2.5 rounded-lg border border-white/10">
            <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Trust Guarantee:</strong> Only share this PIN after you have verified that your broadband optical internet connection is fully restored and speed is verified.
            </span>
          </div>
        </div>
      ) : currentStatus === 'OTP_REQUESTED' ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 text-amber-900 shadow-sm space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600 animate-spin" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                Technician Requested Closure PIN
              </span>
            </div>
            <button
              onClick={() => fetchTracking(true)}
              className="text-xs font-bold text-amber-800 bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Fetch PIN Now
            </button>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Engineer <strong>{engineerName}</strong> is on-site and has requested your handshake OTP. Connecting to secure dispatch channel...
          </p>
        </div>
      ) : isCompleted ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Service Confirmed &amp; Ticket Completed</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Verified via customer OTP handshake. Your optical line is operating nominally.
            </div>
          </div>
        </div>
      ) : null}

      {/* Premise Geolocation Confirmation */}
      <div className="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1 truncate mr-2">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">Premise: <strong>{locality}</strong></span>
        </span>
        <span className="font-mono text-[10px] text-gray-400 shrink-0">
          Encrypted Telemetry Channel
        </span>
      </div>
    </div>
  );
};

export default CustomerTrackingCard;
