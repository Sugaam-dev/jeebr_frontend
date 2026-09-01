import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Compass,
  UserMinus,
  GitBranch,
  IndianRupee,
  ShieldAlert,
  Search,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab, collapsed, onToggle }) => {
  const { user } = useAuth();

  const sections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'cockpit', label: 'Executive Cockpit', icon: LayoutDashboard, subtitle: 'Operations summary' },
        { id: 'pilot-bundle', label: 'Recommended Pilot Bundle', icon: Sparkles, subtitle: 'End-to-end connected trace' },
      ],
    },
    {
      title: 'SCORED INTELLIGENCE',
      items: [
        { id: 'assurance', label: 'Predictive Assurance', icon: Radio, subtitle: 'Node telemetry scoring' },
        { id: 'churn', label: 'Churn Prediction', icon: UserMinus, subtitle: 'Subscriber risk scoring' },
        { id: 'revenue', label: 'Revenue Assurance', icon: IndianRupee, subtitle: 'Billing anomaly scoring' },
        { id: 'orchestration', label: 'OSS/BSS Orchestration', icon: GitBranch, subtitle: 'Ticket triage scoring' },
      ],
    },
    {
      title: 'GOVERNED WORKFLOWS',
      items: [
        { id: 'journeys', label: 'Customer Journeys', icon: Compass, subtitle: 'Lifecycle next-best-action' },
        { id: 'governance', label: 'Governance & Audit', icon: ShieldAlert, subtitle: 'Human sign-off queue' },
        { id: 'customer360', label: 'Customer 360', icon: Search, subtitle: 'Subscriber profile search' },
      ],
    },
  ];

  return (
    <aside
      className="bg-[#0B1E3D] border-r border-[#152A4A] flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden sidebar-transition z-40 text-slate-300 select-none"
      style={{ width: collapsed ? '4.5rem' : '16.5rem' }}
    >
      {/* Top Logo & Product Name */}
      <div className="h-16 border-b border-[#152A4A] flex items-center px-4 shrink-0">
        <div className={`flex items-center gap-3 w-full ${collapsed ? 'justify-center' : ''}`}>
          {/* Teal/Green Circular Icon Badge */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight truncate">Jeebr Control</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.2 rounded border border-emerald-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 truncate">PMRG Autonomous Loop</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1.5">
            {/* Section Header */}
            {!collapsed ? (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90">
                {sec.title}
              </div>
            ) : (
              <div className="w-6 h-px bg-[#152A4A] mx-auto my-2" />
            )}

            {/* Nav Items */}
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-3 py-2.5 rounded-lg text-left
                      transition-all duration-150 group font-medium text-xs
                      ${collapsed ? 'justify-center px-2' : 'px-3'}
                      ${
                        isActive
                          ? 'bg-[#3B6BFF] text-white shadow-sm font-semibold'
                          : 'text-slate-300 hover:bg-[#152A4A] hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="truncate leading-tight">{item.label}</div>
                        <div
                          className={`text-[10px] truncate leading-tight mt-0.5 ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
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

      {/* Footer / Collapse Toggle */}
      <div className="border-t border-[#152A4A] p-3 shrink-0 bg-[#091830] space-y-2">
        {!collapsed && (
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PostgreSQL Engine</span>
            </div>
            <span className="font-mono text-emerald-400 text-[10px] font-semibold uppercase">Live</span>
          </div>
        )}

        {/* <button
          onClick={() => onToggle(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`
            w-full flex items-center justify-center gap-2 py-2 rounded-lg
            text-slate-400 hover:text-white hover:bg-[#152A4A]
            transition-colors duration-150 text-xs font-medium
          `}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" />
              <span>&lt;&lt; Collapse</span>
            </>
          )}
        </button> */}
      </div>
    </aside>
  );
};
