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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-4">
        <div className="text-xs font-medium text-[#8B8F99]">Integration & insight layer</div>
        <h1 className="text-base font-bold text-[#EDEBE6] mt-0.5">
          Subscriber Profile Explorer & Customer 360
        </h1>
        <p className="text-xs text-[#8B8F99] mt-0.5">
          Search across Mumbai subscriber accounts to inspect correlated network telemetry, tickets, billing history, and active recommendations.
        </p>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8B8F99] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, customer code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded bg-[#1C1F27] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none font-mono"
          />
        </div>

        <select
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          className="px-3 py-2 rounded bg-[#1C1F27] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none font-mono"
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
          className="px-3 py-2 rounded bg-[#1C1F27] border border-[#2C303C] text-xs text-[#EDEBE6] focus:outline-none font-mono"
        >
          <option value="">All segments</option>
          <option value="Home Broadband">Home Broadband</option>
          <option value="ILL-Corporate">ILL-Corporate</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 bg-[#232733] hover:bg-[#2C303C] text-[#EDEBE6] font-medium text-xs rounded transition-colors border border-[#2C303C] shrink-0"
        >
          Search
        </button>
      </form>

      {/* Customer List */}
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg overflow-hidden">
        <div className="p-3.5 border-b border-[#2C303C] flex items-center justify-between text-xs text-[#8B8F99]">
          <span className="font-medium text-[#EDEBE6]">Subscriber database</span>
          <span className="font-mono">{customers.length} accounts loaded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14161C] border-b border-[#2C303C] text-[#8B8F99]">
              <tr>
                <th className="p-3 font-medium">Account code</th>
                <th className="p-3 font-medium">Subscriber name</th>
                <th className="p-3 font-medium">Locality</th>
                <th className="p-3 font-medium">Plan & segment</th>
                <th className="p-3 font-medium">ARPU</th>
                <th className="p-3 font-medium">Lifecycle stage</th>
                <th className="p-3 font-medium text-right">Customer 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C303C]">
              {customers.map((c) => (
                <tr key={c.id} className="text-[#EDEBE6] hover:bg-[#14161C] transition-colors">
                  <td className="p-3 font-mono text-[#8B8F99]">{c.customer_code}</td>
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3 text-[#8B8F99]">{c.locality}</td>
                  <td className="p-3">
                    <div>{c.plan_name}</div>
                    <div className="text-[11px] text-[#8B8F99]">{c.segment}</div>
                  </td>
                  <td className="p-3 font-mono">&#8377;{c.arpu}</td>
                  <td className="p-3 text-[#8B8F99]">{c.current_stage}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onOpen360(c.id)}
                      className="px-2.5 py-1 bg-[#14161C] hover:bg-[#232733] text-[#EDEBE6] rounded text-xs transition-colors border border-[#2C303C] inline-flex items-center space-x-1"
                    >
                      <span>View 360</span>
                      <ExternalLink className="w-3 h-3 text-[#8B8F99]" />
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
