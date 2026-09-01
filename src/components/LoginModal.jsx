import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Mail, Zap } from 'lucide-react';

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
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-[#F7F8FA]"
      style={{ backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-gray-200 rounded-2xl p-8 modal-shadow">

        {/* Left Side: System Info & Demo Roles */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">Jeebr Internet &bull; PMRG AI Overlay</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Network Operations &amp; Revenue Governance Control Room
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Demonstrating the governed operating loop across Mumbai network telemetry, subscriber churn risk, billing anomaly detection, and automated ticket triage.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Instant demo login (1-click role access):
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoRoles.map((d) => (
                <button
                  key={d.role}
                  disabled={loading}
                  onClick={() => handleDemo(d.role)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-150 flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {d.title}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">{d.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 ml-2 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Standard Login Form */}
        <div className="md:col-span-5 bg-slate-50 border border-gray-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Standard authentication</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sign in with user credentials</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>Email address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors font-mono"
                  placeholder="executive@jeebr.in"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors font-mono"
                  placeholder="admin123"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign in to control room'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-400 space-y-0.5 font-mono">
            <div>Default seed password: <span className="text-gray-700 font-semibold">admin123</span></div>
          </div>
        </div>

      </div>
    </div>
  );
};
