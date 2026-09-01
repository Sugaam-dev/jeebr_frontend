import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  Radio, 
  UserMinus, 
  IndianRupee, 
  GitBranch, 
  Compass, 
  ShieldAlert, 
  ArrowRight, 
  Lock, 
  Activity, 
  Menu, 
  X, 
  Cpu, 
  BarChart3, 
  FileCheck2, 
  ChevronRight,
  Server,
  Zap,
  Terminal
} from 'lucide-react';
import logoImg from '../../assets/logo_pmrg.png';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('assurance');

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scoredEngines = [
    {
      id: 'assurance',
      title: 'Predictive Service Assurance',
      badge: 'Network NOC',
      icon: Radio,
      color: 'from-blue-600 to-indigo-600',
      description: 'Real-time optical power degradation scoring correlating dBm attenuation, packet loss, and backhaul utilization to prevent critical fiber outages.',
      metric: '99.98% Model Accuracy',
      submetric: '< -28 dBm threshold alerts'
    },
    {
      id: 'churn',
      title: 'Churn Prediction & Retention AI',
      badge: 'Customer Care',
      icon: UserMinus,
      color: 'from-purple-600 to-rose-600',
      description: 'Multi-signal subscriber propensity models analyzing repeated complaints, bandwidth drops, and invoice delays to safeguard high-ARPU contracts.',
      metric: '84% Churn Retention Rate',
      submetric: 'Automated save offer proposals'
    },
    {
      id: 'revenue',
      title: 'Revenue Assurance & Leakage Analytics',
      badge: 'Revenue & Billing',
      icon: IndianRupee,
      color: 'from-emerald-600 to-teal-600',
      description: 'Detects rate mismatches, unbilled speed boost add-ons, duplicate credit adjustments, and dunning failures across SAP BRIM ledgers.',
      metric: '₹3.24L Leakage Identified',
      submetric: 'Instant ledger reconciliation'
    },
    {
      id: 'orchestration',
      title: 'OSS/BSS Incident Triage Orchestration',
      badge: 'Operations',
      icon: GitBranch,
      color: 'from-cyan-600 to-blue-600',
      description: 'Autonomous incident triage classifying subscriber tickets into automated TR-069 reboots, BRAS QoS syncs, or field splicing crew dispatches.',
      metric: '4.2m Mean Resolution SLA',
      submetric: 'Multi-tier workflow automation'
    },
    {
      id: 'journeys',
      title: 'Lifecycle Next-Best-Action',
      badge: 'Growth & Retention',
      icon: Compass,
      color: 'from-amber-600 to-orange-600',
      description: 'Governed lifecycle journeys across Acquisition, Installation, Usage, Renewal, Complaint, and Win-back with channel-optimized recommendations.',
      metric: '6 Lifecycle Stages',
      submetric: 'WhatsApp & VIP Care routing'
    }
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: 'Human-in-the-Loop Governance',
      desc: 'No AI recommendation is executed without explicit, authenticated domain lead sign-off and permission verification.'
    },
    {
      icon: Activity,
      title: 'AI Risk Topology',
      desc: 'Interactive live telemetry topology mapping physical nodes, optical health, degradation risk, and subscriber impact in real-time.'
    },
    {
      icon: Terminal,
      title: 'Immutable Audit Trail',
      desc: 'Every approval, rejection, and automated action is timestamped and cryptographically logged for full compliance transparency.'
    },
    {
      icon: Lock,
      title: 'Enterprise RBAC & Security',
      desc: 'Role-based access control with granular permission checks for Executive, NOC, Care, Revenue, and Administrator roles.'
    },
    {
      icon: FileCheck2,
      title: 'Explainable AI Signals',
      desc: 'Transparent risk score breakdowns displaying weighted contributing factors and root-cause evidence for every prediction.'
    },
    {
      icon: Zap,
      title: 'Single Incident Trace',
      desc: 'End-to-end connected trace linking physical fiber degradation to churn scoring, retention save offers, and execution receipts.'
    },
    {
      icon: BarChart3,
      title: 'Executive Cockpit Analytics',
      desc: 'High-level operational overview summarizing portfolio health, at-risk ARR, active alarms, and governance turnaround SLAs.'
    },
    {
      icon: Server,
      title: 'High-Throughput PostgreSQL Core',
      desc: 'Enterprise database architecture capable of streaming telemetry, historical invoice records, and subscriber metrics.'
    }
  ];

  const useCases = [
    {
      role: 'Executive & C-Suite',
      purpose: 'Portfolio & Risk Oversight',
      desc: 'Get a holistic view of operations health, revenue leakage, churn exposure, and model confidence scores across all enterprise regions.'
    },
    {
      role: 'Network NOC Leads',
      purpose: 'Proactive Telemetry & Field Splicing',
      desc: 'Inspect optical attenuation drift before outages occur and authorize field crew dispatches with 1-click governed workflows.'
    },
    {
      role: 'Customer Care Leads',
      purpose: 'Churn Prevention & VIP Retention',
      desc: 'Access ranked subscriber risk scores, inspect contributing complaint history, and approve proactive downtime credits.'
    },
    {
      role: 'Revenue & Billing Leads',
      purpose: 'Leakage Discovery & Remediation',
      desc: 'Identify unbilled add-on usage, catalog rate mismatches, and authorize billing ledger adjustments with immutable receipts.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#0F172A] font-sans antialiased overflow-x-hidden selection:bg-[#2463EB] selection:text-white">

      {/* ============================================================
          1. PUBLIC STICKY NAVIGATION BAR
      ============================================================ */}
      <nav className="sticky top-0 z-50 bg-[#071B63]/95 backdrop-blur-md border-b border-[#152D75] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <img 
              src={logoImg} 
              alt="SentinelOS Logo" 
              className="h-9 w-auto max-w-[160px] object-contain filter brightness-110 drop-shadow transition-transform group-hover:scale-105"
            />
            <span className="hidden sm:inline-block text-[10px] bg-blue-500/30 text-blue-200 font-bold px-2 py-0.5 rounded border border-blue-400/30 uppercase tracking-wider">
              Governance Platform
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-semibold text-blue-100/80">
            <button onClick={() => scrollToSection('platform')} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Platform
            </button>
            <button onClick={() => scrollToSection('solutions')} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Solutions
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              How It Works
            </button>
            <button onClick={() => scrollToSection('features')} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('security')} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Security
            </button>
            <button onClick={() => scrollToSection('use-cases')} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Use Cases
            </button>
          </div>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-xs font-semibold text-white hover:text-blue-200 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-4 py-2 rounded-xl bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#071B63] border-b border-[#152D75] px-4 pt-2 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col space-y-1 text-sm font-medium text-blue-100">
              <button onClick={() => scrollToSection('platform')} className="text-left px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer">Platform</button>
              <button onClick={() => scrollToSection('solutions')} className="text-left px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer">Solutions</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-left px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer">How It Works</button>
              <button onClick={() => scrollToSection('features')} className="text-left px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer">Features</button>
              <button onClick={() => scrollToSection('security')} className="text-left px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer">Security</button>
              <button onClick={() => scrollToSection('use-cases')} className="text-left px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer">Use Cases</button>
            </div>
            <div className="pt-4 border-t border-blue-900/60 flex flex-col gap-2.5">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold text-center hover:bg-white/10 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="w-full py-2.5 rounded-xl bg-[#2463EB] text-white text-xs font-bold text-center hover:bg-[#1D4ED8] shadow-md cursor-pointer"
              >
                Create Free Account
              </button>
            </div>
          </div>
        )}
      </nav>


      {/* ============================================================
          2. HERO SECTION
      ============================================================ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-[#071B63] via-[#0A1F66] to-[#040E36] text-white">
        
        {/* Soft Background Glow Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Autonomous Telecom AI Governance &amp; Operating Loop</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Build Trust Into Every <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Autonomous AI Decision
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Govern physical fiber telemetry, subscriber churn risk scoring, billing anomaly detection, and automated ticket triage with human-in-the-loop audit sign-offs.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold backdrop-blur-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-300" />
              <span>Explore Live Platform Demo</span>
            </button>
          </div>

          {/* Hero Product Visual Mockup */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="bg-[#051348] border border-[#1E3A8A]/60 rounded-2xl p-2 sm:p-4 shadow-2xl relative overflow-hidden">
              
              {/* Window Controls Bar */}
              <div className="flex items-center justify-between pb-3 px-2 border-b border-blue-900/40 text-[11px] text-blue-200/60 font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-slate-300 font-sans font-semibold">SentinelOS &bull; Live Telemetry Control Room</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>5 Models Active &bull; 100% Governed</span>
                </div>
              </div>

              {/* Mockup Body Preview */}
              <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                {/* Tile 1 */}
                <div className="bg-[#0A1F66] p-4 rounded-xl border border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-200">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Optical Attenuation</span>
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">-29.8 dBm</div>
                  <div className="text-[11px] text-rose-300 flex items-center gap-1">
                    <span>Critical Micro-Bending &bull; Bandra Hub</span>
                  </div>
                </div>

                {/* Tile 2 */}
                <div className="bg-[#0A1F66] p-4 rounded-xl border border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-200">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">At-Risk ARR Exposure</span>
                    <UserMinus className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">₹38,400/mo</div>
                  <div className="text-[11px] text-purple-300">
                    84% Model Confidence &bull; 3 ILL Accounts
                  </div>
                </div>

                {/* Tile 3 */}
                <div className="bg-[#0A1F66] p-4 rounded-xl border border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-200">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Human Sign-off Queue</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">4 Approvals</div>
                  <div className="text-[11px] text-emerald-300">
                    NOC &amp; Care Dual Authorization Ready
                  </div>
                </div>
              </div>

              {/* Trace Flow Preview */}
              <div className="mt-3 p-3 rounded-xl bg-[#030B29] border border-blue-950 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-blue-300">
                <span className="text-slate-400">// Closed-Loop Telemetry:</span>
                <span className="text-cyan-300">Observe (dBm) &rarr;</span>
                <span className="text-purple-300">Predict (Churn 84%) &rarr;</span>
                <span className="text-amber-300">Recommend (SLA Credit) &rarr;</span>
                <span className="text-emerald-300">Approve (NOC Lead) &rarr;</span>
                <span className="text-blue-300">Execute (TR-069)</span>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ============================================================
          3. SOCIAL PROOF & KEY TELEMETRY PILLARS
      ============================================================ */}
      <section className="bg-white border-y border-[#E2E8F0] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#071B63] font-mono">1,000+</div>
              <div className="text-xs text-gray-500 font-medium">Monitored Subscribers</div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#2463EB] font-mono">5 Engines</div>
              <div className="text-xs text-gray-500 font-medium">Scored ML &amp; Rule Models</div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">100%</div>
              <div className="text-xs text-gray-500 font-medium">Immutable Audit Trail</div>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 font-mono">&lt; 5 mins</div>
              <div className="text-xs text-gray-500 font-medium">Avg Governance SLA</div>
            </div>
          </div>
        </div>
      </section>


      {/* ============================================================
          4. PROBLEM DIAGNOSIS SECTION
      ============================================================ */}
      <section id="solutions" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-[#2463EB]">The Enterprise Challenge</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            AI is Moving Faster Than Governance Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Telecom operations, network telemetry, and customer lifecycle models are deeply interconnected. When algorithms act autonomously without centralized oversight, blindspots multiply.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-3 card-shadow hover:border-rose-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Fragmented AI Ecosystem</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Assurance, churn prediction, and billing models operate in silos without correlated cause-and-effect visibility.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-3 card-shadow hover:border-amber-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Physical-to-Customer Blindspots</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Optical fiber micro-bending and attenuation degradation trigger downstream subscriber churn before tickets are logged.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-3 card-shadow hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2463EB]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Manual Approval Bottlenecks</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Field dispatches and tariff waivers lack role-based cryptographic sign-offs, creating compliance vulnerabilities.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-3 card-shadow hover:border-purple-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Silent Revenue Leakage</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Catalog plan discrepancies and duplicate credits go undetected across billing ledgers without automated anomaly scoring.
            </p>
          </div>
        </div>
      </section>


      {/* ============================================================
          5. PRODUCT SOLUTION & 5-ENGINE SHOWCASE
      ============================================================ */}
      <section id="platform" className="py-16 sm:py-24 bg-gradient-to-b from-[#0A1F66] to-[#071B63] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">The Solution</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              5 Scored Intelligence Engines Under One Governed Overlay
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              SentinelOS connects every stage of the operating lifecycle into a single closed loop with verifiable explainability signals.
            </p>
          </div>

          {/* Engine Selector Pills */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {scoredEngines.map((eng) => {
              const Icon = eng.icon;
              const isCurrent = activeTab === eng.id;
              return (
                <button
                  key={eng.id}
                  onClick={() => setActiveTab(eng.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isCurrent
                      ? 'bg-[#2463EB] text-white shadow-lg ring-2 ring-cyan-400/30 font-bold'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{eng.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Engine Card Feature */}
          {(() => {
            const current = scoredEngines.find(e => e.id === activeTab) || scoredEngines[0];
            const Icon = current.icon;
            return (
              <div className="bg-[#051348] border border-[#1E3A8A] rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                      {current.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Production ML Model</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{current.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{current.description}</p>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-[#0A1F66] border border-blue-900/60">
                      <div className="text-[10px] uppercase font-bold text-blue-200/60">Key Metric</div>
                      <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">{current.metric}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0A1F66] border border-blue-900/60">
                      <div className="text-[10px] uppercase font-bold text-blue-200/60">Governance Output</div>
                      <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">{current.submetric}</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/signup')}
                      className="px-5 py-2.5 rounded-xl bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Explore this Engine in SentinelOS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#0A1F66] p-6 rounded-2xl border border-blue-900/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-cyan-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Live Model Inference</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Scored 0-100</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#051348]/60">
                      <span className="text-slate-400">Signal Evaluation:</span>
                      <span className="text-white">Multi-Vector Correlated</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#051348]/60">
                      <span className="text-slate-400">Confidence Threshold:</span>
                      <span className="text-cyan-300">&gt; 80% Required</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#051348]/60">
                      <span className="text-slate-400">Sign-off Authority:</span>
                      <span className="text-amber-300">{current.badge} Role Only</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </section>


      {/* ============================================================
          6. HOW IT WORKS (4-STEP OPERATING LOOP)
      ============================================================ */}
      <section id="how-it-works" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-[#2463EB]">Workflow Architecture</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            How SentinelOS Operates in 4 Steps
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            From raw network telemetry collection to immutable audit records, every automated action is verifiable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            { step: '01', title: 'Connect & Ingest', desc: 'Streams physical fiber optical dBm telemetry, CRM tickets, and SAP BRIM billing ledgers.' },
            { step: '02', title: 'Score & Correlate', desc: '5 ML models evaluate degradation risk, churn propensity, and catalog leakage vectors.' },
            { step: '03', title: 'Human Sign-off', desc: 'Role-Based Access Control routes recommendations to authorized domain leads.' },
            { step: '04', title: 'Execute & Audit', desc: 'Automated TR-069 reboots, credits, and field dispatches logged to immutable ledger.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-3 card-shadow relative">
              <div className="text-3xl font-black font-mono text-blue-600/20">{item.step}</div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ============================================================
          7. KEY FEATURES GRID
      ============================================================ */}
      <section id="features" className="py-16 sm:py-24 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-[#2463EB]">Core Capabilities</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Enterprise Features Built for Telecom Reliability
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Designed from the ground up for high-scale network assurance, churn mitigation, and automated revenue recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="bg-[#F8FAFD] border border-[#E2E8F0] p-5 rounded-2xl space-y-3 hover:bg-white hover:shadow-md transition-all">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2463EB]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{f.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* ============================================================
          8. SECURITY & TRUST SECTION
      ============================================================ */}
      <section id="security" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Enterprise Security</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Security &amp; Auditability at Every Layer
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Strict authentication, permission-based authorization, and cryptographic hash verification ensure complete data safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-3 card-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">PBKDF2 Password Hashing</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              100,000-iteration SHA-256 salted password hashing ensures user credentials cannot be compromised or reversed.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-3 card-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2463EB]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">JWT Bearer Session Tokens</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Cryptographically signed JWTs enforce session integrity and automatic expiration across all protected API routes.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-3 card-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Immutable Audit Receipts</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every sign-off records the evaluating user, exact original telemetry signals, confidence rating, and execution response.
            </p>
          </div>
        </div>
      </section>


      {/* ============================================================
          9. USE CASES SECTION
      ============================================================ */}
      <section id="use-cases" className="py-16 sm:py-24 bg-[#071B63] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">Target Audiences</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Tailored for Every Operational Stakeholder
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Role-based user experiences configured specifically for C-suite, network operations, customer retention, and billing audit teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc, idx) => (
              <div key={idx} className="bg-[#0A1F66] p-6 rounded-2xl border border-blue-900/60 space-y-3 shadow-xl flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider">{uc.purpose}</div>
                  <h3 className="text-base font-bold text-white">{uc.role}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{uc.desc}</p>
                </div>

                <div className="pt-3 border-t border-blue-900/40">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>Test {uc.role.split(' ')[0]} role</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ============================================================
          10. FINAL CTA BANNER
      ============================================================ */}
      <section className="py-20 bg-gradient-to-r from-[#2463EB] to-[#1D4ED8] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Bring AI Governance, Risk, and Trust Together
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Deploy SentinelOS to govern, monitor, and manage your telecom AI ecosystem with zero blindspots.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#071B63] text-sm font-bold shadow-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Create Account Free
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/15 hover:bg-white/20 border border-white/30 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Sign In to Demo
            </button>
          </div>
        </div>
      </section>


      {/* ============================================================
          11. ENTERPRISE FOOTER
      ============================================================ */}
      <footer className="bg-[#040E36] border-t border-[#152D75] text-slate-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            
            {/* Col 1: Logo & Mission */}
            <div className="col-span-2 space-y-3">
              <img 
                src={logoImg} 
                alt="SentinelOS Logo" 
                className="h-8 w-auto max-w-[150px] object-contain filter brightness-110 drop-shadow"
              />
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                SentinelOS is an autonomous telecom AI governance platform delivering real-time telemetry risk assurance, subscriber churn protection, and billing integrity.
              </p>
            </div>

            {/* Col 2: Platform */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Platform</h5>
              <ul className="space-y-1.5">
                <li><button onClick={() => scrollToSection('platform')} className="hover:text-white cursor-pointer">Scored Engines</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white cursor-pointer">Operating Loop</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">Explainable Signals</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white cursor-pointer">Risk Topology</button></li>
              </ul>
            </div>

            {/* Col 3: Solutions */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Solutions</h5>
              <ul className="space-y-1.5">
                <li><button onClick={() => scrollToSection('use-cases')} className="hover:text-white cursor-pointer">Network NOC</button></li>
                <li><button onClick={() => scrollToSection('use-cases')} className="hover:text-white cursor-pointer">Customer Retention</button></li>
                <li><button onClick={() => scrollToSection('use-cases')} className="hover:text-white cursor-pointer">Revenue Assurance</button></li>
                <li><button onClick={() => scrollToSection('use-cases')} className="hover:text-white cursor-pointer">Executive Oversight</button></li>
              </ul>
            </div>

            {/* Col 4: Account & Auth */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Account</h5>
              <ul className="space-y-1.5">
                <li><button onClick={() => navigate('/login')} className="hover:text-white cursor-pointer">Sign In</button></li>
                <li><button onClick={() => navigate('/signup')} className="hover:text-white cursor-pointer">Register Free</button></li>
                <li><button onClick={() => scrollToSection('security')} className="hover:text-white cursor-pointer">Security Architecture</button></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-blue-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} SentinelOS &bull; PMRG AI Overlay. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <span>Privacy Policy</span>
              <span>&bull;</span>
              <span>Terms of Service</span>
              <span>&bull;</span>
              <span>Security Whitepaper</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
