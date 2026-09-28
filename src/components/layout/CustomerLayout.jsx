import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { 
  LogOut, 
  Home, 
  Ticket, 
  ShieldCheck, 
  HelpCircle, 
  Wifi, 
  MapPin, 
  ChevronDown,
  Navigation
} from 'lucide-react';
import logoImg from '../../assets/logo_pmrg.png';

export const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const { currentMarket, setMarket, availableMarkets } = useMarket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/portal/customer/home" className="flex items-center gap-2.5 group">
              <img
                src={logoImg}
                alt="SentinelOS Logo"
                className="h-8 w-auto object-contain filter brightness-105 transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-tight text-[#0F225A]">
                    Sentinel<span className="text-blue-600">OS</span>
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    Customer Portal
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Broadband &amp; Fiber Subscriber Services
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/portal/customer/home"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/portal/customer/tickets"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>My Tickets</span>
            </NavLink>
            <NavLink
              to="/portal/customer/tracking"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Tracking &bull; PIN</span>
            </NavLink>
          </nav>

          {/* User Controls & Logout */}
          <div className="flex items-center gap-2.5">
            {/* Market Indicator */}
            {availableMarkets && availableMarkets.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span className="capitalize">{currentMarket || 'mumbai'}</span>
              </div>
            )}

            {/* User Greeting Pill */}
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {(user?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.full_name || 'Subscriber'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Subnav */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-4 py-2 bg-slate-50/50">
          <NavLink
            to="/portal/customer/home"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                isActive ? 'text-blue-700 bg-blue-100/70' : 'text-slate-600'
              }`
            }
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/portal/customer/tickets"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                isActive ? 'text-blue-700 bg-blue-100/70' : 'text-slate-600'
              }`
            }
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>My Tickets</span>
          </NavLink>
          <NavLink
            to="/portal/customer/tracking"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                isActive ? 'text-blue-700 bg-blue-100/70' : 'text-slate-600'
              }`
            }
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Live Tracking</span>
          </NavLink>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Simplified Customer Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero-Trust Subscriber Verification &bull; Handshake PIN Enforced</span>
          </div>
          <div className="flex items-center gap-3">
            <span>24/7 Support: 1800-PMRG-ISP</span>
            <span>&bull;</span>
            <span className="font-mono text-[11px] text-slate-400">SentinelOS v3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
