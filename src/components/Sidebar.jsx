import React from 'react';
import { 
  LayoutDashboard, 
  Radio, 
  Compass, 
  UserMinus, 
  GitBranch, 
  IndianRupee, 
  ShieldAlert, 
  Search 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const sections = [
    {
      title: "Overview",
      items: [
        { id: 'cockpit', label: 'Executive Cockpit', icon: LayoutDashboard, subtitle: 'Operations summary' },
      ]
    },
    {
      title: "Scored intelligence engines",
      items: [
        { id: 'assurance', label: 'Predictive Service Assurance', icon: Radio, subtitle: 'Node telemetry scoring' },
        { id: 'churn', label: 'Churn Prediction & Retention', icon: UserMinus, subtitle: 'Subscriber risk scoring' },
        { id: 'revenue', label: 'Revenue Assurance', icon: IndianRupee, subtitle: 'Billing anomaly scoring' },
        { id: 'orchestration', label: 'OSS/BSS Orchestration', icon: GitBranch, subtitle: 'Ticket triage scoring' },
      ]
    },
    {
      title: "Governed workflows & data",
      items: [
        { id: 'journeys', label: 'Customer Journeys', icon: Compass, subtitle: 'Lifecycle next-best-action' },
        { id: 'governance', label: 'Governance & Audit Trail', icon: ShieldAlert, subtitle: 'Human sign-off queue' },
        { id: 'customer360', label: 'Customer 360 Explorer', icon: Search, subtitle: 'Subscriber profile search' },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#1C1F27] border-r border-[#2C303C] flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
      <div className="p-3 space-y-5 flex-1">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            <div className="px-3 text-xs font-medium text-[#8B8F99]">
              {sec.title}
            </div>
            <div className="space-y-0.5 pt-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-start space-x-2.5 px-3 py-2 rounded text-left transition-colors ${
                      isActive
                        ? 'bg-[#232733] text-[#EDEBE6] font-medium border-l-2 border-l-[#4FAE8C]'
                        : 'text-[#8B8F99] hover:bg-[#14161C] hover:text-[#EDEBE6]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-[#EDEBE6]' : 'text-[#8B8F99]'}`} />
                    <div className="min-w-0">
                      <div className="text-xs truncate">{item.label}</div>
                      <div className="text-[11px] text-[#8B8F99] truncate font-normal">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Database Connection Footer */}
      <div className="p-3 border-t border-[#2C303C] bg-[#14161C] flex items-center justify-between text-xs text-[#8B8F99]">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FAE8C]"></span>
          <span>PostgreSQL (jeebr_db)</span>
        </div>
        <span className="font-mono text-[11px]">Connected</span>
      </div>
    </aside>
  );
};
