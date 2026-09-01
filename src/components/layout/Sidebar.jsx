import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Compass,
  UserMinus,
  GitBranch,
  IndianRupee,
  ShieldAlert,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import logoImg from '../../assets/logo_pmrg.png';

export const Sidebar = ({ collapsed, onToggle, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current active route
  const currentPath = location.pathname.replace(/^\/+/, '').split('/')[0] || 'cockpit';

  const sections = [
    {
      title: 'AI GOVERNANCE',
      items: [
        { id: 'cockpit', label: 'Overview', icon: LayoutDashboard, subtitle: 'Operations cockpit' },
        { id: 'pilot-bundle', label: 'Risk Topology & Trace', icon: Sparkles, subtitle: 'Connected E2E trace' },
      ],
    },
    {
      title: 'SCORED INTELLIGENCE',
      items: [
        { id: 'assurance', label: 'Predictive Assurance', icon: Radio, subtitle: 'Node telemetry & optical' },
        { id: 'churn', label: 'Churn Prediction', icon: UserMinus, subtitle: 'Subscriber risk models' },
        { id: 'revenue', label: 'Revenue Assurance', icon: IndianRupee, subtitle: 'Leakage & tariff anomaly' },
        { id: 'orchestration', label: 'OSS/BSS Orchestration', icon: GitBranch, subtitle: 'Auto-remediation queue' },
      ],
    },
    {
      title: 'GOVERNED WORKFLOWS',
      items: [
        { id: 'journeys', label: 'Customer Journeys', icon: Compass, subtitle: 'Lifecycle Next-Best-Action' },
        { id: 'governance', label: 'Governance & Audits', icon: ShieldAlert, subtitle: 'Human sign-off queue' },
        { id: 'customer360', label: 'Customer 360', icon: Search, subtitle: 'Subscriber intelligence' },
      ],
    },
  ];

  const handleNavigate = (id) => {
    navigate(`/${id}`);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          bg-[#0F225A] border-r border-[#1B3679] flex flex-col h-screen shrink-0 overflow-hidden 
          sidebar-transition select-none text-slate-100 z-50 shadow-md
          ${isMobileOpen 
            ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl w-64' 
            : 'sticky top-0 hidden md:flex'
          }
        `}
        style={{ width: isMobileOpen ? '16.5rem' : collapsed ? '4.5rem' : '16rem' }}
      >
        {/* Top Brand / Logo Header with SentinelOS Name (Sidebar hamburger removed) */}
        <div className="h-16 border-b border-[#1B3679] flex items-center px-3.5 shrink-0 bg-[#0C1B4A] justify-between">
          <div 
            onClick={() => handleNavigate('cockpit')}
            className={`flex items-center cursor-pointer py-1 min-w-0 ${collapsed && !isMobileOpen ? 'justify-center w-full' : 'justify-start gap-2.5 flex-1'}`}
          >
            {/* PMRG Logo image */}
            <img 
              src={logoImg} 
              alt="SentinelOS Logo" 
              className={`object-contain filter brightness-110 drop-shadow transition-all shrink-0 ${
                collapsed && !isMobileOpen 
                  ? 'h-8 max-w-[38px]' 
                  : 'h-8 max-w-[100px]'
              }`}
            />
            
            {/* Prominent SentinelOS Name & Subtitle */}
            {(!collapsed || isMobileOpen) && (
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[13px] font-extrabold text-white tracking-wide font-sans">
                    Sentinel<span className="text-cyan-400">OS</span>
                  </span>
                  <span className="text-[8.5px] bg-blue-500/30 text-cyan-200 font-bold px-1 py-0.2 rounded border border-cyan-400/30 uppercase tracking-wider shrink-0">
                    v1.0
                  </span>
                </div>
                <span className="text-[9px] text-blue-200/70 font-medium tracking-tight truncate mt-0.5">
                  AI Governance Platform
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile only */}
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 md:hidden ml-1 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-5">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              {/* Section Header */}
              {!collapsed || isMobileOpen ? (
                <div className="px-3 text-[9.5px] font-bold uppercase tracking-wider text-blue-200/60 py-1">
                  {sec.title}
                </div>
              ) : (
                <div className="w-6 h-px bg-[#1B3679] mx-auto my-2" />
              )}

              {/* Nav Items */}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      title={collapsed && !isMobileOpen ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-3 py-2 rounded-xl text-left
                        transition-all duration-150 group font-medium text-xs cursor-pointer
                        ${collapsed && !isMobileOpen ? 'justify-center px-2' : 'px-3'}
                        ${
                          isActive
                            ? 'bg-[#2563EB] text-white shadow-md font-semibold ring-1 ring-white/20'
                            : 'text-blue-100/80 hover:bg-[#183685] hover:text-white'
                        }
                      `}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-blue-200/70 group-hover:text-white'
                        }`}
                      />
                      {(!collapsed || isMobileOpen) && (
                        <div className="min-w-0 flex-1">
                          <div className="truncate leading-tight">{item.label}</div>
                          <div
                            className={`text-[9.5px] truncate leading-tight mt-0.5 ${
                              isActive ? 'text-blue-100' : 'text-blue-200/50'
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
