import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, 
  Bell, 
  Calendar, 
  ChevronDown, 
  LogOut, 
  CheckCircle2, 
  Search, 
  ShieldAlert, 
  Radio, 
  UserMinus, 
  IndianRupee, 
  X, 
  CheckCheck, 
  ArrowRight
} from 'lucide-react';
import logoImg from '../../assets/logo_pmrg.png';

export const Navbar = ({ onToggleSidebar, sidebarCollapsed, onToggleMobileMenu, onOpen360Global }) => {
  const { user, demoLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-gov-1',
      type: 'approval',
      title: 'Pending Governance Sign-off',
      description: '3 automated actions awaiting authorized domain lead approval.',
      time: '2m ago',
      unread: true,
      targetTab: 'governance',
      icon: ShieldAlert,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'notif-node-1',
      type: 'network',
      title: 'Optical Attenuation Alert: Bandra West',
      description: 'Rx power dropped to -29.8 dBm (critical fiber micro-bending).',
      time: '12m ago',
      unread: true,
      targetTab: 'assurance',
      icon: Radio,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      id: 'notif-churn-1',
      type: 'churn',
      title: 'High Churn Propensity Flagged',
      description: '5 high-ARPU corporate subscribers scored >75% churn risk.',
      time: '28m ago',
      unread: true,
      targetTab: 'churn',
      icon: UserMinus,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'notif-rev-1',
      type: 'revenue',
      title: 'Catalog Tariff Mismatch Detected',
      description: '₹48,500 unbilled speed boost add-on detected in billing ledger.',
      time: '1h ago',
      unread: false,
      targetTab: 'revenue',
      icon: IndianRupee,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    }
  ]);

  const notifRef = useRef(null);
  const datePickerRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpen360Global) {
          onOpen360Global();
        } else {
          navigate('/customer360');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen360Global, navigate]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const demoRoles = [
    { label: 'Executive', role: 'Executive' },
    { label: 'NOC Lead', role: 'NOC' },
    { label: 'Care Lead', role: 'Care' },
    { label: 'Revenue Lead', role: 'Revenue' },
    { label: 'Admin', role: 'Admin' },
  ];

  const getInitials = (name) => {
    if (!name) return 'SO';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const dismissNotification = (e, id) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (item) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
    setShowNotifications(false);
    if (item.targetTab) {
      navigate(`/${item.targetTab}`);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UNREAD') return n.unread;
    return n.type === activeFilter;
  });

  const handleSearchClick = () => {
    if (onOpen360Global) {
      onOpen360Global();
    } else {
      navigate('/customer360');
    }
  };

  return (
    <header className="h-16 bg-[#0A1F66] border-b border-[#152D75] flex items-center justify-between px-3 sm:px-5 lg:px-6 sticky top-0 z-30 select-none text-white shadow-sm">
      {/* Left: Hamburger & Branding & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={onToggleMobileMenu}
          title="Open Navigation Menu"
          className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors md:hidden shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile App Brand Indicator */}
        <div className="flex items-center gap-2 md:hidden shrink-0">
          <img src={logoImg} alt="SentinelOS" className="h-6 w-auto object-contain" />
          <span className="font-bold text-sm text-white tracking-tight">SentinelOS</span>
        </div>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Search Bar matching Reference */}
        <button
          onClick={handleSearchClick}
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#071B63]/80 border border-[#152D75] hover:border-blue-500/40 text-xs text-blue-200/70 hover:text-blue-100 transition-all cursor-pointer w-full max-w-sm sm:max-w-md group shadow-inner"
          title="Press Ctrl+K or Cmd+K to search subscribers, models, policies"
        >
          <Search className="w-3.5 h-3.5 text-blue-300 group-hover:text-blue-200 shrink-0" />
          <span className="truncate text-left flex-1 font-normal text-[11.5px]">
            Search models, policies, subscribers...
          </span>
          <kbd className="hidden md:inline-block text-[9.5px] bg-white/10 border border-white/15 px-1.5 py-0.5 rounded text-blue-200 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Icon Trigger */}
        <button
          onClick={handleSearchClick}
          title="Search"
          className="sm:hidden p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Date Filter Dropdown */}
        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-blue-100 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            <span className="hidden md:inline text-[11.5px]">{dateRange}</span>
            <ChevronDown className="w-3 h-3 text-blue-300/80 shrink-0" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 text-xs text-gray-800 animate-in fade-in zoom-in-95 duration-100">
              {['Today', 'Last 7 Days', 'Last 30 Days', 'This Quarter', 'Custom Range...'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setShowDatePicker(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between cursor-pointer ${
                    dateRange === range ? 'text-blue-600 font-semibold bg-blue-50/60' : 'text-gray-700'
                  }`}
                >
                  <span>{range}</span>
                  {dateRange === range && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Role Switcher Pills */}
        <div className="hidden xl:flex items-center bg-[#071B63]/90 p-1 rounded-lg border border-[#152D75] text-xs">
          <span className="text-[9.5px] font-bold text-blue-300/60 px-2 uppercase tracking-wider">Role</span>
          {demoRoles.map((r) => {
            const isActive = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => demoLogin(r.role)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2463EB] text-white shadow-xs font-semibold'
                    : 'text-blue-200/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title={`${unreadCount} unread alerts`}
            className={`relative p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
              showNotifications ? 'bg-white/15 text-white' : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-500 text-white text-[8.5px] font-bold flex items-center justify-center ring-2 ring-[#0A1F66]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-96 max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-xs text-gray-900 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3.5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">SentinelOS Alerts</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-white overflow-x-auto">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'UNREAD', label: `Unread (${unreadCount})` },
                  { key: 'approval', label: 'Approvals' },
                  { key: 'network', label: 'Network' },
                  { key: 'churn', label: 'Churn' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeFilter === f.key
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Items List */}
              <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-gray-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 space-y-1">
                    <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500/60 mb-2" />
                    <p className="font-semibold text-gray-700 text-xs">All clear</p>
                    <p className="text-[11px] text-gray-400">No unread notifications at this time.</p>
                  </div>
                ) : (
                  filteredNotifications.map(n => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 hover:bg-blue-50/40 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                          n.unread ? 'bg-blue-50/30' : 'bg-white'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg border shrink-0 ${n.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`text-xs font-semibold truncate ${n.unread ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[9.5px] text-gray-400 font-mono whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                            {n.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1 text-[10.5px] text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                            <span>Open view</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>

                        <button
                          onClick={(e) => dismissNotification(e, n.id)}
                          title="Dismiss notification"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-opacity absolute top-2.5 right-2 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Popover Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Autonomous telemetry</span>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/governance');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Governance Queue &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar + Name */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-2.5 pl-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0">
              {getInitials(user.full_name)}
            </div>

            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-white leading-tight truncate max-w-[110px]">
                {user.full_name}
              </div>
              <div className="text-[10px] text-blue-200/60 leading-tight mt-0.5">
                {user.role}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              title="Sign out"
              className="p-1 sm:p-1.5 rounded-lg text-blue-200/70 hover:text-white hover:bg-white/10 transition-colors ml-0.5 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
