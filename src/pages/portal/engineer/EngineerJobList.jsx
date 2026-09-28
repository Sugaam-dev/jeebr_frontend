import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useMarket } from '../../../context/MarketContext';
import { toast } from '../../../components/common/Toast';
import {
  Wrench,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  User
} from 'lucide-react';

const STATUS_CONFIG = {
  ASSIGNED: { label: 'Assigned', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  ACCEPTED: { label: 'Accepted', color: 'bg-blue-950 text-blue-300 border-blue-800' },
  EN_ROUTE: { label: 'En Route', color: 'bg-cyan-950 text-cyan-300 border-cyan-800 animate-pulse' },
  ARRIVED: { label: 'Arrived', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
  WORKING: { label: 'Working', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  OTP_REQUESTED: { label: 'OTP Sent', color: 'bg-amber-900 text-amber-200 border-amber-500 animate-pulse' },
  OTP_VERIFIED: { label: 'Verified', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-900/60 text-emerald-400 border-emerald-700' }
};

export const EngineerJobList = () => {
  const { user } = useAuth();
  const { currentMarket } = useMarket();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // Field Engineer role MUST call getMyFieldJobs() to avoid 403 on NOC getFieldJobs()
      const list = user?.role === 'Field Engineer'
        ? await api.getMyFieldJobs()
        : await api.getFieldJobs();
      setJobs(list || []);
    } catch (err) {
      console.error('Failed to load field jobs:', err);
      toast.error('Unable to retrieve assigned field jobs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs(true);
  }, [currentMarket, user]);

  const activeJobs = jobs.filter((j) => j.status !== 'COMPLETED');
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>Assigned Field Work orders</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeJobs.length} active dispatches in queue &bull; {completedJobs.length} completed today
          </p>
        </div>

        <button
          onClick={() => fetchJobs(true)}
          disabled={refreshing}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
          title="Refresh Job Queue"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
          <div className="text-xs text-slate-400 font-mono">Syncing assigned workorders...</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-white">No Assigned Workorders</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You currently have no open field jobs assigned in {currentMarket?.toUpperCase() || 'the region'}. Stand by for NOC automated dispatches.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.ASSIGNED;
            const customerName = job.customer_name || 'Subscriber';
            const locality = job.locality || job.customer_locality || 'Regional Premise';

            return (
              <div
                key={job.id}
                onClick={() => navigate(`/portal/engineer/job/${job.id}`)}
                className="group p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden"
              >
                {/* Active Job Accent Indicator */}
                {['EN_ROUTE', 'ARRIVED', 'WORKING', 'OTP_REQUESTED'].includes(job.status) && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400" />
                )}

                {/* Top Row: Ticket Code & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      {job.ticket_code || `JOB-#${job.id}`}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {job.category || 'Optical Fault'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Middle Row: Customer & Locality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium truncate">{customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{locality}</span>
                  </div>
                </div>

                {/* Bottom Row: Priority & Notes */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.2 rounded font-bold text-[10px] ${
                      job.priority === 'P1'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {job.priority || 'P2'}
                    </span>
                    <span className="truncate max-w-[200px] sm:max-w-xs text-slate-500">
                      {job.notes || 'Optical loss remediation'}
                    </span>
                  </div>

                  <span className="text-amber-400/90 font-medium group-hover:underline flex items-center gap-1">
                    Execute Job &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EngineerJobList;
