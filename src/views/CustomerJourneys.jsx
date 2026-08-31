import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckCircle2, ExternalLink } from 'lucide-react';

export const CustomerJourneys = ({ onOpen360, onOpenGovernance }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getJourneyNBAs()
      .then(setItems)
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const stages = ['All', 'Acquisition', 'Install', 'Use', 'Renewal', 'Complaint', 'Win-back'];

  const filtered = items.filter((i) => activeStage === 'All' || i.current_stage === activeStage);

  const handlePropose = async (item) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const rec = await api.proposeJourneyAction(item.customer_id);
      setSuccessMsg(`Next-Best-Action for ${item.name} sent to governance queue (ID #${rec.id}).`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit journey proposal');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#8B8F99]">Governed workflow engine</div>
          <h1 className="text-base font-bold text-[#EDEBE6] mt-0.5">
            Intelligent Customer Journeys & Next-Best-Action
          </h1>
          <p className="text-xs text-[#8B8F99] mt-0.5">
            Rule-based Next-Best-Action mapping across Acquisition, Install, Use, Renewal, Complaint, and Win-back stages.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-[#232733] hover:bg-[#2C303C] text-xs font-medium text-[#EDEBE6] rounded transition-colors shrink-0 border border-[#2C303C]"
        >
          Refresh stages
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-[#232733] border border-[#4FAE8C] text-[#4FAE8C] text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={onOpenGovernance}
            className="underline font-medium hover:text-[#EDEBE6] ml-4 shrink-0"
          >
            View in approval queue &rarr;
          </button>
        </div>
      )}

      {/* Stage Filter Buttons (Sentence Case, Clean) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        {stages.map((st) => {
          const count = st === 'All' ? items.length : items.filter((i) => i.current_stage === st).length;
          const isActive = activeStage === st;
          return (
            <button
              key={st}
              onClick={() => setActiveStage(st)}
              className={`px-3 py-1.5 rounded transition-colors shrink-0 flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-[#232733] text-[#EDEBE6] font-medium border border-[#2C303C]'
                  : 'text-[#8B8F99] hover:text-[#EDEBE6] hover:bg-[#1C1F27]'
              }`}
            >
              <span>{st}</span>
              <span className="text-[11px] font-mono text-[#8B8F99]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.slice(0, 30).map((item) => (
          <div key={item.customer_id} className="p-4 rounded-lg bg-[#1C1F27] border border-[#2C303C] flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#8B8F99]">
                <span>Stage: <strong className="text-[#EDEBE6] font-medium">{item.current_stage}</strong></span>
                <span className="font-mono">{(item.confidence_score * 100).toFixed(0)}% confidence</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#EDEBE6]">{item.name}</h3>
                  <button
                    onClick={() => onOpen360(item.customer_id)}
                    className="text-[#8B8F99] hover:text-[#EDEBE6]"
                    title="View Customer 360"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#8B8F99] font-mono">{item.customer_code} &bull; {item.locality}</p>
              </div>

              <div className="p-2.5 rounded bg-[#14161C] border border-[#2C303C] space-y-1 text-xs">
                <div className="text-[#8B8F99] text-[11px]">Next-Best-Action</div>
                <div className="font-medium text-[#EDEBE6]">{item.next_best_action}</div>
                <div className="text-[11px] text-[#8B8F99]"><strong>Reason:</strong> {item.action_reason}</div>
                <div className="text-[11px] text-[#8B8F99]"><strong>Channel:</strong> {item.suggested_channel}</div>
              </div>
            </div>

            <button
              onClick={() => handlePropose(item)}
              className="w-full py-1.5 rounded bg-[#14161C] hover:bg-[#232733] text-xs font-medium text-[#EDEBE6] transition-colors border border-[#2C303C]"
            >
              Propose action to governance
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
