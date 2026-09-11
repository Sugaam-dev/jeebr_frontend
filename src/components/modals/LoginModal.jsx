import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import logoImg from '../../assets/logo_pmrg.png';

export const LoginModal = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/cockpit');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F5F8FF]"
      style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 modal-shadow">

        {/* Left Side: System Info & Demo Roles */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img 
                src={logoImg} 
                alt="SentinelOS Logo" 
                className="h-11 max-w-[180px] object-contain filter drop-shadow-sm"
              />
              <span className="font-bold text-[#071B63] text-lg">&bull; Control Room</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Enterprise AI Governance &amp; Trust Control Room
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Autonomous governed operating loop connecting fiber telemetry, subscriber churn prediction, billing anomaly detection, and human-in-the-loop audit approvals.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-600 leading-relaxed space-y-2">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#2463EB]" />
                <span>Enterprise RBAC Authentication</span>
              </div>
              <p>
                Sign in using your assigned enterprise credentials. Access is governed by role-based authorization: Executive, NOC, Care, Revenue, Admin, or Viewer.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Standard Login Form */}
        <div className="md:col-span-5 bg-[#F8FAFD] border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Standard Authentication</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sign in with database credentials</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>Email address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-mono"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-1 focus:ring-[#2463EB]/20 transition-colors font-mono"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Control Room'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
