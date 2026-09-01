import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, ExternalLink } from 'lucide-react';

export const CustomerSearch = ({ onOpen360 }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locality, setLocality] = useState('');
  const [segment, setSegment] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getCustomers(searchTerm, locality, segment)
      .then(setCustomers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [locality, segment]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 card-shadow">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Integration &amp; insight layer</div>
        <h1 className="text-xl font-bold text-gray-900 mt-1">
          Subscriber Profile Explorer &amp; Customer 360
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Search across Mumbai subscriber accounts to inspect correlated network telemetry, tickets, billing history, and active recommendations.
        </p>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, customer code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors font-mono shadow-xs"
          />
        </div>

        <select
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors font-medium shadow-xs"
        >
          <option value="">All localities</option>
          <option value="Bandra West">Bandra West</option>
          <option value="Andheri East">Andheri East</option>
          <option value="BKC">BKC</option>
          <option value="Powai">Powai</option>
          <option value="Lower Parel">Lower Parel</option>
          <option value="Dadar">Dadar</option>
          <option value="Malad West">Malad West</option>
          <option value="Thane West">Thane West</option>
        </select>

        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors font-medium shadow-xs"
        >
          <option value="">All segments</option>
          <option value="Home Broadband">Home Broadband</option>
          <option value="ILL-Corporate">ILL-Corporate</option>
        </select>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {/* Customer List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-900">Subscriber database</span>
          <span className="font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">{customers.length} accounts loaded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Account code</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Subscriber name</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Locality</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Plan &amp; segment</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">ARPU</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Lifecycle stage</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-right">Customer 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {customers.map((c) => (
                <tr key={c.id} className="cursor-pointer transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-mono text-gray-500">{c.customer_code}</td>
                  <td className="px-4 py-3.5 font-bold text-gray-900">{c.name}</td>
                  <td className="px-4 py-3.5 text-gray-600">{c.locality}</td>
                  <td className="px-4 py-3.5 text-gray-900">
                    <div className="font-medium">{c.plan_name}</div>
                    <div className="text-[11px] text-gray-400 font-mono">{c.segment}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-gray-900">&#8377;{c.arpu}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {c.current_stage}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onOpen360(c.id)}
                      className="px-3 py-1 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>View 360</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
