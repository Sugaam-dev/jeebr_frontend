import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useMarket } from '../../context/MarketContext';
import { MapContainer } from '../maps/MapContainer';
import { 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Info, 
  ExternalLink,
  Users,
  Compass,
  Building2,
  Navigation
} from 'lucide-react';

export const CrmMapView = ({ onOpen360 }) => {
  const { currentMarket, marketConfig } = useMarket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'verified', 'pending'

  const loadMapData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getCustomerMapLocations();
      setData(res);
    } catch (err) {
      console.error('Failed to load customer map locations:', err);
      setError(err.message || 'Failed to fetch customer geolocations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, [currentMarket]);

  const verifiedLocations = data?.locations?.filter((loc) => loc.has_coordinates) || [];
  const pendingLocations = data?.locations?.filter((loc) => !loc.has_coordinates) || [];

  // Transform verified customer locations into markers for MapContainer
  const customerMarkers = verifiedLocations.map((loc) => ({
    id: `cust-${loc.id || loc.customer_id || loc.customer_code}`,
    position: { lat: loc.latitude, lng: loc.longitude },
    title: loc.name,
    customer_code: loc.customer_code,
    locality: loc.locality,
    status: loc.status,
    customer_type: loc.customer_type,
    address: loc.address,
    type: 'customer',
    iconColor: loc.status === 'At-Risk' ? '#E11D48' : '#2563EB',
    onClick: () => setSelectedCustomer(loc)
  }));

  // Market center coordinates
  const marketCenter = currentMarket === 'kolkata' 
    ? { lat: 22.5726, lng: 88.3639 } 
    : { lat: 18.9220, lng: 72.8347 };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header & Telemetry Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 card-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Geospatial Coverage &amp; Drop-Point Fidelity</span>
            </div>
            <h2 className="text-base font-bold text-gray-900 mt-1">
              Customer Geolocation &amp; Survey Coverage Explorer
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Authoritative coordinate map for {marketConfig?.city || currentMarket}. Unsurveyed addresses are preserved as <code>PENDING_SURVEY</code> without synthetic coordinates.
            </p>
          </div>

          <button
            onClick={() => loadMapData()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors shrink-0 self-start sm:self-auto"
            title="Refresh map telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Aggregate KPI Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Customer Base</div>
              <div className="text-xl font-bold font-mono text-gray-900 mt-0.5">
                {data?.total_customers ?? (loading ? '—' : 0)}
              </div>
            </div>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">GPS Verified Drops</div>
              <div className="text-xl font-black font-mono text-emerald-800 mt-0.5">
                {data?.with_coordinates_count ?? (loading ? '—' : 0)}
                {data?.total_customers > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 ml-1.5">
                    ({Math.round((data.with_coordinates_count / data.total_customers) * 100)}%)
                  </span>
                )}
              </div>
            </div>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Survey Pending (No GPS)</div>
              <div className="text-xl font-black font-mono text-amber-800 mt-0.5">
                {data?.missing_coordinates_count ?? (loading ? '—' : 0)}
                {data?.total_customers > 0 && (
                  <span className="text-xs font-semibold text-amber-600 ml-1.5">
                    ({Math.round((data.missing_coordinates_count / data.total_customers) * 100)}%)
                  </span>
                )}
              </div>
            </div>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Map Container View */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden card-shadow p-3 space-y-3">
        <div className="flex items-center justify-between text-xs px-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Interactive Map Canvas:</span>
            <span className="text-gray-500 font-mono text-[10.5px]">
              {verifiedLocations.length} Geotagged Customers Plotted
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setViewMode('verified')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'verified' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              Verified Drops ({verifiedLocations.length})
            </button>
            <button
              onClick={() => setViewMode('pending')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              Pending Survey ({pendingLocations.length})
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-gray-200 relative">
          <MapContainer
            center={marketCenter}
            zoom={13}
            height="440px"
            markers={customerMarkers}
            showProviderSelector={true}
          />

          {/* Selected Customer Overlay Popup */}
          {selectedCustomer && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-xl z-20 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  {selectedCustomer.customer_code}
                </span>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-xs">{selectedCustomer.name}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">{selectedCustomer.address || selectedCustomer.locality}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-gray-100">
                <span className="text-gray-500">Coordinates:</span>
                <span className="font-semibold text-gray-800">
                  {selectedCustomer.latitude?.toFixed(4)}, {selectedCustomer.longitude?.toFixed(4)}
                </span>
              </div>

              {onOpen360 && (
                <button
                  onClick={() => onOpen360(selectedCustomer.id || selectedCustomer.customer_id || selectedCustomer.customer_code)}
                  className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Open Customer 360</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending Survey List (Preserving PENDING_SURVEY fidelity without fabricated GPS) */}
      {(viewMode === 'all' || viewMode === 'pending') && pendingLocations.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl overflow-hidden card-shadow">
          <div className="p-4 bg-amber-50/40 border-b border-amber-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-900">
                Addresses Awaiting Field Verification ({pendingLocations.length} Customers)
              </span>
            </div>
            <span className="text-[11px] text-amber-800 font-medium bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
              SentinelOS Geo-Fidelity Policy: Zero Fabricated GPS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase">Subscriber Code</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase">Customer Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase">Locality / Address</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase">Survey Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {pendingLocations.map((loc) => (
                  <tr key={loc.id || loc.customer_code || loc.customer_id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-gray-900">
                      {loc.customer_code}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 font-medium">
                      {loc.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {loc.address || loc.locality || 'Address line missing'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>PENDING_SURVEY</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {onOpen360 && (
                        <button
                          onClick={() => onOpen360(loc.id || loc.customer_code || loc.customer_id)}
                          className="text-blue-600 hover:underline font-semibold text-[11px] cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmMapView;
