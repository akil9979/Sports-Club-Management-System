import React, { useState, useMemo } from 'react';
import { ClipboardList, Clock, ArrowRight, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import KitchenStatusBadge from './KitchenStatusBadge.jsx';

export default function ActiveOrdersPanel({
  orders = [],
  loading = false,
  error = null,
  selectedTable = null,
  onSelectTableById,
  onUpdateKitchenStatus,
  onProceedToSettle,
  onRefresh
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filtered active orders (excluding already settled unless specified)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'open');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return activeOrders;
    return activeOrders.filter((o) => (o.kitchenStatus || 'PENDING').toUpperCase() === statusFilter);
  }, [activeOrders, statusFilter]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: activeOrders.length,
      pending: activeOrders.filter((o) => (o.kitchenStatus || 'PENDING').toUpperCase() === 'PENDING').length,
      preparing: activeOrders.filter((o) => o.kitchenStatus === 'PREPARING').length,
      ready: activeOrders.filter((o) => o.kitchenStatus === 'READY').length,
      served: activeOrders.filter((o) => o.kitchenStatus === 'SERVED').length
    };
  }, [activeOrders]);

  const getNextStatus = (current) => {
    switch ((current || 'PENDING').toUpperCase()) {
      case 'PENDING':
        return 'PREPARING';
      case 'PREPARING':
        return 'READY';
      case 'READY':
        return 'SERVED';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (current) => {
    switch ((current || 'PENDING').toUpperCase()) {
      case 'PENDING':
        return 'Send to Kitchen/Bar';
      case 'PREPARING':
        return 'Mark as Ready';
      case 'READY':
        return 'Mark as Served';
      default:
        return 'Ready to Settle';
    }
  };

  const formatElapsed = (isoDate) => {
    if (!isoDate) return 'Just now';
    return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5">
        <div className="h-6 w-48 bg-slate-800 rounded animate-skeleton mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-xl animate-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <h4 className="text-base font-semibold text-rose-200">Failed to Load Orders</h4>
        <p className="text-sm text-rose-300/80 max-w-md mx-auto mb-4">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/90 p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Active Orders & Kitchen Status
            </h3>
            <p className="text-xs text-slate-400">
              Live tracking of running tabs and order coordination
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition self-start sm:self-auto"
            title="Refresh Orders"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-800/60 scrollbar-none text-xs">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-medium transition ${
            statusFilter === 'ALL'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1 rounded-lg font-medium transition ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-amber-400/80 hover:text-amber-300'
          }`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setStatusFilter('PREPARING')}
          className={`px-3 py-1 rounded-lg font-medium transition ${
            statusFilter === 'PREPARING'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'text-sky-400/80 hover:text-sky-300'
          }`}
        >
          Preparing ({counts.preparing})
        </button>
        <button
          onClick={() => setStatusFilter('READY')}
          className={`px-3 py-1 rounded-lg font-medium transition ${
            statusFilter === 'READY'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-emerald-400/80 hover:text-emerald-300'
          }`}
        >
          Ready ({counts.ready})
        </button>
        <button
          onClick={() => setStatusFilter('SERVED')}
          className={`px-3 py-1 rounded-lg font-medium transition ${
            statusFilter === 'SERVED'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-indigo-400/80 hover:text-indigo-300'
          }`}
        >
          Served ({counts.served})
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 text-center">
          <ClipboardList className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">No Orders in this Status</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            {statusFilter === 'ALL'
              ? 'There are currently no active orders running in the bar or kitchen.'
              : `No orders are currently marked as "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
          {filteredOrders.map((order) => {
            const isOrderForSelectedTable = selectedTable && selectedTable.id === order.tableId;
            const nextStatus = getNextStatus(order.kitchenStatus);

            return (
              <div
                key={order.id}
                className={`p-4 rounded-xl border transition-all ${
                  isOrderForSelectedTable
                    ? 'border-emerald-500/60 bg-emerald-950/15 ring-1 ring-emerald-500/30'
                    : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {order.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {order.tableName}
                      </span>
                      {order.membershipTier && order.membershipTier !== 'Guest' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {order.membershipTier} ({order.discountPercentage}% Off)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{order.memberName || 'Guest Tab'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatElapsed(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <KitchenStatusBadge status={order.kitchenStatus || 'PENDING'} size="sm" />
                </div>

                {/* Items List */}
                <div className="space-y-1.5 my-3 pt-2 pb-2 border-y border-slate-800/60 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-emerald-400 w-5">
                          {item.quantity}x
                        </span>
                        <span className="truncate">{item.name}</span>
                        {item.notes && (
                          <span className="text-[10px] italic text-amber-400/90 truncate">
                            ({item.notes})
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-400 text-right ml-2 shrink-0">
                        ₹{item.unitPrice * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total & Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Running Total
                    </div>
                    <div className="font-mono font-bold text-white text-sm">
                      ₹{order.total || order.subtotal}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Advance Kitchen Status */}
                    {nextStatus ? (
                      <button
                        onClick={() => onUpdateKitchenStatus(order.id, nextStatus)}
                        className="px-2.5 py-1.5 bg-sky-600/80 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        <span>{getNextStatusLabel(order.kitchenStatus)}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onProceedToSettle && onProceedToSettle(order)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Settle Bill</span>
                      </button>
                    )}

                    {/* Quick Select Table */}
                    {onSelectTableById && (
                      <button
                        onClick={() => onSelectTableById(order.tableId)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                        title="Load into POS tab builder"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
