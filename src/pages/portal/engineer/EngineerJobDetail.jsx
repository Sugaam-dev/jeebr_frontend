import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useGpsTracking } from '../../../context/GpsTrackingContext';
import { toast } from '../../../components/common/Toast';
import {
  Wrench,
  Clock,
  MapPin,
  ArrowLeft,
  RefreshCw,
  Play,
  Pause,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Navigation,
  Check,
  X,
  Radio,
  WifiOff,
  Crosshair,
  Info
} from 'lucide-react';
import {
  BrowserLocationProvider,
  SimulatorLocationProvider,
  LocationError
} from '../../../services/locationProvider';
import { LocationConsentModal } from '../../../components/modals/LocationConsentModal';

const LIFECYCLE_STEPS = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'EN_ROUTE', label: 'En Route' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'WORKING', label: 'Working' },
  { key: 'OTP_REQUESTED', label: 'OTP Sent' },
  { key: 'OTP_VERIFIED', label: 'Verified' },
  { key: 'COMPLETED', label: 'Completed' }
];

export const EngineerJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Completion Form State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('Splice attenuation repaired, customer verified 100 Mbps optical light.');
  const [completing, setCompleting] = useState(false);

  // Real GPS & Location Tracking State (Sections 4, 5, 6, 9, 10)
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [trackingMode, setTrackingMode] = useState('REAL_GPS'); // 'REAL_GPS' | 'SIMULATION' | 'OFF'
  const [trackingStatus, setTrackingStatus] = useState('OFFLINE'); // 'OFFLINE' | 'CONNECTING' | 'LIVE' | 'STALE' | 'LOW_ACCURACY' | 'GPS_UNAVAILABLE' | 'LOCATION_DENIED' | 'TIMEOUT'
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [lastPingTimestamp, setLastPingTimestamp] = useState(null);
  const [trackingErrorMessage, setTrackingErrorMessage] = useState('');
  const [isDevSimulationActive, setIsDevSimulationActive] = useState(false);

  const browserLocationProvider = useRef(
    new BrowserLocationProvider({
      enableHighAccuracy: true,
      timeout: 15000,
      minIntervalMs: 5000,
      minDistanceMeters: 8.0,
      maxAcceptableAccuracyMeters: 150.0
    })
  );
  const simulatorProvider = useRef(new SimulatorLocationProvider());
  const watchIdRef = useRef(null);
  const simTimerRef = useRef(null);
  const jobRef = useRef(null);

  const fetchJob = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      let current = null;
      if (api.getFieldJobDetail) {
        try {
          current = await api.getFieldJobDetail(id);
        } catch (detailErr) {
          console.warn('Direct job detail fetch fallback:', detailErr);
        }
      }
      if (!current) {
        const list = user?.role === 'Field Engineer'
          ? await api.getMyFieldJobs()
          : await api.getFieldJobs();
        current = list.find((j) => String(j.id) === String(id));
      }
      if (current) {
        setJob(current);
      } else if (!jobRef.current) {
        toast.error('Workorder assignment not found.');
      }
    } catch (err) {
      console.error('Failed to load job details:', err);
      if (!jobRef.current) {
        toast.error('Unable to load job details.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJob(true);
  }, [id, user]);

  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  const { setTrackingStatus: setGlobalTrackingStatus, setIsMock: setGlobalIsMock } = useGpsTracking();

  const updateTrackingStatus = (status, isSim = false) => {
    setTrackingStatus(status);
    if (setGlobalTrackingStatus) {
      let globalStatus = status;
      if (status === 'CONNECTING') globalStatus = 'STARTING';
      if (status === 'LOW_ACCURACY' || status === 'TIMEOUT') globalStatus = 'STARTING';
      setGlobalTrackingStatus(globalStatus);
    }
    if (setGlobalIsMock) {
      setGlobalIsMock(isSim);
    }
  };

  const autoResumeAttemptedRef = useRef(false);

  // Auto-resume GPS tracking on mount/re-open if assignment is already EN_ROUTE
  useEffect(() => {
    if (!job || job.status !== 'EN_ROUTE') return;
    if (watchIdRef.current !== null || simTimerRef.current !== null) return;
    if (autoResumeAttemptedRef.current) return;

    autoResumeAttemptedRef.current = true;

    if (!browserLocationProvider.current.isSupported()) {
      updateTrackingStatus('GPS_UNAVAILABLE');
      setTrackingErrorMessage('Browser geolocation is not supported on this device.');
      return;
    }

    browserLocationProvider.current.checkPermissionStatus().then((permission) => {
      if (permission === 'granted') {
        startRealGpsTracking(job);
      } else if (permission === 'denied') {
        updateTrackingStatus('LOCATION_DENIED');
        setTrackingErrorMessage('Location access denied. Please grant browser location permissions.');
      } else {
        setIsConsentModalOpen(true);
      }
    }).catch(() => {
      setIsConsentModalOpen(true);
    });
  }, [job]);

  // Stop tracking handler (Section 6: stops when ARRIVED, COMPLETED, CANCELLED)
  const stopAllTracking = () => {
    if (watchIdRef.current !== null) {
      browserLocationProvider.current.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setIsDevSimulationActive(false);
    updateTrackingStatus('NOT_TRACKING', false);
    setTrackingMode('OFF');
  };

  // Start Real Browser GPS Tracking via W3C watchPosition (Section 4 & 6)
  const startRealGpsTracking = (currentJob) => {
    stopAllTracking();

    if (!browserLocationProvider.current.isSupported()) {
      updateTrackingStatus('GPS_UNAVAILABLE');
      setTrackingErrorMessage('Browser geolocation is not supported on this device.');
      toast.error('Browser geolocation is not supported on this device.');
      return;
    }

    updateTrackingStatus('CONNECTING', false);
    setTrackingMode('REAL_GPS');
    setTrackingErrorMessage('');

    try {
      const watchId = browserLocationProvider.current.watchPosition(
        async (position) => {
          updateTrackingStatus('LIVE', false);
          setLocationAccuracy(position.accuracy);
          const timeStr = new Date().toLocaleTimeString();
          setLastPingTimestamp(new Date().toISOString());
          setTrackingErrorMessage('');

          const activeJob = jobRef.current || currentJob;
          if (!activeJob) return;

          try {
            await api.sendLocationPing(activeJob.id, {
              latitude: position.latitude,
              longitude: position.longitude,
              accuracy: position.accuracy,
              speed: position.speedMps || 0.0,
              heading: position.heading || 0.0,
              is_mock: false
            });

            // Local coordinates update for live map
            setJob((prev) =>
              prev ? { ...prev, current_latitude: position.latitude, current_longitude: position.longitude } : prev
            );

            // Cross-tab broadcast for customer portal and NOC operations
            try {
              const bc = new BroadcastChannel('sentinel_field_events');
              bc.postMessage({
                type: 'location_ping',
                jobId: activeJob.id,
                latitude: position.latitude,
                longitude: position.longitude,
                accuracy: position.accuracy,
                timestamp: position.timestamp,
                is_mock: false
              });
              bc.close();
            } catch {}
          } catch (err) {
            console.warn('[GPS Ping Error]:', err.message);
            if (err.message && (err.message.includes('No active tracking session') || err.message.includes('COMPLETED'))) {
              stopAllTracking();
            }
          }
        },
        (error) => {
          console.warn('[GPS Location Error]:', error);
          if (error.code === 'PERMISSION_DENIED') {
            updateTrackingStatus('LOCATION_DENIED');
            setTrackingErrorMessage('Location access denied. Please grant browser location permissions.');
            toast.error('Location access denied. Please enable GPS permissions.');
          } else if (error.code === 'POSITION_UNAVAILABLE') {
            updateTrackingStatus('GPS_UNAVAILABLE');
            setTrackingErrorMessage('Device GPS signal is unavailable. Check device settings.');
          } else if (error.code === 'TIMEOUT') {
            updateTrackingStatus('TIMEOUT');
            setTrackingErrorMessage('GPS location request timed out. Retrying...');
          } else if (error.code === 'LOW_ACCURACY') {
            updateTrackingStatus('LOW_ACCURACY');
            setTrackingErrorMessage(error.message);
          } else {
            updateTrackingStatus('GPS_UNAVAILABLE');
            setTrackingErrorMessage(error.message || 'GPS signal error.');
          }
        }
      );
      watchIdRef.current = watchId;
    } catch (err) {
      console.error('Failed to initiate watchPosition:', err);
      updateTrackingStatus('GPS_UNAVAILABLE');
    }
  };

  // Start Controlled Dev Mode Simulator (Section 4: explicit dev/test only)
  const startDevSimulationTracking = (currentJob) => {
    stopAllTracking();
    setIsDevSimulationActive(true);
    setTrackingMode('SIMULATION');
    updateTrackingStatus('LIVE', true);
    setLocationAccuracy(4.5);
    setTrackingErrorMessage('');

    const targetLat = currentJob.service_latitude || currentJob.customer_latitude || 19.0760;
    const targetLng = currentJob.service_longitude || currentJob.customer_longitude || 72.8777;

    simTimerRef.current = setInterval(async () => {
      const activeJob = jobRef.current || currentJob;
      if (!activeJob) return;

      const pos = simulatorProvider.current.stepTowards(targetLat, targetLng);
      setLastPingTimestamp(new Date().toISOString());

      try {
        await api.sendLocationPing(activeJob.id, {
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
          speed: pos.speedMps,
          heading: pos.heading,
          is_mock: true
        });

        setJob((prev) =>
          prev ? { ...prev, current_latitude: pos.latitude, current_longitude: pos.longitude } : prev
        );

        try {
          const bc = new BroadcastChannel('sentinel_field_events');
          bc.postMessage({
            type: 'location_ping',
            jobId: activeJob.id,
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy,
            timestamp: pos.timestamp,
            is_mock: true
          });
          bc.close();
        } catch {}
      } catch (err) {
        console.warn('Simulation ping error:', err.message);
      }
    }, 5000);
  };

  // Stale Location Detector (Section 10: mark STALE if > 60s without ping)
  useEffect(() => {
    if (trackingStatus !== 'LIVE' || !lastPingTimestamp) return;

    const staleChecker = setInterval(() => {
      const elapsedSec = (Date.now() - new Date(lastPingTimestamp).getTime()) / 1000;
      if (elapsedSec > 60) {
        setTrackingStatus('STALE');
      }
    }, 10000);

    return () => clearInterval(staleChecker);
  }, [trackingStatus, lastPingTimestamp]);

  // Clean up watchers on unmount
  useEffect(() => {
    return () => {
      stopAllTracking();
    };
  }, []);

  // Handle Lifecycle State Transitions
  const handleTransition = async (targetStatus) => {
    setActionLoading(true);
    const targetJobId = job?.id || job?.assignment_id || id;
    try {
      const updated = await api.transitionFieldJob(targetJobId, targetStatus, `Field transition to ${targetStatus}`);
      toast.success(`Job marked as ${targetStatus.replace('_', ' ')}`);
      setJob(updated);

      // Terminal or non-transit states automatically stop tracking (Section 6)
      if (['ARRIVED', 'WORKING', 'COMPLETED', 'CANCELLED', 'ON_HOLD', 'FAILED'].includes(targetStatus)) {
        stopAllTracking();
      }

      // Cross-tab broadcast for customer and NOC reaction
      try {
        const bc = new BroadcastChannel('sentinel_field_events');
        bc.postMessage({
          type: 'status_transition',
          jobId: updated.id || Number(targetJobId),
          targetStatus,
          timestamp: new Date().toISOString()
        });
        bc.close();
      } catch {}
    } catch (err) {
      console.error('Transition error:', err);
      toast.error(err.message || 'Status transition failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Consent Modal Confirmation: User allowed location tracking (Section 5)
  const handleConsentAllowed = async () => {
    setIsConsentModalOpen(false);
    await handleTransition('EN_ROUTE');
    startRealGpsTracking(job);
  };

  // Request Customer OTP
  const handleRequestOtp = async () => {
    setActionLoading(true);
    const targetJobId = job?.id || job?.assignment_id || id;
    try {
      await api.requestFieldOtp(targetJobId, 'OTP requested at subscriber premise');
      toast.success('OTP generated and dispatched to customer portal!');
      setJob((prev) => ({
        ...prev,
        id: prev?.id || Number(targetJobId),
        assignment_id: Number(targetJobId),
        status: 'OTP_REQUESTED',
        otp_requested_at: new Date().toISOString()
      }));
      await fetchJob(false);

      try {
        const bc = new BroadcastChannel('sentinel_field_events');
        bc.postMessage({
          type: 'status_transition',
          jobId: Number(targetJobId),
          targetStatus: 'OTP_REQUESTED',
          timestamp: new Date().toISOString()
        });
        bc.close();
      } catch {}
    } catch (err) {
      console.error('Request OTP error:', err);
      toast.error(err.message || 'Failed to generate OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setOtpError('OTP must be exactly 6 numeric digits.');
      return;
    }
    const targetJobId = job?.id || job?.assignment_id || id;
    if (!targetJobId || String(targetJobId) === 'undefined') {
      const err = 'Unable to determine valid Job Assignment ID.';
      setOtpError(err);
      toast.error(err);
      return;
    }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await api.verifyFieldOtp(targetJobId, otpCode);
      toast.success('Customer OTP verified successfully! Ready for job completion.');
      setJob((prev) => ({
        ...prev,
        id: prev?.id || Number(targetJobId),
        assignment_id: Number(targetJobId),
        status: 'OTP_VERIFIED',
        otp_verified_at: new Date().toISOString()
      }));
      await fetchJob(false);

      try {
        const bc = new BroadcastChannel('sentinel_field_events');
        bc.postMessage({
          type: 'status_transition',
          jobId: Number(targetJobId),
          targetStatus: 'OTP_VERIFIED',
          timestamp: new Date().toISOString()
        });
        bc.close();
      } catch {}
    } catch (err) {
      console.error('OTP verification error:', err);
      const msg = err.message || 'Invalid or expired OTP code.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setOtpVerifying(false);
    }
  };

  // Complete Job Form
  const handleCompleteJob = async (e) => {
    e.preventDefault();
    const targetJobId = job?.id || job?.assignment_id || id;
    if (!targetJobId || String(targetJobId) === 'undefined') {
      toast.error('Unable to determine valid Job Assignment ID.');
      return;
    }
    setCompleting(true);
    try {
      const res = await api.completeFieldJob(targetJobId, resolutionNotes);
      toast.success('Workorder successfully completed! Ticket closed.');
      setIsCompleteModalOpen(false);
      stopAllTracking();
      if (res && res.id) {
        setJob(res);
      } else {
        setJob((prev) => ({
          ...prev,
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        }));
      }

      try {
        const bc = new BroadcastChannel('sentinel_field_events');
        bc.postMessage({
          type: 'status_transition',
          jobId: Number(targetJobId),
          targetStatus: 'COMPLETED',
          timestamp: new Date().toISOString()
        });
        bc.close();
      } catch {}

      await fetchJob(false);
    } catch (err) {
      console.error('Job completion error:', err);
      toast.error(err.message || 'Failed to complete workorder.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-mono text-xs">Loading workorder telemetry...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Workorder Not Found</h2>
        <Link
          to="/portal/engineer/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Assignments</span>
        </Link>
      </div>
    );
  }

  const currentStepIdx = LIFECYCLE_STEPS.findIndex((s) => s.key === job.status);

  // Status Badge UI helper (Section 9 & 10)
  const renderTrackingBadge = () => {
    switch (trackingStatus) {
      case 'LIVE':
        return (
          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE GPS {locationAccuracy ? `(±${locationAccuracy}m)` : ''}</span>
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1.5 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
            <Radio className="w-3 h-3 animate-spin" />
            <span>CONNECTING GPS...</span>
          </span>
        );
      case 'STALE':
        return (
          <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1.5 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>STALE (&gt;60s)</span>
          </span>
        );
      case 'LOW_ACCURACY':
        return (
          <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1.5 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800">
            <Crosshair className="w-3 h-3 text-amber-400" />
            <span>LOW ACCURACY</span>
          </span>
        );
      case 'LOCATION_DENIED':
        return (
          <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1.5 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-800">
            <WifiOff className="w-3 h-3 text-rose-400" />
            <span>LOCATION DENIED</span>
          </span>
        );
      case 'GPS_UNAVAILABLE':
      case 'TIMEOUT':
        return (
          <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1.5 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>GPS UNAVAILABLE</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignments</span>
        </button>

        <button
          onClick={() => fetchJob(true)}
          disabled={refreshing}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Refresh assignment details"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Main Job Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
                {job.ticket_code || `JOB-#${job.id}`}
              </span>
              <span className="text-sm font-bold text-white">{job.category || 'Optical Fault'}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Customer: <strong>{job.customer_name || 'Subscriber'}</strong></span>
              <span>&bull;</span>
              <span>Locality: <strong>{job.locality || job.customer_locality || 'Bandra West'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                job.priority === 'P1'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}
            >
              {job.priority || 'P2'} Priority
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              {job.status}
            </span>
          </div>
        </div>

        {/* Premise Address & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Premise Service Location</div>
            <div className="text-slate-300 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{job.customer_address || job.service_address || 'Designated premise location'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Customer Contact</div>
            <div className="text-slate-300 font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{job.customer_phone || '+91 98200 48211'}</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Workorder Execution Lifecycle</div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={step.key}
                  className={`p-2 rounded-xl text-center border text-[10px] font-mono font-bold transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md scale-102'
                      : isPast
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                      : 'bg-slate-950/40 text-slate-600 border-slate-800/60'
                  }`}
                >
                  <div className="truncate">{step.label}</div>
                  {isPast && <Check className="w-3 h-3 mx-auto mt-0.5 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button Bar based on current state */}
        <div className="pt-2">
          {job.status === 'ASSIGNED' && (
            <button
              onClick={() => handleTransition('ACCEPTED')}
              disabled={actionLoading}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Accept Field Workorder</span>
            </button>
          )}

          {job.status === 'ACCEPTED' && (
            <button
              onClick={() => setIsConsentModalOpen(true)}
              disabled={actionLoading}
              className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Start Transit to Customer Site</span>
            </button>
          )}

          {job.status === 'EN_ROUTE' && (
            <button
              onClick={() => handleTransition('ARRIVED')}
              disabled={actionLoading}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Mark Arrived On Premise</span>
            </button>
          )}

          {job.status === 'ARRIVED' && (
            <button
              onClick={() => handleTransition('WORKING')}
              disabled={actionLoading}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>Begin Optical Line Repair</span>
            </button>
          )}

          {job.status === 'WORKING' && (
            <button
              onClick={handleRequestOtp}
              disabled={actionLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Generate &amp; Request Customer OTP PIN</span>
            </button>
          )}

          {job.status === 'OTP_REQUESTED' && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Subscriber Handshake PIN Verification</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Ask the customer to read the 6-digit code shown on their Customer Portal screen.
              </p>

              {otpError && (
                <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
                  {otpError}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-Digit PIN"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-amber-500/50 text-amber-200 text-center font-mono tracking-widest text-lg font-bold focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={otpVerifying || otpCode.length !== 6}
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
                >
                  {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            </div>
          )}

          {job.status === 'OTP_VERIFIED' && (
            <button
              onClick={() => setIsCompleteModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Job &amp; Close Ticket</span>
            </button>
          )}

          {job.status === 'COMPLETED' && (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong>Workorder Successfully Completed</strong> &bull; Ticket automatically resolved via OTP verification handshake.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Production Real-Time GPS Tracking Card (Sections 4, 5, 6, 9, 10, 19) */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Engineer Location Tracking
              </h3>
              <p className="text-[11px] text-slate-400">
                W3C Device Geolocation &bull; Ticket #{job.ticket_code || job.id}
              </p>
            </div>
          </div>
          <div>{renderTrackingBadge()}</div>
        </div>

        {/* Location Error Notice if any */}
        {trackingErrorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{trackingErrorMessage}</span>
          </div>
        )}

        {/* Telemetry Status Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-0.5">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Mode</div>
            <div className="font-semibold text-slate-200">{trackingMode}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-0.5">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Accuracy</div>
            <div className="font-semibold text-slate-200">
              {locationAccuracy ? `±${locationAccuracy} meters` : '—'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-0.5">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Last Ping</div>
            <div className="font-semibold text-slate-200 truncate">
              {lastPingTimestamp ? new Date(lastPingTimestamp).toLocaleTimeString() : 'Awaiting transit'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-0.5">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Target Premise</div>
            <div className="font-semibold text-slate-200 truncate">
              {job.customer_locality || 'Bandra West'}
            </div>
          </div>
        </div>

        {/* Manual Location Controls during active EN_ROUTE */}
        {job.status === 'EN_ROUTE' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {trackingStatus === 'LIVE' ? (
                <button
                  type="button"
                  onClick={stopAllTracking}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold font-mono bg-amber-950/60 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-colors flex items-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Tracking</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startRealGpsTracking(job)}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Real GPS</span>
                </button>
              )}
            </div>

            {/* Development / Simulation Mode Toggle (Section 4: explicit test mode only) */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-mono">Dev Test Simulator:</span>
              <button
                type="button"
                onClick={() => {
                  if (isDevSimulationActive) {
                    stopAllTracking();
                  } else {
                    startDevSimulationTracking(job);
                  }
                }}
                className={`py-1.5 px-3 rounded-lg text-[11px] font-mono font-bold border transition-colors ${
                  isDevSimulationActive
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {isDevSimulationActive ? 'Stop Simulator' : 'Start Simulator'}
              </button>
            </div>
          </div>
        )}

        {/* Web GPS Limitation Notice (Section 19) */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Browser Background Limitation:</strong> Mobile browsers (Safari/Chrome) suspend JavaScript and location pings when the browser is backgrounded or the screen is locked. Keep this browser tab open in the foreground while in transit.
          </span>
        </div>
      </div>

      {/* Location Consent Modal (Section 5) */}
      <LocationConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAllow={handleConsentAllowed}
        job={job}
      />

      {/* Completion Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Complete Workorder</h3>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteJob} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Technician Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  OTP Handshake confirmed. Submitting will close the field dispatch and automatically resolve Ticket #{job.ticket_code}.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {completing ? 'Closing Ticket...' : 'Confirm & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineerJobDetail;
