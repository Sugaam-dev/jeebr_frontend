import React, { useState, useEffect } from 'react';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import {
  Boxes,
  Package,
  ArrowRightLeft,
  RotateCcw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  RefreshCw,
  Cpu,
  Layers,
  Wrench,
  X
} from 'lucide-react';

export const InventoryManagement = () => {
  const { currentMarket } = useMarket();
  const { user } = useAuth();

  // Active Tab: 'stocks' | 'devices' | 'catalogs' | 'movements'
  const [activeTab, setActiveTab] = useState('stocks');

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Data states
  const [stats, setStats] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [devices, setDevices] = useState([]);
  const [movements, setMovements] = useState([]);

  // Filters & search
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('');

  // Modals state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  // Form states
  const [receiptForm, setReceiptForm] = useState({
    warehouse_id: '',
    catalog_id: '',
    quantity: 1,
    serial_numbers_text: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    catalog_id: '',
    quantity: 1,
    serial_numbers_text: '',
    notes: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    warehouse_id: '',
    catalog_id: '',
    quantity_delta: 0,
    notes: ''
  });

  const [returnForm, setReturnForm] = useState({
    serial_number: '',
    warehouse_id: '',
    condition: 'WORKING',
    notes: ''
  });

  const [replaceForm, setReplaceForm] = useState({
    old_serial_number: '',
    new_serial_number: '',
    ticket_id: '',
    notes: ''
  });

  // Fetch all domain data
  const fetchData = async () => {
    try {
      setErrorMsg('');
      const [
        statsData,
        whData,
        catData,
        stockData,
        devData,
        movData
      ] = await Promise.all([
        api.getInventoryStats().catch(() => null),
        api.getInventoryWarehouses({ market: currentMarket }).catch(() => []),
        api.getInventoryCatalogs().catch(() => []),
        api.getInventoryStocks().catch(() => []),
        api.getInventoryDevices({ limit: 150 }).catch(() => []),
        api.getInventoryMovements({ limit: 100 }).catch(() => [])
      ]);

      setStats(statsData);
      setWarehouses(whData || []);
      setCatalogs(catData || []);
      setStocks(stockData || []);
      setDevices(devData || []);
      setMovements(movData || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      setErrorMsg(err.message || 'Failed to load inventory management data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMarket]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // Submit Handlers
  const handleReceiveStock = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const serials = receiptForm.serial_numbers_text
        ? receiptForm.serial_numbers_text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
        : null;

      await api.receiveInventoryStock({
        warehouse_id: parseInt(receiptForm.warehouse_id),
        catalog_id: parseInt(receiptForm.catalog_id),
        quantity: parseInt(receiptForm.quantity),
        serial_numbers: serials,
        notes: receiptForm.notes || undefined
      });

      setSuccessMsg('Stock receipt processed and serial devices registered successfully!');
      setShowReceiptModal(false);
      setReceiptForm({ warehouse_id: '', catalog_id: '', quantity: 1, serial_numbers_text: '', notes: '' });
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process stock receipt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferStock = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const serials = transferForm.serial_numbers_text
        ? transferForm.serial_numbers_text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
        : null;

      await api.transferInventoryStock({
        from_warehouse_id: parseInt(transferForm.from_warehouse_id),
        to_warehouse_id: parseInt(transferForm.to_warehouse_id),
        catalog_id: parseInt(transferForm.catalog_id),
        quantity: parseInt(transferForm.quantity),
        serial_numbers: serials,
        notes: transferForm.notes || undefined
      });

      setSuccessMsg('Stock transfer completed successfully!');
      setShowTransferModal(false);
      setTransferForm({ from_warehouse_id: '', to_warehouse_id: '', catalog_id: '', quantity: 1, serial_numbers_text: '', notes: '' });
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process stock transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.adjustInventoryStock({
        warehouse_id: parseInt(adjustForm.warehouse_id),
        catalog_id: parseInt(adjustForm.catalog_id),
        quantity_delta: parseInt(adjustForm.quantity_delta),
        notes: adjustForm.notes
      });

      setSuccessMsg('Stock balance adjustment applied successfully!');
      setShowAdjustModal(false);
      setAdjustForm({ warehouse_id: '', catalog_id: '', quantity_delta: 0, notes: '' });
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to apply stock adjustment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnDevice = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.returnInventoryDevice({
        serial_number: returnForm.serial_number.trim(),
        warehouse_id: parseInt(returnForm.warehouse_id),
        condition: returnForm.condition,
        notes: returnForm.notes || undefined
      });

      setSuccessMsg(`Device ${returnForm.serial_number} return processed successfully!`);
      setShowReturnModal(false);
      setReturnForm({ serial_number: '', warehouse_id: '', condition: 'WORKING', notes: '' });
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process return');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceDevice = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.replaceInventoryDevice({
        old_serial_number: replaceForm.old_serial_number.trim(),
        new_serial_number: replaceForm.new_serial_number.trim(),
        ticket_id: replaceForm.ticket_id ? parseInt(replaceForm.ticket_id) : undefined,
        notes: replaceForm.notes || undefined
      });

      setSuccessMsg(`Device replacement executed: ${replaceForm.old_serial_number} replaced by ${replaceForm.new_serial_number}!`);
      setShowReplaceModal(false);
      setReplaceForm({ old_serial_number: '', new_serial_number: '', ticket_id: '', notes: '' });
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process replacement');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered devices
  const filteredDevices = devices.filter(d => {
    const matchesSearch = !deviceSearch ||
      d.serial_number?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.mac_address?.toLowerCase().includes(deviceSearch.toLowerCase());
    const matchesStatus = !deviceStatusFilter || d.status === deviceStatusFilter;
    const matchesWh = !selectedWarehouseFilter || d.warehouse_id === parseInt(selectedWarehouseFilter);
    return matchesSearch && matchesStatus && matchesWh;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Loading Carrier Inventory & Asset Management...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Operations', path: '/dashboard/cockpit' },
              { label: 'Inventory & Assets', active: true }
            ]}
          />
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 mt-1">
            <Boxes className="w-7 h-7 text-blue-500" />
            Carrier Inventory & Asset Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative tracking of regional depots, equipment SKUs, serialized ONTs/routers, and provisioning reservation lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowReceiptModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Receive Stock
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            Transfer
          </button>
          <button
            onClick={() => setShowReturnModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Return / RMA
          </button>
          <button
            onClick={() => setShowReplaceModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            Replace
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-200 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4 hover:text-white" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center justify-between p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4 hover:text-white" /></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Hardware</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_devices ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Tracked units across markets</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">In Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats?.devices_in_stock ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Available in depots</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Installed</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{stats?.devices_installed ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active subscriber ONTs</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Reserved</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats?.devices_reserved ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Pending order activation</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Damaged / RMA</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{stats?.devices_damaged ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Quarantine / repair</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Low Stock Items</span>
            <Layers className="w-4 h-4 text-orange-400" />
          </div>
          <div className={`text-2xl font-bold ${(stats?.low_stock_items_count ?? 0) > 0 ? 'text-orange-400' : 'text-slate-300'}`}>
            {stats?.low_stock_items_count ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Below threshold depot items</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'stocks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Warehouse Stock Balances ({stocks.length})
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'devices'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Serialized Devices ({devices.length})
        </button>

        <button
          onClick={() => setActiveTab('catalogs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'catalogs'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Equipment Catalog ({catalogs.length})
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'movements'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Stock Movement Ledger ({movements.length})
        </button>
      </div>

      {/* TAB 1: Warehouse Stock Balances */}
      {activeTab === 'stocks' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Regional Warehouse Stock Aggregates</h2>
              <p className="text-xs text-slate-400">Current on-hand inventory balances, allocation reservations, and re-order thresholds.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdjustModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700"
              >
                Manual Adjustment
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">SKU / Model</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">On Hand</th>
                  <th className="py-3 px-4 text-right">Reserved</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4 text-right">Min Threshold</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stocks.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">
                      No inventory records found in current market.
                    </td>
                  </tr>
                ) : (
                  stocks.map(st => {
                    const isLow = st.quantity_on_hand <= st.min_threshold;
                    return (
                      <tr key={st.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{st.warehouse?.name || `WH #${st.warehouse_id}`}</div>
                          <div className="text-[10px] text-slate-500">{st.warehouse?.warehouse_code} · {st.warehouse?.market_id?.toUpperCase()}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{st.catalog?.name || `Catalog #${st.catalog_id}`}</div>
                          <div className="text-[10px] text-slate-400">{st.catalog?.sku} · {st.catalog?.manufacturer}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {st.catalog?.equipment_type || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-100">{st.quantity_on_hand}</td>
                        <td className="py-3 px-4 text-right text-amber-400 font-semibold">{st.quantity_reserved}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">{st.quantity_available}</td>
                        <td className="py-3 px-4 text-right text-slate-400">{st.min_threshold}</td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/60 inline-flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> LOW STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> OPTIMAL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setReceiptForm(prev => ({ ...prev, warehouse_id: st.warehouse_id, catalog_id: st.catalog_id }));
                              setShowReceiptModal(true);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium border border-slate-700 mr-1.5"
                          >
                            + Add Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Serialized Devices */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Serial Number (e.g. HWTC-...) or MAC address..."
                value={deviceSearch}
                onChange={e => setDeviceSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={deviceStatusFilter}
                onChange={e => setDeviceStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="IN_STOCK">IN_STOCK</option>
                <option value="RESERVED">RESERVED</option>
                <option value="INSTALLED">INSTALLED</option>
                <option value="RETURNED">RETURNED</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>

              <select
                value={selectedWarehouseFilter}
                onChange={e => setSelectedWarehouseFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Depots</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Devices Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">MAC Address</th>
                    <th className="py-3 px-4">Model & Catalog</th>
                    <th className="py-3 px-4">Location / Depot</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Assignment / Customer</th>
                    <th className="py-3 px-4">Installed / Warranty</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-500">
                        No serialized devices match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map(d => {
                      const statusStyles = {
                        IN_STOCK: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
                        RESERVED: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
                        INSTALLED: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
                        RETURNED: 'bg-slate-800 text-slate-300 border-slate-700',
                        DAMAGED: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
                      };
                      return (
                        <tr key={d.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono font-bold text-white">{d.serial_number}</td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{d.mac_address || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-200">{d.catalog?.name || `Catalog #${d.catalog_id}`}</div>
                            <div className="text-[10px] text-slate-400">{d.catalog?.sku} · {d.catalog?.model}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-300">{d.warehouse?.name || '—'}</div>
                            <div className="text-[10px] text-slate-500">{d.market_id?.toUpperCase()}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${statusStyles[d.status] || 'bg-slate-800 text-slate-400'}`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {d.assigned_customer_id ? (
                              <div>
                                <span className="text-slate-200 font-medium">Customer #{d.assigned_customer_id}</span>
                                {d.assigned_order_id && <div className="text-[10px] text-slate-500">Order #{d.assigned_order_id}</div>}
                              </div>
                            ) : d.assigned_order_id ? (
                              <span className="text-amber-400 font-medium">Order #{d.assigned_order_id} (Reserved)</span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400">
                            {d.installed_at ? new Date(d.installed_at).toLocaleDateString() : 'Uninstalled'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {d.status === 'INSTALLED' && (
                              <button
                                onClick={() => {
                                  setReturnForm(prev => ({ ...prev, serial_number: d.serial_number, warehouse_id: d.warehouse_id || warehouses[0]?.id || '' }));
                                  setShowReturnModal(true);
                                }}
                                className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded text-[11px] border border-amber-800/80"
                              >
                                Return
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Equipment Catalog */}
      {activeTab === 'catalogs' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Equipment & Hardware Master Catalog</h2>
              <p className="text-xs text-slate-400">Standard equipment models, manufacturers, technical specs, and serial tracking requirements.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Vendor & Model</th>
                  <th className="py-3 px-4 text-center">Serialized</th>
                  <th className="py-3 px-4 text-right">Unit Cost (INR)</th>
                  <th className="py-3 px-4 text-center">Warranty</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {catalogs.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{c.sku}</td>
                    <td className="py-3 px-4 font-semibold text-white">{c.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {c.equipment_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.manufacturer} · {c.model}</td>
                    <td className="py-3 px-4 text-center">
                      {c.is_serialized ? (
                        <span className="text-emerald-400 font-semibold text-[11px]">Yes (SN/MAC)</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No (Bulk)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-200">
                      ₹{parseFloat(c.unit_cost_inr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">{c.warranty_months} mos</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Movement Ledger */}
      {activeTab === 'movements' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Authoritative Stock Movement Audit Ledger</h2>
            <p className="text-xs text-slate-400">Immutable ledger recording every receipt, transfer, reservation, release, consumption, and RMA action.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Movement ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Catalog / SKU</th>
                  <th className="py-3 px-4">From Depot</th>
                  <th className="py-3 px-4">To Depot</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">
                      No stock movement audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map(m => {
                    const typeColors = {
                      RECEIPT: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
                      TRANSFER: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60',
                      RESERVATION: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
                      RELEASE: 'bg-slate-800 text-slate-300 border-slate-700',
                      CONSUMPTION: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
                      RETURN: 'bg-teal-950/80 text-teal-400 border-teal-800/60',
                      REPLACEMENT: 'bg-purple-950/80 text-purple-400 border-purple-800/60',
                      ADJUSTMENT: 'bg-orange-950/80 text-orange-400 border-orange-800/60',
                    };
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-white">{m.movement_code}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeColors[m.movement_type] || 'bg-slate-800 text-slate-400'}`}>
                            {m.movement_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{m.catalog?.sku || `Cat #${m.catalog_id}`}</td>
                        <td className="py-3 px-4 text-slate-400">{m.from_warehouse_id ? `WH #${m.from_warehouse_id}` : '—'}</td>
                        <td className="py-3 px-4 text-slate-400">{m.to_warehouse_id ? `WH #${m.to_warehouse_id}` : '—'}</td>
                        <td className="py-3 px-4 text-right font-bold text-white">{m.quantity}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-400">{m.reference_type} {m.reference_id && `(${m.reference_id})`}</td>
                        <td className="py-3 px-4 text-slate-300">{m.actor_name || 'System'}</td>
                        <td className="py-3 px-4 text-right text-[11px] text-slate-400">
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Receive Stock */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Receive New Equipment Stock
              </h3>
              <button onClick={() => setShowReceiptModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>

            <form onSubmit={handleReceiveStock} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Depot / Warehouse *</label>
                <select
                  required
                  value={receiptForm.warehouse_id}
                  onChange={e => setReceiptForm({ ...receiptForm, warehouse_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.warehouse_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Equipment Catalog / Model *</label>
                <select
                  required
                  value={receiptForm.catalog_id}
                  onChange={e => setReceiptForm({ ...receiptForm, catalog_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Product Catalog...</option>
                  {catalogs.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Received Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={receiptForm.quantity}
                  onChange={e => setReceiptForm({ ...receiptForm, quantity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Serial Numbers (One per line or comma-separated if serialized)
                </label>
                <textarea
                  rows="3"
                  placeholder="HWTC-MUM-1007&#10;HWTC-MUM-1008"
                  value={receiptForm.serial_numbers_text}
                  onChange={e => setReceiptForm({ ...receiptForm, serial_numbers_text: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Receipt Notes / PO Reference</label>
                <input
                  type="text"
                  placeholder="PO-2026-OCT-004 supplier batch receipt"
                  value={receiptForm.notes}
                  onChange={e => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Transfer Stock */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                Inter-Depot Stock Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>

            <form onSubmit={handleTransferStock} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Depot *</label>
                  <select
                    required
                    value={transferForm.from_warehouse_id}
                    onChange={e => setTransferForm({ ...transferForm, from_warehouse_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">Select Origin...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Destination Depot *</label>
                  <select
                    required
                    value={transferForm.to_warehouse_id}
                    onChange={e => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">Select Destination...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Product Catalog *</label>
                <select
                  required
                  value={transferForm.catalog_id}
                  onChange={e => setTransferForm({ ...transferForm, catalog_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Product...</option>
                  {catalogs.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferForm.quantity}
                  onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Serial Numbers to Transfer (If serialized)
                </label>
                <textarea
                  rows="2"
                  placeholder="HWTC-MUM-1001&#10;HWTC-MUM-1002"
                  value={transferForm.serial_numbers_text}
                  onChange={e => setTransferForm({ ...transferForm, serial_numbers_text: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason / Transit Notes</label>
                <input
                  type="text"
                  placeholder="Routine regional re-balancing"
                  value={transferForm.notes}
                  onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  {actionLoading ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Device Return / RMA */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                Process Hardware Return / RMA
              </h3>
              <button onClick={() => setShowReturnModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>

            <form onSubmit={handleReturnDevice} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Returning Device Serial Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HWTC-MUM-1001"
                  value={returnForm.serial_number}
                  onChange={e => setReturnForm({ ...returnForm, serial_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Receiving Depot *</label>
                <select
                  required
                  value={returnForm.warehouse_id}
                  onChange={e => setReturnForm({ ...returnForm, warehouse_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Depot...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Device Physical Condition *</label>
                <select
                  value={returnForm.condition}
                  onChange={e => setReturnForm({ ...returnForm, condition: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="WORKING">WORKING (Restock to available on-hand)</option>
                  <option value="DAMAGED">DAMAGED (Move to quarantine / warranty claim)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">RMA Reason / Inspection Notes</label>
                <input
                  type="text"
                  placeholder="Customer disconnected service / power surge damage"
                  value={returnForm.notes}
                  onChange={e => setReturnForm({ ...returnForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                >
                  {actionLoading ? 'Processing...' : 'Process Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Device Replacement */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-400" />
                Customer Device Replacement
              </h3>
              <button onClick={() => setShowReplaceModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>

            <form onSubmit={handleReplaceDevice} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Old Faulty Serial Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HWTC-MUM-1001"
                  value={replaceForm.old_serial_number}
                  onChange={e => setReplaceForm({ ...replaceForm, old_serial_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New In-Stock Serial Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HWTC-MUM-1002"
                  value={replaceForm.new_serial_number}
                  onChange={e => setReplaceForm({ ...replaceForm, new_serial_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Support Ticket ID (Optional)</label>
                <input
                  type="number"
                  placeholder="1042"
                  value={replaceForm.ticket_id}
                  onChange={e => setReplaceForm({ ...replaceForm, ticket_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Replacement Reason / Notes</label>
                <input
                  type="text"
                  placeholder="LOS red light / optical Rx hardware failure"
                  value={replaceForm.notes}
                  onChange={e => setReplaceForm({ ...replaceForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  {actionLoading ? 'Replacing...' : 'Execute Replacement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Stock Adjustment */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-400" />
                Manual Stock Adjustment
              </h3>
              <button onClick={() => setShowAdjustModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Depot / Warehouse *</label>
                <select
                  required
                  value={adjustForm.warehouse_id}
                  onChange={e => setAdjustForm({ ...adjustForm, warehouse_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Equipment Catalog *</label>
                <select
                  required
                  value={adjustForm.catalog_id}
                  onChange={e => setAdjustForm({ ...adjustForm, catalog_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Product...</option>
                  {catalogs.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quantity Delta (Positive or Negative) *</label>
                <input
                  type="number"
                  required
                  value={adjustForm.quantity_delta}
                  onChange={e => setAdjustForm({ ...adjustForm, quantity_delta: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Audit Justification Note *</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Discrepancy identified during quarterly cycle count"
                  value={adjustForm.notes}
                  onChange={e => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold"
                >
                  {actionLoading ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
