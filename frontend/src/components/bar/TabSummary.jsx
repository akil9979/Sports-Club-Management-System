import React, { useMemo } from 'react';
import {
  Receipt,
  Trash2,
  Plus,
  Minus,
  Send,
  CreditCard,
  Crown,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import KitchenStatusBadge from './KitchenStatusBadge.jsx';

export default function TabSummary({
  selectedTable = null,
  activeOrder = null,
  draftItems = [],
  memberTier = 'Guest',
  onUpdateMemberTier,
  onUpdateDraftItemQty,
  onRemoveDraftItem,
  onClearDraft,
  onSendOrderToKitchen,
  onOpenSettlement,
  isSendingOrder = false
}) {
  // Member discount percentages
  const discountRate = useMemo(() => {
    switch (memberTier) {
      case 'Gold':
        return 0.15; // 15% discount for Gold Champions
      case 'Silver':
        return 0.10; // 10% discount for Silver
      case 'Junior':
        return 0.10; // 10% discount for Junior
      default:
        return 0.0;
    }
  }, [memberTier]);

  // Combined active order items + draft items
  const allItems = useMemo(() => {
    const existing = (activeOrder?.items || []).map((it) => ({
      ...it,
      isExisting: true
    }));
    const drafts = draftItems.map((it) => ({
      ...it,
      isExisting: false
    }));
    return [...existing, ...drafts];
  }, [activeOrder, draftItems]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return allItems.reduce((acc, it) => acc + (it.unitPrice || it.price || 0) * it.quantity, 0);
  }, [allItems]);

  const discountAmount = useMemo(() => {
    return Math.round(subtotal * discountRate);
  }, [subtotal, discountRate]);

  const discountedSubtotal = subtotal - discountAmount;
  const tax = useMemo(() => {
    return Math.round(discountedSubtotal * 0.05); // 5% GST/Service Tax
  }, [discountedSubtotal]);

  const total = discountedSubtotal + tax;

  const hasItems = allItems.length > 0;
  const hasDraftItems = draftItems.length > 0;
  const isSettled = activeOrder && activeOrder.status === 'settled';

  if (!selectedTable) {
    return (
      <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/90 p-5 shadow-xl flex flex-col items-center justify-center text-center h-full min-h-[420px]">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-3 border border-slate-700/50">
          <Receipt className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">No Table Selected</h4>
        <p className="text-xs text-slate-400 max-w-xs mb-4">
          Please select a table from the table grid to create a tab, add items, or process payment settlement.
        </p>
        <span className="text-[11px] text-amber-400/90 font-mono bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          Validation: Selected Table Required
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/90 p-5 shadow-xl flex flex-col h-full">
      {/* Tab Header */}
      <div className="pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>{selectedTable.name}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                  #{selectedTable.number}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {selectedTable.section} • Capacity {selectedTable.capacity} guests
              </p>
            </div>
          </div>

          {/* Table status badge */}
          {isSettled ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Settled Tab
            </span>
          ) : activeOrder ? (
            <KitchenStatusBadge status={activeOrder.kitchenStatus || 'PENDING'} size="sm" />
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              New Tab
            </span>
          )}
        </div>

        {/* Member Tier Selector & Discount Badge */}
        {!isSettled && (
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Membership:</span>
            </div>

            <div className="flex items-center gap-1">
              {['Guest', 'Junior', 'Silver', 'Gold'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => onUpdateMemberTier(tier)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    memberTier === tier
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {tier}
                  {tier === 'Gold' ? ' (15%)' : tier === 'Silver' || tier === 'Junior' ? ' (10%)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Already Settled Order Alert */}
      {isSettled && (
        <div className="my-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200">This order is already settled and closed.</p>
            <p className="text-[11px] text-emerald-400/80 mt-0.5">
              Settled at {activeOrder.settledAt ? new Date(activeOrder.settledAt).toLocaleTimeString() : 'Recently'} via {activeOrder.paymentMethod || 'card'}. Re-settlement is disabled.
            </p>
          </div>
        </div>
      )}

      {/* Itemized Order List */}
      <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2 max-h-[320px]">
        {!hasItems ? (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800/80 rounded-xl">
            No items in tab. Select items from the menu to build order.
          </div>
        ) : (
          allItems.map((item, idx) => {
            const unitPrice = item.unitPrice || item.price || 0;
            const lineTotal = unitPrice * item.quantity;

            return (
              <div
                key={`${item.itemId || item.id}-${idx}`}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                  item.isExisting
                    ? 'bg-slate-950/40 border-slate-800/80'
                    : 'bg-emerald-950/20 border-emerald-500/30'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white truncate">
                      {item.name}
                    </span>
                    {!item.isExisting && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-bold">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    ₹{unitPrice} each
                    {item.notes && <span className="ml-1 text-amber-400">({item.notes})</span>}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  {!item.isExisting && !isSettled ? (
                    <div className="flex items-center border border-slate-800 rounded bg-slate-900">
                      <button
                        onClick={() => onUpdateDraftItemQty(item.id, -1)}
                        className="px-1.5 py-0.5 text-slate-400 hover:text-white"
                        title="Decrease"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="px-1.5 font-mono font-bold text-white text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateDraftItemQty(item.id, 1)}
                        className="px-1.5 py-0.5 text-slate-400 hover:text-white"
                        title="Increase"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-slate-300 px-2 py-0.5 bg-slate-800 rounded text-xs">
                      {item.quantity}x
                    </span>
                  )}

                  <span className="font-mono font-bold text-white text-right min-w-[55px]">
                    ₹{lineTotal}
                  </span>

                  {!item.isExisting && !isSettled && onRemoveDraftItem && (
                    <button
                      onClick={() => onRemoveDraftItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Breakdown */}
      <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="font-mono text-slate-200">₹{subtotal}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-400 font-medium">
            <span>Member Discount ({memberTier} - {Math.round(discountRate * 100)}%)</span>
            <span className="font-mono">-₹{discountAmount}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-400">
          <span>Club Tax & GST (5%)</span>
          <span className="font-mono text-slate-200">₹{tax}</span>
        </div>

        <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-slate-800/80">
          <span>Total Payable</span>
          <span className="font-mono text-emerald-400 text-lg">₹{total}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-2 space-y-2">
        {/* Send Draft to Kitchen */}
        {hasDraftItems && !isSettled && (
          <button
            onClick={onSendOrderToKitchen}
            disabled={isSendingOrder}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition active:scale-98 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingOrder ? 'Sending to Kitchen...' : `Send Draft (${draftItems.length} items) to Kitchen`}</span>
          </button>
        )}

        {/* Settle Bill Button */}
        <button
          onClick={() => onOpenSettlement({ subtotal, discountAmount, tax, total, memberTier })}
          disabled={!hasItems || isSettled || subtotal <= 0}
          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg ${
            !hasItems || isSettled || subtotal <= 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-98'
          }`}
          title={
            isSettled
              ? 'Already settled order'
              : !hasItems
              ? 'Do not settle without valid order'
              : 'Proceed to Payment & Settlement'
          }
        >
          <CreditCard className="w-4 h-4" />
          <span>
            {isSettled
              ? 'Tab Already Settled'
              : !hasItems
              ? 'No Valid Order to Settle'
              : `Settle Bill • ₹${total}`}
          </span>
        </button>

        {/* Clear Draft Option */}
        {hasDraftItems && (
          <button
            onClick={onClearDraft}
            className="w-full py-1.5 text-[11px] text-slate-400 hover:text-rose-400 flex items-center justify-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Discard Draft Items</span>
          </button>
        )}
      </div>
    </div>
  );
}
