import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { useGpsTracking } from '../../context/GpsTrackingContext';
import { 
  LogOut, 
  Wrench, 
  Battery, 
  Wifi, 
  MapPin, 
  Radio, 
  ChevronLeft 
} from 'lucide-react';
import logoImg from '../../assets/logo_pmrg.png';

export const EngineerLayout = () => {
  const { user, logout } = useAuth();
  const { currentMarket } = useMarket();
  const { trackingStatus, isMock } = useGpsTracking();
  const navigate = useNavigate();

  const [batteryLevel, setBatteryLevel] = useState(92);

  // Simulated device battery check
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery?.().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Mobile Field Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-2.5">
            <Link to="/portal/engineer/jobs" className="flex items-center gap-2">
              <img
                src={logoImg}
                alt="SentinelOS Logo"
                className="h-7 w-auto object-contain filter brightness-125"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-sm font-black tracking-wide text-white">
                    Sentinel<span className="text-amber-400">OS</span>
                  </span>
                  <span className="text-[9.5px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30 uppercase tracking-wider">
                    Field Ops
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                  Mobile Workbench
                </span>
              </div>
            </Link>
          </div>

          {/* Hardware & Telemetry Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Dynamic GPS Telemetry Indicator */}
            {trackingStatus === 'LIVE' ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold" title="Active Real GPS Telemetry">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">{isMock ? 'GPS (DEV SIM)' : 'GPS LIVE'}</span>
              </div>
            ) : trackingStatus === 'STARTING' ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-950/70 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold" title="Acquiring GPS Signal...">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span className="hidden sm:inline">GPS STARTING</span>
              </div>
            ) : trackingStatus === 'STALE' ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/70 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold" title="GPS Signal Stale (>60s)">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="hidden sm:inline">GPS STALE</span>
              </div>
            ) : trackingStatus === 'LOCATION_DENIED' ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-950/70 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold" title="Location Permission Denied">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="hidden sm:inline">GPS DENIED</span>
              </div>
            ) : trackingStatus === 'GPS_UNAVAILABLE' ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-950/70 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold" title="GPS Hardware Unavailable">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="hidden sm:inline">GPS UNAVAILABLE</span>
              </div>
            ) : trackingStatus === 'OFFLINE' ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold" title="Network Offline">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="hidden sm:inline">GPS OFFLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 text-[10px] font-mono" title="GPS Inactive (No Active Workorder Transit)">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="hidden sm:inline">NOT TRACKING</span>
              </div>
            )}

            {/* Battery Indicator */}
            <div className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
              <Battery className="w-3.5 h-3.5 text-amber-400" />
              <span>{batteryLevel}%</span>
            </div>

            {/* Market Indicator */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold uppercase">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span>{currentMarket || 'mumbai'}</span>
            </div>

            {/* Engineer Profile & Logout */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white leading-none">
                  {user?.full_name || 'Field Specialist'}
                </div>
                <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                  {user?.role}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-3 text-center text-[10.5px] text-slate-500 font-mono">
        SentinelOS Field Execution Environment &bull; Encrypted GPS Telemetry
      </footer>
    </div>
  );
};

export default EngineerLayout;
