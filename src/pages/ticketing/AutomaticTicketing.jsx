import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import {
  Ticket,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Users,
  Building2,
  MapPin,
  X,
  Send,
  UserCheck,
  Check,
  AlertCircle,
  Cpu,
  ChevronRight,
  Calendar,
  Flame,
  Phone,
  Mail,
  Layers,
  ArrowUpRight,
  Volume2,
  VolumeX,
  PhoneCall,
  PhoneForwarded,
  PhoneOutgoing,
  Radio,
  FileText,
  Sparkles,
  Wrench
} from 'lucide-react';

export const AutomaticTicketing = () => {
  const [tickets, setTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING_APPROVAL, P3_P4, INTERNAL, RESOLVED
  const [priorityFilter, setPriorityFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Modals & Actions
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Approval Modal & Call Simulation State
  const [approvingTicket, setApprovingTicket] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [assignMode, setAssignMode] = useState('AI'); // 'AI' | 'MANUAL'
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [callSimulationState, setCallSimulationState] = useState('DELIVERED'); // 'CALLING', 'CONNECTED', 'DELIVERED'
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Resource Timeline Modal State
  const [selectedResourceTimeline, setSelectedResourceTimeline] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineTab, setTimelineTab] = useState('ACTIVE'); // 'ACTIVE' or 'RESOLVED'

  // Raise Ticket Form
  const [formData, setFormData] = useState({
    source: 'CUSTOMER',
    region: 'Bandra West',
    category: 'Speed',
    priority: 'P3',
    description: '',
    customer_id: ''
  });

  const loadAllData = (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    let completed = 0;
    const checkDone = () => {
      completed += 1;
      if (completed >= 2) {
        setLoading(false);
        setRefreshing(false);
      }
    };

    api.getTickets({}, force)
      .then((ticketsData) => {
        setTickets(ticketsData || []);
      })
      .catch((err) => {
        showNotification(err.message || 'Failed to fetch tickets', 'error');
      })
      .finally(checkDone);

    api.getResources(null, null, force)
      .then((resourcesData) => {
        setResources(resourcesData || []);
      })
      .catch((err) => {
        showNotification(err.message || 'Failed to fetch resources', 'error');
      })
      .finally(checkDone);

    api.getTicketStats(force)
      .then((statsData) => {
        setStats(statsData || null);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  const getTicketVoiceScript = (t) => {
    if (t?.last_call_script) return t.last_call_script;
    return `Emergency SentinelOS Dispatch Alert. Attention Approval Authority: High-impact ticket ${t?.ticket_code || 'TKT'} with priority ${t?.priority || 'P1'} has been raised in ${t?.region || 'Regional locality'}. Category: ${t?.category || 'Network'}. Incident details: ${t?.description || 'Incident reported'}. Automated field dispatch is gated pending your authorization. Please review and approve this ticket as soon as possible on your SentinelOS dashboard. Thank you.`;
  };

  const playVoiceScript = (text) => {
    if (!('speechSynthesis' in window)) {
      showNotification('Browser Speech Synthesis is not supported in this browser', 'error');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    utterance.onstart = () => setIsPlayingVoice(true);
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceScript = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
  };

  const handleOpenApproveModal = (ticket) => {
    setApprovingTicket(ticket);
    setApprovalNotes(`Approved for dispatch in ${ticket.region || 'Regional locality'} — High-impact ${ticket.priority} emergency sign-off`);
    setAssignMode('AI');
    setSelectedTechnicianId('');
    setCallSimulationState('DELIVERED');
    setIsPlayingVoice(false);
  };

  const handleSimulateCall = async (ticketId) => {
    setCallSimulationState('CALLING');
    try {
      setTimeout(() => setCallSimulationState('CONNECTED'), 900);
      const log = await api.simulateTicketCall(ticketId);
      setTimeout(() => {
        setCallSimulationState('DELIVERED');
        showNotification(`Emergency call connected to ${log.recipient_name} (${log.recipient_phone})!`);
        playVoiceScript(log.voice_script);
      }, 1900);
    } catch (err) {
      setCallSimulationState('DELIVERED');
      showNotification(err.message || 'Call simulation error', 'error');
    }
  };

  const handleConfirmApproval = async () => {
    if (!approvingTicket) return;
    setActionLoading(true);
    stopVoiceScript();
    try {
      const techId = assignMode === 'MANUAL' ? selectedTechnicianId : null;
      const res = await api.approveTicket(approvingTicket.id, approvalNotes, techId);
      showNotification(`Ticket #${res.ticket_code} approved! ${techId ? 'Manually assigned' : 'Auto-dispatched'} to ${res.assigned_resource_name} (${res.assigned_resource_region}).`);
      setApprovingTicket(null);
      loadAllData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to approve ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (ticketId) => {
    // Quick fallback
    const t = tickets.find(x => x.id === ticketId);
    if (t) {
      handleOpenApproveModal(t);
    }
  };

  const handleReject = async (ticketId) => {
    setActionLoading(true);
    try {
      const res = await api.rejectTicket(ticketId, 'Rejected by supervisor');
      showNotification(`Ticket #${res.ticket_code} rejected.`);
      loadAllData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to reject ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (ticketId) => {
    setActionLoading(true);
    try {
      const res = await api.resolveTicket(ticketId, 'Incident resolved and verified by field resource');
      showNotification(`Ticket #${res.ticket_code} marked as Resolved.`);
      loadAllData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to resolve ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenResourceTimeline = async (resource) => {
    setSelectedResourceTimeline(resource);
    setTimelineLoading(true);
    setTimelineTab('ACTIVE');
    try {
      const data = await api.getResourceTimeline(resource.id, true);
      setTimelineData(data);
    } catch (err) {
      showNotification(err.message || 'Failed to load resource timeline', 'error');
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleResolveFromTimeline = async (ticketId) => {
    setActionLoading(true);
    try {
      await api.resolveTicket(ticketId, 'Resolved and line verified by resource');
      showNotification('Incident resolved successfully! Engineer capacity updated.');
      if (selectedResourceTimeline) {
        const updated = await api.getResourceTimeline(selectedResourceTimeline.id, true);
        setTimelineData(updated);
        if (updated && updated.resource) {
          setSelectedResourceTimeline(updated.resource);
          setResources((prev) => prev.map((r) => (r.id === updated.resource.id ? updated.resource : r)));
        }
        // Switch to RESOLVED tab so user immediately sees the resolved ticket in history
        setTimelineTab('RESOLVED');
      }
      loadAllData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to resolve ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatMinutes = (minutes) => {
    if (minutes === null || minutes === undefined) return 'SLA target: Standard';
    if (minutes < 0) return `${Math.abs(minutes)}m overdue`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m left`;
    if (mins === 0) return `${hrs}h left`;
    return `${hrs}h ${mins}m left`;
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      showNotification('Please enter a description for the incident.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        source: formData.source,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        region: formData.source === 'INTERNAL' ? 'Internal Operations' : formData.region,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null
      };

      const res = await api.createTicket(payload);

      let successMsg = `Ticket ${res.ticket_code} raised! `;
      if (res.source === 'INTERNAL') {
        successMsg += `Auto-assigned to Internal NOC Team (${res.assigned_resource_name}).`;
      } else if (res.priority === 'P3' || res.priority === 'P4') {
        successMsg += `Auto-assigned (Zero-Touch) to ${res.region} field engineer ${res.assigned_resource_name}.`;
      } else {
        successMsg += `Requires managerial review (P1/P2). Queued in Approval queue.`;
      }

      showNotification(successMsg);
      setIsRaiseModalOpen(false);
      setFormData({
        source: 'CUSTOMER',
        region: 'Bandra West',
        category: 'Speed',
        priority: 'P3',
        description: '',
        customer_id: ''
      });
      loadAllData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to raise ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'PENDING_APPROVAL' && t.approval_status !== 'PENDING_APPROVAL') return false;
    if (activeTab === 'P3_P4' && !(['P3', 'P4'].includes(t.priority) && t.source !== 'INTERNAL')) return false;
    if (activeTab === 'INTERNAL' && t.source !== 'INTERNAL') return false;
    if (activeTab === 'RESOLVED' && t.status !== 'Resolved') return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (regionFilter && (!t.region || !t.region.toLowerCase().includes(regionFilter.toLowerCase()))) return false;
    return true;
  });

  // Extract unique regions for filter
  const availableRegions = Array.from(new Set(resources.map((r) => r.region))).filter(Boolean);

  const displayStats = {
    total_tickets: stats?.total_tickets ?? tickets.length,
    auto_assigned_p3_p4: stats?.auto_assigned_p3_p4 ?? tickets.filter((t) => ['P3', 'P4'].includes(t.priority) && t.source !== 'INTERNAL' && t.assigned_resource_id).length,
    pending_approval_p1_p2: stats?.pending_approval_p1_p2 ?? tickets.filter((t) => t.approval_status === 'PENDING_APPROVAL').length,
    internal_auto_assigned: stats?.internal_auto_assigned ?? tickets.filter((t) => t.source === 'INTERNAL').length,
    total_resources: stats?.total_resources ?? resources.length,
    available_resources: stats?.available_resources ?? resources.filter((r) => r.status === 'Available').length
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[{ label: 'Automatic Ticketing & Dispatch', icon: Ticket }]}
        backTo="/cockpit"
        backLabel="Executive Cockpit"
      />

      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2463EB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Automated Dispatch Engine
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Region-Aware Routing
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-2">
            Automatic Ticketing &amp; Regional Resource Dispatch
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Intelligent zero-touch dispatch for P3/P4 regional incidents &amp; internal teams with human-in-the-loop approval gating for high-impact P1/P2 tickets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => loadAllData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin text-[#2463EB]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2463EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Incident Ticket</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification.message && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between shadow-xs ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification({ message: '', type: '' })} className="cursor-pointer text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl card-shadow">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Incidents</div>
          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">{displayStats.total_tickets}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Active &amp; resolved</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl card-shadow">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">P3/P4 Auto-Dispatched</div>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">{displayStats.auto_assigned_p3_p4}</div>
          <div className="text-[11px] text-blue-600/80 mt-0.5 font-medium">Zero-touch instant routing</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl card-shadow">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Awaiting Approval</div>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{displayStats.pending_approval_p1_p2}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5 font-medium">P1/P2 human-in-the-loop</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl card-shadow">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Internal NOC</div>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">{displayStats.internal_auto_assigned}</div>
          <div className="text-[11px] text-indigo-600/80 mt-0.5 font-medium">Auto-assigned to internal pool</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl card-shadow col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Active Resources</div>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {displayStats.available_resources}/{displayStats.total_resources}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Regional field engineers</div>
        </div>
      </div>

      {/* Dispatch Policy Visual Banner */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 border border-blue-100 rounded-xl p-4 sm:p-5">
        <div className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#2463EB]" />
          <span>Automated Dispatch &amp; Governance Matrix</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-blue-200/60">
            <div className="font-semibold text-blue-900 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>P3 &amp; P4 Tickets (Zero-Touch)</span>
            </div>
            <div className="text-gray-600 mt-1 text-[11px] leading-relaxed">
              Assigned automatically to the regional field resource with the lowest workload in subscriber's locality without requiring approval.
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-amber-200/60">
            <div className="font-semibold text-amber-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>P1 &amp; P2 Tickets (Governed)</span>
            </div>
            <div className="text-gray-600 mt-1 text-[11px] leading-relaxed">
              Gated with managerial sign-off. Once approved, the system automatically dispatches and assigns to the optimal regional resource.
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-indigo-200/60">
            <div className="font-semibold text-indigo-900 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Internal Incidents</span>
            </div>
            <div className="text-gray-600 mt-1 text-[11px] leading-relaxed">
              Network core, optical trunk, or BSS mediation tickets are routed straight to internal team engineers without regional gating.
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Ticket Queue (Left) & Regional Resources (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow flex flex-col">
          {/* Tabs & Filters */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-lg overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({displayStats.total_tickets})
              </button>
              <button
                onClick={() => setActiveTab('PENDING_APPROVAL')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'PENDING_APPROVAL' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-800 hover:text-amber-900'
                }`}
              >
                <span>Awaiting Approval</span>
                <span className="bg-white/20 text-current px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {displayStats.pending_approval_p1_p2}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('P3_P4')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'P3_P4' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Auto-Dispatched ({displayStats.auto_assigned_p3_p4})
              </button>
              <button
                onClick={() => setActiveTab('INTERNAL')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'INTERNAL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Internal ({displayStats.internal_auto_assigned})
              </button>
            </div>

            {/* Quick dropdown filters */}
            <div className="flex items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="P1">P1 (Critical)</option>
                <option value="P2">P2 (High)</option>
                <option value="P3">P3 (Medium)</option>
                <option value="P4">P4 (Low)</option>
              </select>

              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 max-w-[140px]"
              >
                <option value="">All Regions</option>
                {availableRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto flex-1 max-h-[620px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading incident queue...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No tickets found for selected criteria.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 z-10">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Incident Code</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Region &amp; Target</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Assigned Resource</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Approval Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {filteredTickets.map((t) => {
                    const isPending = t.approval_status === 'PENDING_APPROVAL';
                    const isP1orP2 = ['P1', 'P2'].includes(t.priority);

                    const priorityBadgeClass = {
                      P1: 'bg-rose-50 text-rose-700 border-rose-200',
                      P2: 'bg-amber-50 text-amber-700 border-amber-200',
                      P3: 'bg-blue-50 text-blue-700 border-blue-200',
                      P4: 'bg-slate-100 text-slate-700 border-slate-200'
                    }[t.priority] || 'bg-gray-100 text-gray-700 border-gray-200';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${priorityBadgeClass}`}>
                              {t.priority}
                            </span>
                            <span className="font-mono font-bold text-gray-900">{t.ticket_code}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 line-clamp-1 max-w-[220px]" title={t.description}>
                            {t.description}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 font-medium text-gray-900">
                            {t.source === 'INTERNAL' ? (
                              <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100">
                                <Building2 className="w-3 h-3" /> Internal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-gray-700">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {t.region || 'Regional Central'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {t.customer_name || t.category}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {t.assigned_resource_name ? (
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{t.assigned_resource_name}</span>
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {t.assigned_resource_type === 'INTERNAL' ? 'NOC Team' : `${t.assigned_resource_region} Field`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending Dispatch
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {isPending ? (
                            <div>
                              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-amber-300 inline-flex items-center gap-1 animate-pulse">
                                <AlertCircle className="w-3 h-3 text-amber-600" /> Needs Sign-Off
                              </span>
                              {isP1orP2 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playVoiceScript(getTicketVoiceScript(t));
                                  }}
                                  className="mt-1.5 text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-2xs font-medium"
                                  title="Listen to automated recorded voice dispatch call"
                                >
                                  <PhoneOutgoing className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                                  <span>Voice Call Dispatched</span>
                                  <Volume2 className="w-2.5 h-2.5 text-amber-600" />
                                </button>
                              )}
                            </div>
                          ) : t.approval_status === 'APPROVED' ? (
                            <div>
                              <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" /> Approved &amp; Routed
                              </span>
                              {t.approval_notes && (
                                <div className="text-[10px] text-gray-500 mt-1 italic line-clamp-1 max-w-[150px]" title={t.approval_notes}>
                                  "{t.approval_notes}"
                                </div>
                              )}
                            </div>
                          ) : t.approval_status === 'REJECTED' ? (
                            <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full text-[10px] border border-rose-200">
                              Rejected
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full text-[10px] border border-blue-100 inline-flex items-center gap-1">
                              <Zap className="w-3 h-3 text-blue-500" /> Zero-Touch Auto
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleOpenApproveModal(t)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                                  title="Review incident, listen to voice alert, and authorize dispatch"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Review &amp; Approve</span>
                                </button>
                                <button
                                  onClick={() => handleReject(t.id)}
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-semibold cursor-pointer transition-colors"
                                  title="Reject ticket"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {t.status === 'Assigned' && (
                              <button
                                onClick={() => handleResolve(t.id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold cursor-pointer transition-colors"
                              >
                                Resolve
                              </button>
                            )}

                            {t.status === 'Resolved' && (
                              <span className="text-[11px] text-gray-400 font-mono">Resolved</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Regional Resource Directory & Workload */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl card-shadow overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-xs text-gray-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#2463EB]" />
              <span>Regional Capacity Board</span>
            </div>
            <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {resources.length} resources
            </span>
          </div>

          <div className="p-3 bg-blue-50/50 border-b border-gray-100 text-[11px] text-gray-600">
            Auto-assignment allocates tickets to the field resource matching ticket region with the lowest active workload.
          </div>

          <div className="p-3 space-y-2 overflow-y-auto max-h-[580px]">
            {resources.map((res) => {
              const isInternal = res.resource_type === 'INTERNAL';
              const isFull = res.active_tickets_count >= res.max_capacity;

              return (
                <div
                  key={res.id}
                  onClick={() => handleOpenResourceTimeline(res)}
                  className="p-3 rounded-lg border border-gray-200/80 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-xs transition-all text-xs cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700 flex items-center gap-1.5">
                      <span>{res.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        res.status === 'Available'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-500">
                    <div className="flex items-center gap-1">
                      {isInternal ? (
                        <span className="text-indigo-600 font-medium">🏢 Internal NOC</span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {res.region}
                        </span>
                      )}
                    </div>

                    <div className="font-mono font-medium">
                      Workload: <span className={isFull ? 'text-rose-600 font-bold' : res.active_tickets_count > 4 ? 'text-amber-600 font-bold' : 'text-gray-900'}>{res.active_tickets_count}/{res.max_capacity}</span>
                    </div>
                  </div>

                  {/* Visual Capacity Bar */}
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-rose-500' : res.active_tickets_count > 4 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, (res.active_tickets_count / res.max_capacity) * 100)}%` }}
                    />
                  </div>

                  {/* Click hint footer */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 text-[10px] text-gray-400 group-hover:text-blue-600">
                    <span>SLA Timeline &amp; Tasks</span>
                    <span className="font-semibold flex items-center gap-0.5">View Tasks &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resource Workload & Resolution Timeline Modal */}
      {selectedResourceTimeline && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedResourceTimeline.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{selectedResourceTimeline.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {selectedResourceTimeline.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {selectedResourceTimeline.region}
                    </span>
                    <span>&bull;</span>
                    <span>{selectedResourceTimeline.resource_type === 'INTERNAL' ? 'Internal NOC Specialist' : 'Regional Field Engineer'}</span>
                    {selectedResourceTimeline.phone && (
                      <>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {selectedResourceTimeline.phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedResourceTimeline(null);
                  setTimelineData(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPIs Strip */}
            <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100 grid grid-cols-3 gap-3 shrink-0 text-xs">
              <div className="bg-white/80 p-3 rounded-lg border border-gray-200/70">
                <div className="text-gray-500 text-[11px] font-medium">Active Assigned Workload</div>
                <div className="text-lg font-bold font-mono text-gray-900 mt-0.5">
                  {timelineData?.total_active ?? selectedResourceTimeline.active_tickets_count} / {selectedResourceTimeline.max_capacity}
                </div>
                <div className="text-[10px] text-gray-400">Concurrent active tasks</div>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-gray-200/70">
                <div className="text-gray-500 text-[11px] font-medium">Earliest SLA Target</div>
                <div className="text-lg font-bold font-mono text-amber-600 mt-0.5">
                  {timelineData?.active_tickets?.[0]?.minutes_to_sla !== undefined
                    ? formatMinutes(timelineData.active_tickets[0].minutes_to_sla)
                    : 'No pending SLA'}
                </div>
                <div className="text-[10px] text-gray-400">First in queue deadline</div>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-gray-200/70">
                <div className="text-gray-500 text-[11px] font-medium">Resolved Past History</div>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                  {timelineData?.total_resolved || 0} tickets
                </div>
                <div className="text-[10px] text-gray-400">Successfully closed</div>
              </div>
            </div>

            {/* Tabs Header */}
            <div className="px-4 pt-3 border-b border-gray-200 flex items-center gap-4 text-xs font-semibold shrink-0">
              <button
                onClick={() => setTimelineTab('ACTIVE')}
                className={`pb-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  timelineTab === 'ACTIVE'
                    ? 'border-blue-600 text-blue-700 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Active Resolution Timeline ({timelineData?.total_active || 0})</span>
              </button>

              <button
                onClick={() => setTimelineTab('RESOLVED')}
                className={`pb-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  timelineTab === 'RESOLVED'
                    ? 'border-blue-600 text-blue-700 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolved History ({timelineData?.total_resolved || 0})</span>
              </button>
            </div>

            {/* Timeline Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
              {timelineLoading ? (
                <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Loading resolution timeline &amp; SLA deadlines...</span>
                </div>
              ) : timelineTab === 'ACTIVE' ? (
                timelineData?.active_tickets?.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <div className="font-semibold text-gray-700">No active tickets assigned right now</div>
                    <p className="text-[11px] text-gray-400 mt-0.5">Engineer has 100% free capacity to accept new dispatches.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 flex items-center justify-between">
                      <span>Chronological Resolution Schedule (SLA Priority Order)</span>
                      <span className="text-[10px] text-blue-600 font-normal">Resolve top items first to prevent SLA breach</span>
                    </div>

                    {timelineData?.active_tickets?.map((item, idx) => {
                      const isUrgent = item.urgency_level === 'Critical' || item.urgency_level === 'Overdue';
                      const isWarning = item.urgency_level === 'Warning';

                      const priorityBadgeClass = {
                        P1: 'bg-rose-50 text-rose-700 border-rose-200',
                        P2: 'bg-amber-50 text-amber-700 border-amber-200',
                        P3: 'bg-blue-50 text-blue-700 border-blue-200',
                        P4: 'bg-slate-100 text-slate-700 border-slate-200'
                      }[item.priority] || 'bg-gray-100 text-gray-700 border-gray-200';

                      return (
                        <div
                          key={item.ticket_id}
                          className={`p-4 rounded-xl border transition-all relative ${
                            idx === 0
                              ? 'bg-blue-50/40 border-blue-200 shadow-xs ring-1 ring-blue-400/30'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Order Step Pill */}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                idx === 0
                                  ? 'bg-[#2463EB] text-white shadow-xs'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {idx === 0 ? '1st in Queue — Resolve Next' : idx === 1 ? '2nd in Queue' : `Queue #${idx + 1}`}
                              </span>

                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${priorityBadgeClass}`}>
                                {item.priority}
                              </span>

                              <span className="font-mono font-bold text-gray-900 text-xs">{item.ticket_code}</span>
                              <span className="text-gray-400">&bull;</span>
                              <span className="font-medium text-gray-700 text-xs">{item.category}</span>
                            </div>

                            {/* SLA Urgency Pill */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                isUrgent
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                                  : isWarning
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>{formatMinutes(item.minutes_to_sla)}</span>
                              </span>
                            </div>
                          </div>

                          <div className="mt-2.5 text-xs text-gray-700 leading-relaxed">
                            {item.description}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-500">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{item.customer_name}</span>
                              <span>&bull;</span>
                              <span>{item.locality}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.sla_deadline && (
                                <span className="font-mono text-[10px] text-gray-400">
                                  Target: {new Date(item.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              <button
                                onClick={() => handleResolveFromTimeline(item.ticket_id)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1 shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Resolved</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                timelineData?.resolved_tickets?.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">No resolved history recorded yet for this resource.</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 flex items-center justify-between">
                      <span>Recent Completed Tasks ({timelineData?.resolved_tickets?.length || 0})</span>
                      <span className="text-[10px] text-emerald-600 font-normal">Synchronized in real-time</span>
                    </div>
                    {timelineData?.resolved_tickets?.map((item) => (
                      <div key={item.ticket_id} className="p-3 bg-gray-50/70 border border-gray-100 rounded-lg text-xs flex items-center justify-between gap-3 hover:border-gray-200 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-gray-800">{item.ticket_code}</span>
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-1.5 py-0.5 rounded">{item.priority}</span>
                            <span className="font-medium text-gray-700">{item.category}</span>
                            {item.customer_name && (
                              <>
                                <span className="text-gray-400">&bull;</span>
                                <span className="text-[11px] text-gray-600 font-medium">
                                  {item.customer_name} {item.locality ? `(${item.locality})` : ''}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">{item.description}</div>
                          {item.resolved_at && (
                            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Resolved: {new Date(item.resolved_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-[10px]">
                          <Check className="w-3 h-3" />
                          <span>Resolved</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raise Incident Ticket Modal */}
      {isRaiseModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Raise New Incident Ticket</h3>
                  <p className="text-[11px] text-gray-500">Auto-routes to regional field or internal engineers</p>
                </div>
              </div>
              <button
                onClick={() => setIsRaiseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTicket} className="p-5 space-y-4 text-xs">
              {/* Ticket Source Selection */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Ticket Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, source: 'CUSTOMER' })}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      formData.source === 'CUSTOMER'
                        ? 'border-[#2463EB] bg-blue-50/60 text-[#2463EB] font-bold shadow-xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Customer / Regional</span>
                    </div>
                    <div className="text-[10px] font-normal text-gray-500 mt-0.5">Dispatched to regional locality field engineer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, source: 'INTERNAL' })}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      formData.source === 'INTERNAL'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 font-bold shadow-xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Internal NOC / Core</span>
                    </div>
                    <div className="text-[10px] font-normal text-gray-500 mt-0.5">Dispatched directly to internal engineering pool</div>
                  </button>
                </div>
              </div>

              {/* Region (Only if Customer source) */}
              {formData.source === 'CUSTOMER' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Region / Locality</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                  >
                    {availableRegions
                      .filter((r) => !r.toLowerCase().includes('internal'))
                      .map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Category & Priority in 2 Columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                  >
                    {formData.source === 'INTERNAL' ? (
                      <>
                        <option value="Core Network">Core Network</option>
                        <option value="Optical Backbone">Optical Backbone</option>
                        <option value="BSS Mediation">BSS Mediation</option>
                        <option value="RADIUS Gateway">RADIUS Gateway</option>
                        <option value="Server Infrastructure">Server Infrastructure</option>
                      </>
                    ) : (
                      <>
                        <option value="Speed">Speed / Degradation</option>
                        <option value="Outage">Outage / Loss of Signal</option>
                        <option value="Hardware">Hardware / ONT</option>
                        <option value="Install">New Installation</option>
                        <option value="Billing">Billing &amp; Recharge</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="P1">P1 — Critical (Approval Gate)</option>
                    <option value="P2">P2 — High (Approval Gate)</option>
                    <option value="P3">P3 — Medium (Zero-Touch Auto)</option>
                    <option value="P4">P4 — Low (Zero-Touch Auto)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Routing Policy Feedback Indicator */}
              <div
                className={`p-3 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
                  formData.source === 'INTERNAL'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : ['P1', 'P2'].includes(formData.priority)
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Automated Routing Action: </span>
                  {formData.source === 'INTERNAL' ? (
                    <span>Ticket will be auto-assigned immediately to an available Internal NOC resource.</span>
                  ) : ['P1', 'P2'].includes(formData.priority) ? (
                    <span>
                      High-impact {formData.priority} ticket will require managerial approval. Once approved, it will be automatically dispatched to a field engineer in {formData.region}.
                    </span>
                  ) : (
                    <span>
                      {formData.priority} incident will be automatically assigned (Zero-Touch) to the field engineer with least workload in {formData.region}.
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Incident Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="E.g., Low optical receive power on customer terminal ONT, packet drops observed on upstream port..."
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRaiseModalOpen(false)}
                  className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#2463EB] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Dispatching...' : 'Raise & Auto-Route'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Managerial Approval, Voice Call & Field Dispatch Modal */}
      {approvingTicket && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">Managerial Sign-Off &amp; Field Dispatch</h3>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                      approvingTicket.priority === 'P1'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {approvingTicket.priority} Urgent
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ticket #{approvingTicket.ticket_code} &bull; {approvingTicket.region || 'Regional Network'} &bull; {approvingTicket.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopVoiceScript();
                  setApprovingTicket(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Ticket Summary Alert */}
              <div className="p-3.5 bg-slate-50 border border-gray-200 rounded-xl">
                <div className="font-semibold text-gray-800 mb-1 flex items-center justify-between">
                  <span>Incident Description</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Raised: {new Date(approvingTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">{approvingTicket.description}</p>
              </div>

              {/* Automated Emergency Voice Call Card */}
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                        <span>Automated Voice Alert to Approving Authority</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          callSimulationState === 'CALLING'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                            : callSimulationState === 'CONNECTED'
                            ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {callSimulationState === 'CALLING' ? (
                            <>
                              <PhoneOutgoing className="w-2.5 h-2.5 animate-spin" /> Calling Authority...
                            </>
                          ) : callSimulationState === 'CONNECTED' ? (
                            <>
                              <Radio className="w-2.5 h-2.5 animate-pulse" /> Call Connected
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Voice Call Delivered
                            </>
                          )}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-2">
                        <span>Target: <strong>Vikram Rathore (NOC Lead Authority)</strong></span>
                        <span>&bull;</span>
                        <span className="font-mono text-gray-500">+91 98200 12345</span>
                      </div>
                    </div>
                  </div>

                  {/* Re-dial Button */}
                  <button
                    type="button"
                    onClick={() => handleSimulateCall(approvingTicket.id)}
                    disabled={callSimulationState === 'CALLING'}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Simulate re-dialing the authority with recorded message"
                  >
                    <PhoneOutgoing className="w-3 h-3" />
                    <span>Re-dial Call</span>
                  </button>
                </div>

                {/* Transcribed Script & Audio Playback Box */}
                <div className="mt-3 p-3 bg-white/90 border border-amber-200/90 rounded-lg">
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900">
                      <Radio className="w-3.5 h-3.5 text-amber-600" />
                      <span>Recorded Dispatch Speech Script:</span>
                    </div>

                    {/* Audio Play/Stop Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlayingVoice) {
                          stopVoiceScript();
                        } else {
                          playVoiceScript(getTicketVoiceScript(approvingTicket));
                        }
                      }}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                        isPlayingVoice
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs animate-pulse'
                          : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                      }`}
                    >
                      {isPlayingVoice ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Play Voice Audio</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-700 leading-relaxed italic bg-amber-50/40 p-2.5 rounded border border-amber-100/60 font-sans">
                    "{getTicketVoiceScript(approvingTicket)}"
                  </p>

                  {/* Audio Waveform visualization indicator when playing */}
                  {isPlayingVoice && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-800 font-mono">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Transmitting voice alert audio to speaker...</span>
                      <div className="flex items-end gap-0.5 h-3 ml-2">
                        <span className="w-1 bg-amber-600 rounded-full animate-pulse h-2" />
                        <span className="w-1 bg-amber-600 rounded-full animate-pulse h-3" />
                        <span className="w-1 bg-amber-600 rounded-full animate-pulse h-1" />
                        <span className="w-1 bg-amber-600 rounded-full animate-pulse h-3" />
                        <span className="w-1 bg-amber-600 rounded-full animate-pulse h-2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Technician Dispatch Assignment Mode */}
              <div>
                <label className="block font-bold text-gray-800 mb-1.5">
                  Field Technician Assignment Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* AI Option */}
                  <div
                    onClick={() => setAssignMode('AI')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      assignMode === 'AI'
                        ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/20 text-blue-900 shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>AI Auto-Dispatch (Recommended)</span>
                      </div>
                      <input
                        type="radio"
                        name="assignMode"
                        checked={assignMode === 'AI'}
                        onChange={() => setAssignMode('AI')}
                        className="text-blue-600"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      SentinelOS engine allocates to the optimal resource in {approvingTicket.region || 'area'} with lowest workload.
                    </p>
                  </div>

                  {/* Manual Option */}
                  <div
                    onClick={() => setAssignMode('MANUAL')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      assignMode === 'MANUAL'
                        ? 'bg-indigo-50/60 border-indigo-500 ring-1 ring-indigo-500/20 text-indigo-900 shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Manual Technician Selection</span>
                      </div>
                      <input
                        type="radio"
                        name="assignMode"
                        checked={assignMode === 'MANUAL'}
                        onChange={() => setAssignMode('MANUAL')}
                        className="text-indigo-600"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Override automated dispatch and directly select a specific field engineer or NOC specialist.
                    </p>
                  </div>
                </div>

                {/* Manual Technician Dropdown (shown if assignMode === 'MANUAL') */}
                {assignMode === 'MANUAL' && (
                  <div className="mt-3 p-3 bg-gray-50/80 border border-gray-200 rounded-xl space-y-1.5">
                    <label className="block text-[11px] font-semibold text-gray-700">
                      Choose Field Engineer / Specialist:
                    </label>
                    <select
                      value={selectedTechnicianId}
                      onChange={(e) => setSelectedTechnicianId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                    >
                      <option value="">-- Select Available Technician --</option>
                      {resources.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.name} — {res.region} ({res.active_tickets_count}/{res.max_capacity} tasks) [{res.status}]
                        </option>
                      ))}
                    </select>
                    {selectedTechnicianId && (
                      <div className="text-[10px] text-indigo-700 font-medium pt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Will be manually assigned to {resources.find(r => String(r.id) === String(selectedTechnicianId))?.name} upon sign-off.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Approval Notes / Instructions */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Managerial Approval Notes &amp; Dispatch Directives
                </label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-[10px] text-gray-400 font-medium">Quick suggestions:</span>
                  {[
                    "Approved for immediate field dispatch",
                    "Priority client escalation approved",
                    "Fiber micro-bending splice authorized",
                    "Supervisory sign-off granted"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setApprovalNotes(preset)}
                      className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Enter specific sign-off instructions or directives for the field engineer..."
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  stopVoiceScript();
                  setApprovingTicket(null);
                }}
                className="px-3.5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleReject(approvingTicket.id);
                    setApprovingTicket(null);
                  }}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs cursor-pointer transition-colors"
                >
                  Reject Ticket
                </button>

                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  disabled={actionLoading || (assignMode === 'MANUAL' && !selectedTechnicianId)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoading ? 'Authorizing Dispatch...' : 'Confirm Approval & Dispatch'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AutomaticTicketing;
