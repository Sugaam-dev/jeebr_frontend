import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Check, 
  XCircle,
  KeyRound,
  Cpu,
  Sparkles
} from 'lucide-react';
import logoImg from '../../assets/logo_pmrg.png';

export const SignupPage = () => {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Real-time password combination validation rules
  const passwordRules = [
    { id: 'length', label: '8+ Characters', valid: password.length >= 8 },
    { id: 'uppercase', label: '1 Uppercase (A-Z)', valid: /[A-Z]/.test(password) },
    { id: 'number', label: '1 Number (0-9)', valid: /[0-9]/.test(password) },
    { id: 'special', label: '1 Symbol (!@#$)', valid: /[^a-zA-Z0-9]/.test(password) },
  ];

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-gray-200', text: 'text-gray-400' };
    const passedCount = passwordRules.filter(r => r.valid).length;
    if (passedCount <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (passedCount <= 3) return { score: 2, label: 'Good', color: 'bg-amber-500', text: 'text-amber-500' };
    return { score: 4, label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const pwdStrength = calculatePasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    try {
      await signup(fullName.trim(), email.trim(), password, role);
      navigate('/cockpit', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#051348] via-[#0A1F66] to-[#071B63] relative overflow-hidden"
    >
      {/* Background Decorative Mesh Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-0 bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">

        {/* Left Side: Brand Story & Security Pillars */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#061654] via-[#0A1F66] to-[#071B63] p-6 sm:p-10 text-white flex flex-col justify-between space-y-6 relative overflow-hidden">
          
          <div className="space-y-5 relative z-10">
            {/* Logo */}
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
                Create Your <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
                  Enterprise Account
                </span>
              </h1>
              <p className="text-xs text-blue-100/80 leading-relaxed font-normal">
                Deploy continuous AI telemetry monitoring, human-in-the-loop audit trails, and automated revenue protection.
              </p>
            </div>

            {/* Architecture Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-blue-100/90 bg-white/5 border border-white/10 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Real-time optical dBm telemetry &amp; node degradation scoring</span>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-blue-100/90 bg-white/5 border border-white/10 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Role-based access control with cryptographically signed audit logs</span>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-blue-100/90 bg-white/5 border border-white/10 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>5 Scored ML engines with transparent explainability signals</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 space-y-1 relative z-10">
            <div className="font-bold flex items-center gap-1.5 text-white">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>PBKDF2 Password Protection</span>
            </div>
            <p className="text-[11px] text-cyan-200/80 leading-relaxed">
              Passwords are salted and cryptographically hashed with 100,000 PBKDF2-SHA256 iterations.
            </p>
          </div>

        </div>

        {/* Right Side: Registration Form */}
        <div className="md:col-span-7 bg-white p-6 sm:p-10 flex flex-col justify-between space-y-5">
          
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#2463EB] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Instant Setup</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Register New Account</h2>
              <p className="text-xs text-gray-500 mt-0.5">Fill in your information to join your organization workspace</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Row 1: Full Name & Work Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>Full Name</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[9.5px] font-semibold text-gray-400 bg-gray-100 px-1 py-0.2 rounded">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-2 focus:ring-[#2463EB]/20 transition-all font-medium shadow-xs"
                      placeholder="e.g. Udesh Kumar"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>Work Email</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[9.5px] font-semibold text-gray-400 bg-gray-100 px-1 py-0.2 rounded">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-2 focus:ring-[#2463EB]/20 transition-all font-mono shadow-xs"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Operational Role Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <span>Operational Role</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[9.5px] font-semibold text-gray-400 bg-gray-100 px-1 py-0.2 rounded">
                    Required
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-2 focus:ring-[#2463EB]/20 transition-all font-medium shadow-xs"
                  >
                    <option value="Admin">System Administrator (Full Authority)</option>
                    <option value="Executive">Executive (C-Suite &amp; Portfolio)</option>
                    <option value="NOC">NOC Lead (Predictive Assurance &amp; Splicing)</option>
                    <option value="Care">Care Lead (Churn Risk &amp; Retention Offers)</option>
                    <option value="Revenue">Revenue Lead (Billing Ledger &amp; Leakage)</option>
                    <option value="Viewer">Viewer (Read-Only Telemetry)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>Password</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[9.5px] font-semibold text-gray-400 bg-gray-100 px-1 py-0.2 rounded">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-2 focus:ring-[#2463EB]/20 transition-all font-mono shadow-xs"
                      placeholder="Enter strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>Confirm Password</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[9.5px] font-semibold text-gray-400 bg-gray-100 px-1 py-0.2 rounded">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2463EB] focus:ring-2 focus:ring-[#2463EB]/20 transition-all font-mono shadow-xs"
                      placeholder="Repeat password"
                    />
                    {passwordsMatch && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute right-3 top-2.5" />
                    )}
                    {passwordsMismatch && (
                      <XCircle className="w-3.5 h-3.5 text-rose-500 absolute right-3 top-2.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Password Combination Checklist */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-gray-700">Password Requirements:</span>
                  <span className={`font-bold font-mono text-[10px] ${pwdStrength.text}`}>
                    {pwdStrength.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${pwdStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordRules.filter(r => r.valid).length / 4) * 100}%` }}
                  />
                </div>

                {/* 4 Interactive Combination Chips */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10.5px] font-medium transition-all ${
                        rule.valid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-white text-gray-500 border border-gray-200'
                      }`}
                    >
                      <Check className={`w-3 h-3 ${rule.valid ? 'text-emerald-600 font-bold' : 'text-gray-300'}`} />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account & Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#2463EB] hover:text-[#1D4ED8] font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
