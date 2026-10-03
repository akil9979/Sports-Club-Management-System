import React, { useState, useMemo } from 'react';
import { ClipboardList, Clock, ArrowRight, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import KitchenStatusBadge from './KitchenStatusBadge.jsx';

const NEXT_STATUS = {
  PENDING: { next: 'PREPARING', label: 'Send to Kitchen' },
  PREPARING: { next: 'READY', label: 'Mark Ready' },
  READY: { next: 'SERVED', label: 'Mark Served' }
};

const FILTERS = [
  { key: 'ALL', label: 'All', color: 'bg-slate-800 text-white border-slate-700' },
  { key: 'PENDING', label: 'Pending', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { key: 'PREPARING', label: 'Preparing', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  { key: 'READY', label: 'Ready', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { key: 'SERVED', label: 'Served', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' }
];

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

  const activeOrders = useMemo(() => orders.filter((o) => o.status === 'open'), [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return activeOrders;
    return activeOrders.filter((o) => (o.kitchenStatus || 'PENDING').toUpperCase() === statusFilter);
  }, [activeOrders, statusFilter]);

  const counts = useMemo(() => ({
    ALL: activeOrders.length,
    PENDING: activeOrders.filter((o) => (o.kitchenStatus || 'PENDING').toUpperCase() === 'PENDING').length,
    PREPARING: activeOrders.filter((o) => o.kitchenStatus === 'PREPARING').length,
    READY: activeOrders.filter((o) => o.kitchenStatus === 'READY').length,
    SERVED: activeOrders.filter((o) => o.kitchenStatus === 'SERVED').length
  }), [activeOrders]);

  if (loading) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3">
        <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <h4 className="text-base font-semibold text-rose-200">Failed to Load Orders</h4>
        <p className="text-sm text-rose-300/80 mb-4">{error}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm transition">
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/90 p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Active Orders</h3>
            <p className="text-xs text-slate-400">Live order coordination & kitchen tracking</p>
          </div>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-800/60 text-xs scrollbar-none">
        {FILTERS.map((f) => {
          const isActive = statusFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1 rounded-lg font-medium transition border ${isActive ? f.color : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              {f.label} ({counts[f.key] || 0})
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 text-center">
          <ClipboardList className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">No Orders in this Status</p>
          <p className="text-xs text-slate-500 mt-1">There are currently no active orders matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
          {filteredOrders.map((order) => {
            const isSelected = selectedTable && selectedTable.id === order.tableId;
            const step = NEXT_STATUS[(order.kitchenStatus || 'PENDING').toUpperCase()];

            return (
              <div
                key={order.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected ? 'border-emerald-500/60 bg-emerald-950/15 ring-1 ring-emerald-500/30' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-white text-sm">{order.id}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">{order.tableName}</span>
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
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                  </div>
                  <KitchenStatusBadge status={order.kitchenStatus || 'PENDING'} size="sm" />
                </div>

                {/* Items Summary */}
                <div className="space-y-1 my-3 py-2 border-y border-slate-800/60 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <span className="truncate">
                        <span className="font-mono font-bold text-emerald-400 mr-2">{item.quantity}x</span>
                        {item.name}
                        {item.notes && <span className="text-amber-400/90 italic ml-1">({item.notes})</span>}
                      </span>
                      <span className="font-mono text-slate-400 ml-2">₹{(item.unitPrice || 0) * (item.quantity || 1)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Total</div>
                    <div className="font-mono font-bold text-white text-sm">₹{order.total || order.subtotal}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {step ? (
                      <button
                        onClick={() => onUpdateKitchenStatus(order.id, step.next)}
                        className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <span>{step.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onProceedToSettle && onProceedToSettle(order)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Settle Bill</span>
                      </button>
                    )}

                    {onSelectTableById && (
                      <button
                        onClick={() => onSelectTableById(order.tableId)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Load into POS builder"
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
