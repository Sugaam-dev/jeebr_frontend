import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useMarket } from '../../../context/MarketContext';
import { toast } from '../../../components/common/Toast';
import { CustomerTrackingCard } from '../../../components/customer/CustomerTrackingCard';
import {
  Plus,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Navigation,
  ShieldCheck,
  Wifi,
  Wrench,
  X
} from 'lucide-react';

const CATEGORIES = [
  'Broadband Down',
  'Optical Loss / High dBm',
  'Fiber Cut',
  'Slow Speed',
  'Router Failure',
  'Billing Query'
];

export const CustomerHome = () => {
  const { user } = useAuth();
  const { currentMarket } = useMarket();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('Broadband Down');
  const [priority, setPriority] = useState('P2');
  const [region, setRegion] = useState(currentMarket === 'kolkata' ? 'Salt Lake Sector V' : 'Bandra West');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getTickets({}, isManual);
      // Filter tickets for this customer if customer email is matched or show relevant customer tickets
      const customerEmail = user?.email?.toLowerCase().trim();
      const filtered = data.filter((t) => {
        if (!t.customer) return false;
        return t.customer.email?.toLowerCase().trim() === customerEmail;
      });
      // If customer has no specific tickets matched by email (e.g. newly created account),
      // we show customer source tickets or recent complaints in the market
      setTickets(filtered.length > 0 ? filtered : data.filter((t) => t.source === 'CUSTOMER').slice(0, 5));
    } catch (err) {
      console.error('Failed to load tickets:', err);
      toast.error('Unable to load your tickets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);
  }, [currentMarket, user]);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.warning('Please provide a brief description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createTicket({
        source: 'CUSTOMER',
        category,
        priority,
        region,
        description: description.trim()
      });
      toast.success('Complaint lodged successfully! A field team has been notified.');
      setIsModalOpen(false);
      setDescription('');
      fetchTickets(true);
    } catch (err) {
      console.error('Failed to raise ticket:', err);
      toast.error(err.message || 'Failed to submit service request.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeTickets = tickets.filter(
    (t) => !['Resolved', 'Closed', 'COMPLETED'].includes(t.status) || Boolean(t.assigned_resource_id)
  );
  const resolvedTickets = tickets.filter(
    (t) => ['Resolved', 'Closed', 'COMPLETED'].includes(t.status) && !t.assigned_resource_id
  );
  const primaryTrackTicket = activeTickets.find((t) => t.assigned_resource_id) || activeTickets[0] || tickets[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F225A] via-[#162D6E] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                Subscriber Self-Service Portal
              </span>
              <span className="text-xs text-blue-200/80">&bull; {currentMarket?.toUpperCase() || 'MUMBAI'} REGION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.full_name || 'Valued Subscriber'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Track real-time optical service requests, view designated field engineers, and complete safe PIN handshakes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-3 px-5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Service Complaint</span>
            </button>
            <button
              onClick={() => fetchTickets(true)}
              disabled={refreshing}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Active Complaints</div>
            <div className="text-xl font-black text-white mt-1">{activeTickets.length}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Resolved History</div>
            <div className="text-xl font-black text-white mt-1">{resolvedTickets.length}</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Line Telemetry</div>
            <div className="text-xs font-bold text-emerald-300 mt-1.5 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <span>{activeTickets.length > 0 ? 'Assistance Active' : 'Optical Link Nominal'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominently Embedded Real-Time Tracking & Verification PIN Card */}
      {primaryTrackTicket && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <h2 className="text-xs font-black tracking-wider uppercase text-slate-800">
                Live Field Dispatch &amp; Verification Telemetry
              </h2>
            </div>
            <Link
              to={`/portal/customer/track/${primaryTrackTicket.id}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
            >
              <span>Full Screen View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CustomerTrackingCard ticketId={primaryTrackTicket.id} />
        </div>
      )}

      {/* Active Service Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Active Service Tickets</h2>
            <p className="text-xs text-slate-500">Live field dispatch tracking and verification</p>
          </div>
          <Link
            to="/portal/customer/tickets"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <div className="text-xs text-slate-500 font-medium">Fetching active service tickets...</div>
          </div>
        ) : activeTickets.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Open Complaints</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your broadband service is nominal. If you are encountering slow speeds or optical loss, raise a complaint to dispatch an engineer.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Report an Issue</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {activeTickets.map((t) => {
              const engName = t.assigned_resource?.name;
              const hasAssignment = Boolean(t.assigned_resource_id);

              return (
                <div
                  key={t.id}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                        {t.ticket_code}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{t.category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        t.priority === 'P1'
                          ? 'bg-rose-100 text-rose-800'
                          : t.priority === 'P2'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {hasAssignment ? (
                          <>Assigned Engineer: <strong>{engName || 'Technician'}</strong></>
                        ) : (
                          <span className="text-amber-600 font-medium">Awaiting Dispatch Assignment</span>
                        )}
                      </span>
                    </div>

                    <Link
                      to={`/portal/customer/track/${t.id}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Track Live &bull; View OTP &rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Raise Service Complaint</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Impact / Urgency</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="P1">P1 - Critical (Complete Outage)</option>
                    <option value="P2">P2 - High (Degraded Optical)</option>
                    <option value="P3">P3 - Medium (Speed/Packet Loss)</option>
                    <option value="P4">P4 - Low (General Inquiry)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Locality / Area</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    placeholder="e.g. Bandra West"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description of Fault</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Describe your optical internet connection issue..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Once submitted, SentinelOS AI auto-assigns a regional field technician. You can track their transit live and confirm service using your Handshake PIN.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Service Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
