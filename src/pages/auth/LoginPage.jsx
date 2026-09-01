import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles, 
  Check, 
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  KeyRound
} from 'lucide-react';
import logoImg from '../../assets/logo_pmrg.png';

export const LoginPage = () => {
  const { login, demoLogin, loading, sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/cockpit';

  const [email, setEmail] = useState('admin@jeebr.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Password rules validation logic
  const passwordRules = [
    { id: 'length', label: 'At least 6 characters', valid: password.length >= 6 },
    { id: 'hasNumber', label: 'Contains a number', valid: /[0-9]/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    clearSessionExpired();
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    }
  };

  const handleAdminDemo = async () => {
    setError('');
    clearSessionExpired();
    try {
      await demoLogin('Admin');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Admin demo login failed.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#0F225A] via-[#142C6F] to-[#1B3679] relative overflow-hidden"
    >
      {/* Background Decorative Mesh Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-0 bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">

        {/* Left Side: Brand Narrative & 1-Click Admin Demo */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#0F225A] via-[#142C6F] to-[#1B3679] p-6 sm:p-10 text-white flex flex-col justify-between space-y-6 relative overflow-hidden">
          
          <div className="space-y-5 relative z-10">
            {/* Logo & Product Name */}
            <Link to="/" className="inline-flex items-center gap-3 cursor-pointer group">
              <img 
                src={logoImg} 
                alt="SentinelOS Logo" 
                className="h-10 w-auto object-contain filter brightness-110 drop-shadow-md transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="text-base font-black tracking-wide text-white">
                  Sentinel<span className="text-cyan-400">OS</span>
                </span>
                <span className="text-[10px] text-cyan-200/70 font-medium tracking-tight">
                  Enterprise AI Governance
                </span>
              </div>
            </Link>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Autonomous AI <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
                  Trust Control Room
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-normal">
                Continuous optical telemetry degradation scoring, churn risk mitigation, and cryptographically signed audit sign-offs.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-blue-100/90 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Zero External API Key Required &bull; 100% On-Premise ML</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-100/90 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>5 Scored ML Inference &amp; Governance Engines</span>
              </div>
            </div>
          </div>

          {/* Clean 1-Click Admin Demo Button (Only Admin Kept) */}
          <div className="relative z-10 space-y-2 pt-4 border-t border-blue-900/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Instant 1-Click Demo:</span>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleAdminDemo}
              className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/40 to-cyan-600/30 hover:from-blue-600/60 hover:to-cyan-600/50 border border-cyan-400/40 hover:border-cyan-300 transition-all flex items-center justify-between group cursor-pointer shadow-lg hover:shadow-cyan-500/20"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Administrator (Full Access)</span>
                  <span className="text-[9px] bg-cyan-400 text-[#071B63] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/70 leading-snug">
                  Explore all 5 scored engines, review sign-offs &amp; audit trails with full authority.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* Right Side: Modern Dynamic Sign In Form */}
        <div className="md:col-span-6 bg-white p-6 sm:p-10 flex flex-col justify-between space-y-6">
          
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#2463EB] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <KeyRound className="w-3 h-3" />
                <span>Secure Authentication</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
              <p className="text-xs text-gray-500 mt-0.5">Enter your credentials to access SentinelOS</p>
            </div>

            {sessionExpired && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Your session has expired. Please sign in again to continue.</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <span>Work Email</span>
                    <span className="text-rose-500 font-bold" title="Mandatory field">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
                    Mandatory
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-2 focus:ring-[#2463EB]/20 transition-all font-mono shadow-xs"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <span>Password</span>
                    <span className="text-rose-500 font-bold" title="Mandatory field">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
                    Mandatory
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-2 focus:ring-[#2463EB]/20 transition-all font-mono shadow-xs"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Real-Time Password Rule Indicators */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all ${
                        rule.valid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      <Check className={`w-3 h-3 ${rule.valid ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Footer & Registration Link */}
          <div className="pt-4 border-t border-gray-100 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Don't have an account yet?{' '}
              <Link to="/signup" className="text-[#2463EB] hover:text-[#1D4ED8] font-bold hover:underline">
                Create Account
              </Link>
            </p>
            <div className="text-[11px] text-gray-400 font-mono">
              Default admin seed: <span className="text-gray-700 font-bold">admin123</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
