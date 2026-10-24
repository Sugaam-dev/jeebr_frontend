import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { 
  Zap, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Play, 
  Check, 
  RefreshCw, 
  History, 
  Filter, 
  Search, 
  IndianRupee, 
  Server, 
  ShieldAlert, 
  ChevronRight, 
  ChevronLeft, 
  X,
  FileText,
  User,
  Radio,
  ExternalLink,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { ServiceActivationModal } from './ServiceActivationModal';

export const ProvisioningOrdersView = ({ onOpen360 }) => {
  const { user } = useAuth();
  const { currentMarket } = useMarket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Order for Timeline Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Cancel Modal State
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Action in progress tracker (by order_code)
  const [actionLoading, setActionLoading] = useState({});

  // Activation modal for custom customer ID
  const [showNewActivationModal, setShowNewActivationModal] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const canMutate = user?.role === 'SUPER_ADMIN' || user?.role === 'Admin' || user?.role === 'NOC';
  const canCareCancel = user?.role === 'Care';
  const isReadOnly = user?.role === 'Viewer' || user?.role === 'Customer';

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProvisioningOrders(statusFilter || null, null, page, 20);
      setOrders(res.orders || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to load provisioning orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentMarket, statusFilter, page]);

  const viewOrderDetail = async (idOrCode) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getProvisioningOrderDetail(idOrCode);
      setSelectedOrder(detail);
    } catch (err) {
      alert(`Failed to load order detail: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApprove = async (orderCode) => {
    setActionLoading((prev) => ({ ...prev, [orderCode]: 'approving' }));
    try {
      await api.approveProvisioningOrder(orderCode, 'Authorized via Operations Dashboard');
      await loadOrders();
      if (selectedOrder?.order_code === orderCode) {
        viewOrderDetail(orderCode);
      }
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderCode]: null }));
    }
  };

  const handleProvision = async (orderCode) => {
    setActionLoading((prev) => ({ ...prev, [orderCode]: 'provisioning' }));
    try {
      await api.triggerProvisioning(orderCode);
      await loadOrders();
      if (selectedOrder?.order_code === orderCode) {
        viewOrderDetail(orderCode);
      }
    } catch (err) {
      alert(`Provisioning execution error: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderCode]: null }));
    }
  };

  const handleRetry = async (orderCode) => {
    setActionLoading((prev) => ({ ...prev, [orderCode]: 'retrying' }));
    try {
      await api.retryProvisioning(orderCode);
      await loadOrders();
      if (selectedOrder?.order_code === orderCode) {
        viewOrderDetail(orderCode);
      }
    } catch (err) {
      alert(`Retry error: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderCode]: null }));
    }
  };

  const handleReconcile = async (orderCode) => {
    setActionLoading((prev) => ({ ...prev, [orderCode]: 'reconciling' }));
    try {
      await api.reconcileProvisioningOrder(orderCode);
      await loadOrders();
      if (selectedOrder?.order_code === orderCode) {
        viewOrderDetail(orderCode);
      }
    } catch (err) {
      alert(`Reconciliation error: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderCode]: null }));
    }
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await api.cancelProvisioningOrder(orderToCancel.order_code, cancelReason.trim());
      setOrderToCancel(null);
      setCancelReason('');
      await loadOrders();
      if (selectedOrder?.order_code === orderToCancel.order_code) {
        viewOrderDetail(orderToCancel.order_code);
      }
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const handleLookupCustomerForNewOrder = async (e) => {
    e.preventDefault();
    if (!customerSearchInput.trim()) return;
    setSearchingCustomer(true);
    try {
      const results = await api.getCustomers(customerSearchInput.trim(), '', '', '', '');
      if (results && results.length > 0) {
        setTargetCustomer(results[0]);
        setShowNewActivationModal(true);
      } else {
        alert(`No customer found matching "${customerSearchInput}" in current market.`);
      }
    } catch (err) {
      alert(`Customer search failed: ${err.message}`);
    } finally {
      setSearchingCustomer(false);
    }
  };

  // Status Badge Rendering Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ACTIVE
          </span>
        );
      case 'PROVISIONING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1 animate-pulse">
            <RotateCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />
            PROVISIONING
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            APPROVED
          </span>
        );
      case 'REQUESTED':
      case 'VALIDATING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            {status}
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            FAILED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Filtered orders for client-side search query
  const displayOrders = orders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.order_code?.toLowerCase().includes(term) ||
      o.customer_name?.toLowerCase().includes(term) ||
      o.customer_code?.toLowerCase().includes(term) ||
      o.plan_name?.toLowerCase().includes(term) ||
      o.assigned_device_code?.toLowerCase().includes(term)
    );
  });

  // Calculate summary counts
  const countActive = orders.filter((o) => o.status === 'ACTIVE').length;
  const countPending = orders.filter((o) => ['REQUESTED', 'VALIDATING', 'APPROVED', 'PROVISIONING'].includes(o.status)).length;
  const countFailed = orders.filter((o) => o.status === 'FAILED').length;

  return (
    <div className="space-y-6">

      {/* Top Banner & Control Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Service Provisioning &amp; Automated Delivery
              <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold">
                SIMULATED PROVIDER ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-step deterministic OLT port binding, VLAN tag allocation, RADIUS subscriber profiling, and hardware telemetry synchronization.
            </p>
          </div>

          {/* New Order Trigger Bar (Customer Search) */}
          {!isReadOnly && (
            <form onSubmit={handleLookupCustomerForNewOrder} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Customer ID or name..."
                value={customerSearchInput}
                onChange={(e) => setCustomerSearchInput(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-48 font-mono"
              />
              <button
                type="submit"
                disabled={searchingCustomer || !customerSearchInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>New Activation</span>
              </button>
            </form>
          )}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Orders</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{totalCount}</div>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Active Services</div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{countActive}</div>
          </div>
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">In Pipeline</div>
            <div className="text-xl font-bold text-amber-900 mt-0.5">{countPending}</div>
          </div>
          <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100">
            <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Failed / In Retry</div>
            <div className="text-xl font-bold text-rose-900 mt-0.5">{countFailed}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search orders, subscribers, devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="REQUESTED">REQUESTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PROVISIONING">PROVISIONING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RotateCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            Loading service activation orders for {currentMarket.toUpperCase()}...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 border-b border-rose-100 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Zap className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">No Activation Orders Found</div>
            <p className="text-slate-400 max-w-sm mx-auto">
              No orders matched your filter. You can initiate a new activation request using the search bar above or the Customer 360 profile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Order Code</th>
                  <th className="px-4 py-3.5">Subscriber</th>
                  <th className="px-4 py-3.5">Tariff Plan</th>
                  <th className="px-4 py-3.5">Allocated Hardware</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Execution Mode</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayOrders.map((order) => {
                  const isCurrentAction = actionLoading[order.order_code];
                  return (
                    <tr 
                      key={order.order_code} 
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => viewOrderDetail(order.order_code)}
                    >
                      {/* Order Code */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {order.order_code}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(order.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                      </td>

                      {/* Subscriber */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {order.customer_code} · {order.account_type}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {order.locality || order.service_address}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{order.plan_name}</div>
                        <div className="text-[11px] text-blue-700 font-bold flex items-center">
                          <IndianRupee className="w-3 h-3" />
                          {order.plan_price} · {order.speed_mbps} Mbps
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          VLAN {order.service_vlan}
                        </div>
                      </td>

                      {/* Hardware */}
                      <td className="px-4 py-4 font-mono text-[11px]">
                        <div className="text-slate-800 font-semibold">
                          ONT: {order.assigned_device_code || 'Auto'}
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          OLT: {order.olt_device_code || 'Pending'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {renderStatusBadge(order.status)}
                        {order.status === 'FAILED' && order.retry_count > 0 && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-1">
                            Retries: {order.retry_count}/{order.max_retries}
                          </div>
                        )}
                      </td>

                      {/* Execution Mode */}
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-50 text-cyan-800 border border-cyan-200">
                          {order.execution_mode}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                          {order.telemetry_source}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">

                          {/* 1. Approve (Admin/NOC) when REQUESTED or VALIDATING */}
                          {canMutate && ['REQUESTED', 'VALIDATING'].includes(order.status) && (
                            <button
                              onClick={() => handleApprove(order.order_code)}
                              disabled={!!isCurrentAction}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Approve activation request"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isCurrentAction === 'approving' ? 'Approving...' : 'Approve'}</span>
                            </button>
                          )}

                          {/* 2. Provision (Admin/NOC) when APPROVED */}
                          {canMutate && order.status === 'APPROVED' && (
                            <button
                              onClick={() => handleProvision(order.order_code)}
                              disabled={!!isCurrentAction}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                              title="Trigger automated network delivery"
                            >
                              <Play className="w-3 h-3" />
                              <span>{isCurrentAction === 'provisioning' ? 'Executing...' : 'Provision'}</span>
                            </button>
                          )}

                          {/* 3. Retry (Admin/NOC) when FAILED & retry_count < max_retries */}
                          {canMutate && order.status === 'FAILED' && order.retry_count < order.max_retries && (
                            <button
                              onClick={() => handleRetry(order.order_code)}
                              disabled={!!isCurrentAction}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                              title="Retry failed activation"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>{isCurrentAction === 'retrying' ? 'Retrying...' : 'Retry'}</span>
                            </button>
                          )}

                          {/* 4. Reconcile (Admin/NOC) when ACTIVE or FAILED */}
                          {canMutate && ['ACTIVE', 'FAILED'].includes(order.status) && (
                            <button
                              onClick={() => handleReconcile(order.order_code)}
                              disabled={!!isCurrentAction}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                              title="Audit hardware status and reconcile"
                            >
                              <RefreshCw className={`w-3 h-3 ${isCurrentAction === 'reconciling' ? 'animate-spin' : ''}`} />
                            </button>
                          )}

                          {/* 5. Cancel (Admin/NOC/Care) when in cancellable states */}
                          {(canMutate || canCareCancel) && ['REQUESTED', 'VALIDATING', 'APPROVED', 'FAILED'].includes(order.status) && (
                            <button
                              onClick={() => {
                                setOrderToCancel(order);
                                setCancelReason('');
                              }}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                              title="Cancel activation order"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}

                          {/* Detail Inspector Button */}
                          <button
                            onClick={() => viewOrderDetail(order.order_code)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span> ({totalCount} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Drawer for Order Detail & Immutable Transition Logs */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-blue-300 uppercase tracking-wider">
                  Order Details &amp; Immutable Audit Trail
                </div>
                <h3 className="text-lg font-bold font-mono text-white mt-0.5">
                  {selectedOrder.order_code}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">

              {/* Status and Mode Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Current Lifecycle Status:</span>
                  {renderStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Execution Mode:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                    {selectedOrder.execution_mode}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Telemetry Source:</span>
                  <span className="text-slate-700 font-mono text-[11px]">{selectedOrder.telemetry_source}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Idempotency Key:</span>
                  <span className="text-slate-600 font-mono text-[10px] truncate max-w-xs">{selectedOrder.idempotency_key}</span>
                </div>
              </div>

              {/* Plan & Customer Details */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="font-bold text-slate-900 text-sm">{selectedOrder.customer_name}</div>
                <div className="text-slate-500 font-mono">{selectedOrder.customer_code} · {selectedOrder.account_type}</div>
                <div className="text-slate-600">{selectedOrder.service_address}</div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-blue-800 font-semibold">
                  <span>{selectedOrder.plan_name} ({selectedOrder.speed_mbps} Mbps)</span>
                  <span>₹{selectedOrder.plan_price}</span>
                </div>
              </div>

              {/* Hardware Allocations */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-mono">
                <div className="font-bold text-slate-800 font-sans text-xs uppercase tracking-wider mb-1">
                  Assigned Hardware &amp; Network Ports
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ONT / Terminal:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.assigned_device_code || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Upstream OLT:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.olt_device_code || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service VLAN:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.service_vlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RADIUS Username:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.radius_username || 'None'}</span>
                </div>
              </div>

              {/* Failure Context if applicable */}
              {selectedOrder.status === 'FAILED' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Provisioning Failure: {selectedOrder.failure_code}
                  </div>
                  <div className="text-rose-800 text-[11px]">{selectedOrder.failure_reason}</div>
                  <div className="text-rose-600 text-[10px] font-mono mt-1">
                    Retries Attempted: {selectedOrder.retry_count} / {selectedOrder.max_retries}
                  </div>
                </div>
              )}

              {/* Immutable Transition Logs Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Immutable Transition History ({selectedOrder.logs?.length || 0})</span>
                </div>

                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedOrder.logs && selectedOrder.logs.length > 0 ? (
                    selectedOrder.logs.map((log) => (
                      <div key={log.id} className="relative text-xs space-y-1">
                        {/* Dot indicator */}
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                        
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono font-semibold">
                            {log.from_status || 'INIT'} → {log.to_status}
                          </span>
                          <span className="text-slate-400">by</span>
                          <span className="font-mono text-[10px] text-slate-700">
                            {log.actor_email} ({log.actor_role})
                          </span>
                        </div>

                        {log.details && (
                          <div className="text-[11px] text-slate-600 p-2 bg-slate-50 rounded-xl border border-slate-100 font-mono">
                            {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">No transition records logged yet.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {onOpen360 && (
                <button
                  onClick={() => {
                    onOpen360(selectedOrder.customer_id);
                    setSelectedOrder(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Customer 360</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                {canMutate && selectedOrder.status === 'APPROVED' && (
                  <button
                    onClick={() => handleProvision(selectedOrder.order_code)}
                    disabled={!!actionLoading[selectedOrder.order_code]}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Execute Provisioning</span>
                  </button>
                )}
                {canMutate && selectedOrder.status === 'FAILED' && selectedOrder.retry_count < selectedOrder.max_retries && (
                  <button
                    onClick={() => handleRetry(selectedOrder.order_code)}
                    disabled={!!actionLoading[selectedOrder.order_code]}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry Activation</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                Cancel Activation Order
              </h3>
              <button onClick={() => setOrderToCancel(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide a mandatory reason for cancelling order <span className="font-mono font-bold">{orderToCancel.order_code}</span> ({orderToCancel.customer_name}). This action will be immutably recorded in the audit trail.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Subscriber requested plan change, customer cancellation, address verification failed..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-sans"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling || !cancelReason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone New Activation Modal */}
      {showNewActivationModal && targetCustomer && (
        <ServiceActivationModal
          customer={targetCustomer}
          onClose={() => {
            setShowNewActivationModal(false);
            setTargetCustomer(null);
          }}
          onSuccess={() => {
            loadOrders();
          }}
        />
      )}

    </div>
  );
};
