import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CustomerTrackingCard } from '../../../components/customer/CustomerTrackingCard';
import { ArrowLeft, ShieldAlert, PhoneCall, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export const CustomerTracking = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [resolvedId, setResolvedId] = useState(id);
  const [loading, setLoading] = useState(!id);

  useEffect(() => {
    if (id) {
      setResolvedId(id);
      return;
    }

    const findActiveTicket = async () => {
      try {
        const data = await api.getTickets({});
        const customerEmail = user?.email?.toLowerCase().trim();
        const customerTickets = data.filter(
          (t) => !t.customer || t.customer?.email?.toLowerCase().trim() === customerEmail
        );
        const active = customerTickets.find((t) => t.assigned_resource_id) || customerTickets[0];
        if (active) {
          setResolvedId(active.id);
        }
      } catch (err) {
        console.error('Failed to lookup active ticket for tracking:', err);
      } finally {
        setLoading(false);
      }
    };

    findActiveTicket();
  }, [id, user]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/portal/customer/home"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-400">
          Telemetry Session {resolvedId ? `#${resolvedId}` : 'Dispatch'}
        </span>
      </div>

      {/* Main Live Tracking Component */}
      {loading ? (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <div className="text-xs text-slate-500">Locating your active service dispatch...</div>
        </div>
      ) : resolvedId ? (
        <CustomerTrackingCard ticketId={resolvedId} />
      ) : (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-2">
          <div className="text-sm font-bold text-slate-800">No Active Service Dispatch</div>
          <div className="text-xs text-slate-500">
            You do not currently have any active dispatch tickets requiring field engineer tracking.
          </div>
          <Link
            to="/portal/customer/home"
            className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Go to Home
          </Link>
        </div>
      )}

      {/* Subscriber Safety & Zero-Trust Notice */}
      <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-5 text-slate-700 text-xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldAlert className="w-4 h-4 text-blue-600" />
          <span>Zero-Trust Field Protocol Guidelines</span>
        </div>
        <ul className="space-y-2 text-slate-600 text-[11.5px] leading-relaxed list-disc list-inside">
          <li>
            <strong>Identity Verification:</strong> Always verify that the engineer’s badge name matches the designated technician shown above.
          </li>
          <li>
            <strong>Safe PIN Delivery:</strong> Your 6-digit Handshake PIN is only generated when the technician requests closure at your premises.
          </li>
          <li>
            <strong>Line Verification:</strong> Do not disclose your PIN until the technician has demonstrated that broadband optical light and throughput speeds are fully restored.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerTracking;
