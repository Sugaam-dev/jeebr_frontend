import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Calendar, 
  ChevronDown, 
  Bell, 
  LogOut, 
  CheckCircle2, 
  ShieldAlert, 
  Radio, 
  UserMinus, 
  IndianRupee, 
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import logoImg from '../../assets/logo_pmrg.png';

export const Navbar = ({ 
  onToggleSidebar, 
  sidebarCollapsed, 
  onToggleMobileMenu, 
  onOpen360Global,
  onDateRangeChange
}) => {
  const { user, demoLogin, logout } = useAuth();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState('Today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [filterToast, setFilterToast] = useState('');

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

  const dateOptions = [
    'Today',
    'Last 7 Days',
    'Last 30 Days',
    'This Quarter',
    'Custom Range...'
  ];

  const handleSelectDateRange = (range) => {
    setDateRange(range);
    setShowDatePicker(false);
    api.clearCache();
    
    // Dispatch global event for active page telemetry reload
    window.dispatchEvent(new CustomEvent('date-range-change', { detail: { range } }));
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }

    setFilterToast(`Telemetry filtered: ${range}`);
    setTimeout(() => setFilterToast(''), 3000);
  };

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
    <header className="h-16 bg-[#142C6F] border-b border-[#1B3679] flex items-center justify-between px-3 sm:px-5 lg:px-6 sticky top-0 z-30 select-none text-white shadow-sm transition-colors">
      
      {/* Toast feedback for filter change */}
      {filterToast && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{filterToast}</span>
        </div>
      )}

      {/* Left: Single Hamburger & Search */}
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

        {/* Desktop Single Hamburger Trigger */}
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
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#0F225A]/80 border border-[#1B3679] hover:border-blue-400/50 text-xs text-blue-200/80 hover:text-blue-100 transition-all cursor-pointer w-full max-w-sm sm:max-w-md group shadow-inner"
          title="Press Ctrl+K or Cmd+K to search subscribers, models, policies"
        >
          <Search className="w-3.5 h-3.5 text-blue-300 group-hover:text-blue-200 shrink-0" />
          <span className="truncate text-left flex-1 font-normal text-[11.5px]">
            Search models, policies, subscribers...
          </span>
          <kbd className="hidden md:inline-block text-[9.5px] bg-white/10 border border-white/15 px-1.5 py-0.5 rounded text-blue-200 font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Date Filter & Role Switcher & Notifications & User */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        
        {/* Working Date Range Filter Dropdown */}
        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0F225A]/80 border border-[#1B3679] hover:bg-[#183685] hover:border-blue-400/50 text-xs text-blue-100 font-medium transition-all cursor-pointer shadow-inner"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="text-[11.5px] hidden sm:inline">{dateRange}</span>
            <ChevronDown className={`w-3 h-3 text-blue-200/70 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                Filter Telemetry Range
              </div>
              {dateOptions.map((range) => (
                <button
                  key={range}
                  onClick={() => handleSelectDateRange(range)}
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between cursor-pointer transition-colors ${
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
        <div className="hidden xl:flex items-center bg-[#0F225A]/90 p-1 rounded-xl border border-[#1B3679] text-xs">
          <span className="text-[9.5px] font-bold text-blue-300/60 px-2 uppercase tracking-wider">Role</span>
          {demoRoles.map((r) => {
            const isActive = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => demoLogin(r.role)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
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
            className={`relative p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
              showNotifications ? 'bg-white/15 text-white' : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-500 text-white text-[8.5px] font-bold flex items-center justify-center ring-2 ring-[#142C6F]">
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
                  { key: 'approval', label: 'Sign-offs' },
                  { key: 'network', label: 'Network' },
                  { key: 'churn', label: 'Churn' },
                  { key: 'revenue', label: 'Revenue' }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                      activeFilter === f.key
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p className="font-medium text-xs">No notifications in this filter</p>
                  </div>
                ) : (
                  filteredNotifications.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-3.5 hover:bg-blue-50/50 transition-colors flex items-start gap-3 cursor-pointer group ${
                          item.unread ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 border ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Sign Out */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-2.5 pl-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0">
              {getInitials(user.full_name)}
            </div>

            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-white leading-tight truncate max-w-[110px]">
                {user.full_name}
              </div>
              <div className="text-[10px] text-blue-200/70 leading-tight mt-0.5">
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
