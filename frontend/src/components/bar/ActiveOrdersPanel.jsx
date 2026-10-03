import React, { useState, useMemo } from 'react';
import { ClipboardList, Clock, ArrowRight, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import KitchenStatusBadge from './KitchenStatusBadge.jsx';

const NEXT_STATUS = {
  PENDING: { next: 'PREPARING', label: 'Send to Kitchen' },
  PREPARING: { next: 'READY', label: 'Mark Ready' },
  READY: { next: 'SERVED', label: 'Mark Served' }
};

const FILTERS = [
  { key: 'ALL', label: 'All', color: 'bg-[#07261c] text-emerald-100 border-emerald-800/60' },
  { key: 'PENDING', label: 'Pending', color: 'bg-[#dfc99a]/20 text-[#dfc99a] border-[#dfc99a]/40' },
  { key: 'PREPARING', label: 'Preparing', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { key: 'READY', label: 'Ready', color: 'bg-emerald-600/20 text-emerald-200 border-emerald-500/40' },
  { key: 'SERVED', label: 'Served', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' }
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
      <div className="bg-[#041c14]/90 rounded-3xl border border-emerald-900/40 p-5 space-y-3">
        <div className="h-6 w-48 bg-[#07261c] rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-[#07261c]/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <h4 className="text-base font-serif font-bold text-rose-200">Failed to Load Orders</h4>
        <p className="text-sm text-rose-300/80 mb-4">{error}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm transition">
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#041c14]/90 backdrop-blur-md rounded-3xl border border-emerald-900/40 p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-900/40">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#dfc99a]" />
          <div>
            <h3 className="text-base font-serif font-bold text-[#fcfaf5] tracking-wide">Active Orders</h3>
            <p className="text-xs text-emerald-300/70">Live order coordination & kitchen tracking</p>
          </div>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="px-2.5 py-1.5 bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 rounded-xl text-xs flex items-center gap-1.5 transition">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-emerald-900/40 text-xs scrollbar-none">
        {FILTERS.map((f) => {
          const isActive = statusFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1 rounded-xl font-medium transition border ${isActive ? f.color : 'border-transparent text-emerald-400/70 hover:text-white'}`}
            >
              {f.label} ({counts[f.key] || 0})
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 border border-dashed border-emerald-900/60 rounded-2xl bg-[#02140e]/40 text-center">
          <ClipboardList className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="text-sm font-serif font-semibold text-emerald-200">No Orders in this Status</p>
          <p className="text-xs text-emerald-400/70 mt-1">There are currently no active orders matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
          {filteredOrders.map((order) => {
            const isSelected = selectedTable && selectedTable.id === order.tableId;
            const step = NEXT_STATUS[(order.kitchenStatus || 'PENDING').toUpperCase()];

            return (
              <div
                key={order.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-[#dfc99a] bg-gradient-to-br from-[#dfc99a]/10 via-[#041c14] to-[#02140e] ring-1 ring-[#dfc99a]/30'
                    : 'border-emerald-900/50 bg-[#02140e]/80 hover:border-emerald-700/60'
                }`}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-white text-sm">{order.id}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#07261c] text-emerald-300 border border-emerald-900/50">{order.tableName}</span>
                      {order.membershipTier && order.membershipTier !== 'Guest' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/30 font-mono">
                          {order.membershipTier} ({order.discountPercentage}% Off)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400/80 mt-1">
                      <span>{order.memberName || 'Guest Tab'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500/70" />
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                  </div>
                  <KitchenStatusBadge status={order.kitchenStatus || 'PENDING'} size="sm" />
                </div>

                {/* Items Summary */}
                <div className="space-y-1 my-3 py-2 border-y border-emerald-900/40 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-emerald-200">
                      <span className="truncate">
                        <span className="font-mono font-bold text-[#dfc99a] mr-2">{item.quantity}x</span>
                        {item.name}
                        {item.notes && <span className="text-[#dfc99a]/90 italic ml-1">({item.notes})</span>}
                      </span>
                      <span className="font-mono text-emerald-400/70 ml-2">₹{(item.unitPrice || 0) * (item.quantity || 1)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-[10px] text-emerald-500/70 uppercase font-semibold">Total</div>
                    <div className="font-mono font-bold text-[#dfc99a] text-sm">₹{order.total || order.subtotal}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {step ? (
                      <button
                        onClick={() => onUpdateKitchenStatus(order.id, step.next)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <span>{step.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onProceedToSettle && onProceedToSettle(order)}
                        className="px-3 py-1.5 btn-champagne rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Settle Bill</span>
                      </button>
                    )}

                    {onSelectTableById && (
                      <button
                        onClick={() => onSelectTableById(order.tableId)}
                        className="p-1.5 bg-[#07261c] hover:bg-[#0b3829] text-emerald-300 border border-emerald-800/60 rounded-xl transition"
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

