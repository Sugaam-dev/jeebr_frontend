import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Menu, 
  Bell, 
  Calendar, 
  ChevronDown, 
  LogOut, 
  CheckCircle2,
  SlidersHorizontal,
  Search,
  ShieldAlert,
  Radio,
  UserMinus,
  IndianRupee,
  X,
  CheckCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar, sidebarCollapsed, onOpen360Global, onNavigate }) => {
  const { user, demoLogin, logout } = useAuth();
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
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      id: 'notif-node-1',
      type: 'network',
      title: 'Optical Attenuation Alert: Andheri East',
      description: 'Rx power dropped to -27.8 dBm (critical fiber micro-bending).',
      time: '12m ago',
      unread: true,
      targetTab: 'assurance',
      icon: Radio,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
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
      color: 'text-purple-600 bg-purple-50 border-purple-200'
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
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    }
  ]);

  const notifRef = useRef(null);
  const datePickerRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpen360Global) onOpen360Global();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen360Global]);

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
    if (!name) return 'JB';
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
    if (onNavigate && item.targetTab) {
      onNavigate(item.targetTab);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UNREAD') return n.unread;
    return n.type === activeFilter;
  });

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs select-none">
      {/* Left: Hamburger Menu & Date Picker */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Date Range Picker Button */}
        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-xs font-medium text-gray-700 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showDatePicker && (
            <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 text-xs">
              {['Today', 'Last 7 Days', 'Last 30 Days', 'This Quarter', 'Custom Range...'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setShowDatePicker(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer ${
                    dateRange === range ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-gray-700'
                  }`}
                >
                  <span>{range}</span>
                  {dateRange === range && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Quick Trigger */}
        {onOpen360Global && (
          <button
            onClick={onOpen360Global}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            title="Press Ctrl+K or Cmd+K to search subscribers"
          >
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Search subscriber (e.g. CUST-1042)...</span>
            <kbd className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-400 font-mono">⌘K</kbd>
          </button>
        )}
      </div>

      {/* Right: Role Switcher, Notification Bell, User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Selector Pill */}
        <div className="hidden lg:flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
          <span className="text-[10.5px] font-semibold text-gray-400 px-2 uppercase tracking-wider">Role</span>
          {demoRoles.map((r) => {
            const isActive = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => demoLogin(r.role)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Notification Bell with Full Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title={`${unreadCount} unread notifications`}
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Center Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col text-xs">
              {/* Popover Header */}
              <div className="p-3.5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
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
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeFilter === f.key
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 space-y-1">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60 mb-2" />
                    <p className="font-semibold text-gray-700 text-xs">All clear!</p>
                    <p className="text-[11px] text-gray-400">No unread notifications at this time.</p>
                  </div>
                ) : (
                  filteredNotifications.map(n => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                          n.unread ? 'bg-blue-50/40' : 'bg-white'
                        }`}
                      >
                        <div className={`p-2 rounded-xl border shrink-0 ${n.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`text-xs font-semibold truncate ${n.unread ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                            {n.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                            <span>Open view</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>

                        <button
                          onClick={(e) => dismissNotification(e, n.id)}
                          title="Dismiss notification"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-opacity absolute top-2.5 right-2 cursor-pointer"
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
                <span className="text-gray-500">Autonomous PMRG telemetry</span>
                {onNavigate && (
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('governance');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    View Governance Queue &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-3 pl-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {getInitials(user.full_name)}
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-gray-900 leading-tight">
                {user.full_name}
              </div>
              <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                {user.role} role
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

