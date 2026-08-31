import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const Navbar = ({ onOpen360Global }) => {
  const { user, demoLogin, logout } = useAuth();

  const demoRoles = [
    { label: 'Executive', role: 'Executive' },
    { label: 'NOC Lead', role: 'NOC' },
    { label: 'Care Lead', role: 'Care' },
    { label: 'Revenue Lead', role: 'Revenue' },
    { label: 'Admin', role: 'Admin' },
  ];

  return (
    <header className="h-14 bg-[#1C1F27] border-b border-[#2C303C] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Brand & Context */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-[#232733] border border-[#2C303C] flex items-center justify-center font-bold text-[#EDEBE6] text-xs font-mono">
            JS
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#EDEBE6] text-sm tracking-tight">Jeebr Internet</span>
              <span className="text-[11px] text-[#8B8F99]">&bull; PMRG AI Overlay</span>
            </div>
          </div>
        </div>

        {/* Operating Loop Status */}
        <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-[#2C303C] text-xs text-[#8B8F99]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FAE8C]"></span>
          <span>Operating loop: Observe &rarr; Predict &rarr; Recommend &rarr; Approve &rarr; Execute &rarr; Learn</span>
        </div>
      </div>

      {/* Role Switcher & User Profile */}
      <div className="flex items-center space-x-4">
        {/* Role Switcher */}
        <div className="hidden md:flex items-center space-x-1 bg-[#14161C] p-1 rounded border border-[#2C303C]">
          <span className="text-xs text-[#8B8F99] px-2 font-medium">Role:</span>
          {demoRoles.map((r) => {
            const isActive = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => demoLogin(r.role)}
                className={`text-xs px-2.5 py-1 rounded transition-colors font-medium ${
                  isActive
                    ? 'bg-[#232733] text-[#EDEBE6] font-semibold border border-[#2C303C]'
                    : 'text-[#8B8F99] hover:text-[#EDEBE6]'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Active User info */}
        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-[#2C303C]">
            <div className="text-right">
              <div className="text-xs font-medium text-[#EDEBE6]">{user.full_name}</div>
              <div className="text-[11px] text-[#8B8F99]">{user.role} role</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded text-[#8B8F99] hover:text-[#EDEBE6] hover:bg-[#232733] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
