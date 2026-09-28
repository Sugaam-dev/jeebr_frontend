import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useMarket } from '../../../context/MarketContext';
import { toast } from '../../../components/common/Toast';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Navigation,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';

export const CustomerTickets = () => {
  const { user } = useAuth();
  const { currentMarket } = useMarket();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getTickets({}, isManual);
      const customerEmail = user?.email?.toLowerCase().trim();
      const filtered = data.filter((t) => {
        if (!t.customer) return false;
        return t.customer.email?.toLowerCase().trim() === customerEmail;
      });
      setTickets(filtered.length > 0 ? filtered : data.filter((t) => t.source === 'CUSTOMER'));
    } catch (err) {
      console.error('Failed to load tickets:', err);
      toast.error('Unable to retrieve tickets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);
  }, [currentMarket, user]);

  const displayedTickets = tickets.filter((t) => {
    if (filterStatus === 'ACTIVE') {
      if (['Resolved', 'Closed', 'COMPLETED'].includes(t.status)) return false;
    } else if (filterStatus === 'RESOLVED') {
      if (!['Resolved', 'Closed', 'COMPLETED'].includes(t.status)) return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchCode = t.ticket_code?.toLowerCase().includes(query);
      const matchCat = t.category?.toLowerCase().includes(query);
      const matchDesc = t.description?.toLowerCase().includes(query);
      return matchCode || matchCat || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/portal/customer/home"
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Service Request History
          </h1>
          <p className="text-xs text-slate-500">
            Full record of all customer service complaints and technician resolutions
          </p>
        </div>

        <button
          onClick={() => fetchTickets(true)}
          disabled={refreshing}
          className="self-start sm:self-auto py-2 px-3.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket code or category..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({tickets.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'ACTIVE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'RESOLVED'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <div className="text-xs text-slate-500">Loading service history...</div>
        </div>
      ) : displayedTickets.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
          <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No Tickets Found</div>
          <div className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'No complaints matched your search filter.' : 'You have not raised any service requests yet.'}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Locality</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Field Engineer</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTickets.map((t) => {
                  const isResolved = ['Resolved', 'Closed', 'COMPLETED'].includes(t.status);
                  const engName = t.assigned_resource?.name;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {t.ticket_code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {t.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          t.priority === 'P1'
                            ? 'bg-rose-100 text-rose-800'
                            : t.priority === 'P2'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.region || 'Regional Hub'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isResolved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {engName ? (
                          <span>{engName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/portal/customer/track/${t.id}`}
                          className="inline-flex items-center gap-1.5 py-1 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{isResolved ? 'Details' : 'Track Live'}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTickets;
