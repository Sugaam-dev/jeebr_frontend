import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginModal = () => {
  const { login, demoLogin, loading } = useAuth();
  const [email, setEmail] = useState('executive@jeebr.in');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const demoRoles = [
    {
      role: 'Executive',
      title: 'Executive (C-Suite)',
      desc: 'Operations overview, network health, revenue leakage, and churn trends (read-only).'
    },
    {
      role: 'NOC',
      title: 'NOC / Network Lead',
      desc: 'Predictive assurance, optical telemetry readings, and field dispatch authorizations.'
    },
    {
      role: 'Care',
      title: 'Care & Retention Lead',
      desc: 'Subscriber churn scores, factor explainability, and retention offer authorizations.'
    },
    {
      role: 'Revenue',
      title: 'Revenue & Billing Lead',
      desc: 'Billing anomaly scoring, rate mismatches, duplicate credits, and remediation sign-off.'
    },
    {
      role: 'Admin',
      title: 'System Administrator',
      desc: 'Full access across all intelligence engines, approval queues, and immutable audit logs.'
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleDemo = async (role) => {
    setError('');
    try {
      await demoLogin(role);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#14161C] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#1C1F27] border border-[#2C303C] rounded-lg p-8">
        
        {/* Left Side: System Info & Demo Roles */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-[#232733] border border-[#2C303C] flex items-center justify-center font-bold text-[#EDEBE6] text-xs font-mono">
                JS
              </div>
              <span className="font-semibold text-[#EDEBE6] text-base">Jeebr Internet &bull; PMRG AI Overlay</span>
            </div>
            <h1 className="text-lg font-bold text-[#EDEBE6]">
              Network Operations & Revenue Governance Control Room
            </h1>
            <p className="text-xs text-[#8B8F99] leading-relaxed">
              Demonstrating the governed operating loop across Mumbai network telemetry, subscriber churn risk, billing anomaly detection, and automated ticket triage.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-medium text-[#8B8F99]">
              Instant demo login (1-click role access):
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoRoles.map((d) => (
                <button
                  key={d.role}
                  disabled={loading}
                  onClick={() => handleDemo(d.role)}
                  className="w-full text-left p-3 rounded bg-[#14161C] border border-[#2C303C] hover:border-[#8B8F99] transition-colors flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-[#EDEBE6] group-hover:text-[#EDEBE6]">
                      {d.title}
                    </div>
                    <p className="text-[11px] text-[#8B8F99] leading-snug">{d.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8B8F99] shrink-0 ml-2 group-hover:text-[#EDEBE6]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Standard Login Form */}
        <div className="md:col-span-5 bg-[#14161C] border border-[#2C303C] rounded p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#EDEBE6]">Standard authentication</h2>
              <p className="text-xs text-[#8B8F99]">Sign in with user credentials</p>
            </div>

            {error && (
              <div className="p-2.5 rounded bg-[#232733] border border-[#C1514B] text-xs text-[#C1514B]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-[#8B8F99] flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#8B8F99]" />
                  <span>Email address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-[#1C1F27] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none focus:border-[#8B8F99] font-mono"
                  placeholder="executive@jeebr.in"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#8B8F99] flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#8B8F99]" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-[#1C1F27] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none focus:border-[#8B8F99] font-mono"
                  placeholder="admin123"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded bg-[#232733] hover:bg-[#2C303C] border border-[#2C303C] font-semibold text-xs text-[#EDEBE6] transition-colors flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign in to control room'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-[#2C303C] text-[11px] text-[#8B8F99] space-y-0.5 font-mono">
            <div>Default seed password: <span className="text-[#EDEBE6]">admin123</span></div>
          </div>
        </div>

      </div>
    </div>
  );
};
