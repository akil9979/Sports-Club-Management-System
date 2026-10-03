import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Trash2,
  Plus,
  Minus,
  Send,
  CreditCard,
  Crown,
  RotateCcw,
  CheckCircle,
  Search,
  UserCheck,
  XCircle
} from 'lucide-react';
import KitchenStatusBadge from './KitchenStatusBadge.jsx';
import { lookupMember } from '../../features/bar/barApi.js';

export default function TabSummary({
  selectedTable = null,
  activeOrder = null,
  draftItems = [],
  memberTier = 'Guest',
  memberName = '',
  memberId = '',
  onUpdateMemberTier,
  onUpdateMemberInfo,
  onUpdateDraftItemQty,
  onUpdateExistingItemQty,
  onRemoveDraftItem,
  onClearDraft,
  onSendOrderToKitchen,
  onOpenSettlement,
  isSendingOrder = false
}) {
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [memberError, setMemberError] = useState(null);
  const [memberSuccess, setMemberSuccess] = useState(null);
  const [isSearchingMember, setIsSearchingMember] = useState(false);

  // Status checks
  const isSettled = activeOrder && activeOrder.status === 'settled';

  // Member discount rate from server or verified tier
  const discountRate = useMemo(() => {
    if (activeOrder && activeOrder.discountPercentage !== undefined) {
      return activeOrder.discountPercentage / 100;
    }
    switch (memberTier) {
      case 'Gold':
        return 0.15;
      case 'Silver':
        return 0.10;
      case 'Junior':
        return 0.10;
      default:
        return 0.0;
    }
  }, [memberTier, activeOrder]);

  // Combined line items: existing from server + local uncommitted drafts
  const existingItems = useMemo(() => {
    return (activeOrder?.items || []).map((it) => ({
      ...it,
      isExisting: true
    }));
  }, [activeOrder]);

  const uncommittedDrafts = useMemo(() => {
    return draftItems.map((it) => ({
      ...it,
      isExisting: false
    }));
  }, [draftItems]);

  const allItems = useMemo(() => {
    return [...existingItems, ...uncommittedDrafts];
  }, [existingItems, uncommittedDrafts]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return allItems.reduce(
      (acc, it) => acc + (it.unitPrice || it.price || 0) * (it.quantity || 1),
      0
    );
  }, [allItems]);

  // Backend-calculated discount or fallback calculation
  const discountAmount = useMemo(() => {
    if (activeOrder && activeOrder.discountAmount !== undefined && uncommittedDrafts.length === 0) {
      return activeOrder.discountAmount;
    }
    return Math.round(subtotal * discountRate);
  }, [subtotal, discountRate, activeOrder, uncommittedDrafts]);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = useMemo(() => {
    return Math.round(discountedSubtotal * 0.05); // 5% GST / Club tax
  }, [discountedSubtotal]);

  const total = discountedSubtotal + tax;

  const hasItems = allItems.length > 0;
  const hasDraftItems = draftItems.length > 0;

  // Handle member lookup
  const handleLookupMember = async (e) => {
    e?.preventDefault();
    if (!memberSearchInput.trim()) return;

    setIsSearchingMember(true);
    setMemberError(null);
    setMemberSuccess(null);

    const result = await lookupMember(memberSearchInput);
    setIsSearchingMember(false);

    if (result.valid) {
      setMemberSuccess(`Verified: ${result.member.name} (${result.member.tier} - ${result.member.discountPct}% Discount)`);
      if (onUpdateMemberInfo) {
        onUpdateMemberInfo({
          id: result.member.id,
          name: result.member.name,
          tier: result.member.tier
        });
      }
      onUpdateMemberTier(result.member.tier);
    } else {
      setMemberError(result.error);
      // Fallback to guest rates
      onUpdateMemberTier('Guest');
      if (onUpdateMemberInfo) {
        onUpdateMemberInfo({ id: null, name: 'Walk-in Guest', tier: 'Guest' });
      }
    }
  };

  if (!selectedTable) {
    return (
      <div className="bg-[#041c14]/90 backdrop-blur-md rounded-3xl border border-emerald-900/40 p-5 shadow-xl flex flex-col items-center justify-center text-center h-full min-h-[460px]">
        <div className="w-14 h-14 rounded-2xl bg-[#07261c] flex items-center justify-center text-[#dfc99a] mb-3 border border-emerald-800/60">
          <Receipt className="w-7 h-7" />
        </div>
        <h4 className="text-base font-serif font-bold text-[#fcfaf5] mb-1">No Table Selected</h4>
        <p className="text-xs text-emerald-300/70 max-w-xs mb-4">
          Select a table from the table grid to open a new tab, add menu items, or view running orders.
        </p>
        <span className="text-[11px] text-[#dfc99a] font-mono bg-[#dfc99a]/10 px-3 py-1 rounded-full border border-[#dfc99a]/30">
          Validation: Selected Table Required
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#041c14]/90 backdrop-blur-md rounded-3xl border border-emerald-900/40 p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="pb-3 border-b border-emerald-900/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#dfc99a]" />
            <div>
              <h3 className="text-base font-serif font-bold text-[#fcfaf5] tracking-wide flex items-center gap-2">
                <span>{selectedTable.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-[#07261c] text-emerald-300 border border-emerald-900/60">
                  #{selectedTable.number}
                </span>
              </h3>
              <p className="text-xs text-emerald-300/70">
                {selectedTable.section} • Capacity {selectedTable.capacity} guests
              </p>
            </div>
          </div>

          {/* Table / Order Status Badge */}
          {isSettled ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Settled Tab
            </span>
          ) : activeOrder ? (
            <KitchenStatusBadge status={activeOrder.kitchenStatus || 'PENDING'} size="sm" />
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
              New Tab Draft
            </span>
          )}
        </div>

        {/* Member Identification Area */}
        {!isSettled && (
          <div className="mt-3 pt-3 border-t border-emerald-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <Crown className="w-3.5 h-3.5 text-[#dfc99a]" />
                <span className="font-semibold text-emerald-200">Member ID / Tier:</span>
              </div>
              <span className="font-mono text-[#dfc99a] font-bold text-[11px]">
                {memberTier} ({Math.round(discountRate * 100)}% Discount)
              </span>
            </div>

            {/* Quick Member Search Input */}
            <form onSubmit={handleLookupMember} className="flex gap-1.5">
              <input
                type="text"
                value={memberSearchInput}
                onChange={(e) => setMemberSearchInput(e.target.value)}
                placeholder="Search member ID (e.g. MEM-8801)..."
                className="flex-1 px-2.5 py-1 bg-[#02140e]/90 border border-emerald-900/60 rounded-xl text-xs text-white placeholder-emerald-700/60 focus:outline-none focus:border-[#dfc99a] font-mono"
              />
              <button
                type="submit"
                disabled={isSearchingMember}
                className="px-2.5 py-1 bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 rounded-xl text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
              >
                <Search className="w-3 h-3" />
                <span>Verify</span>
              </button>
            </form>

            {/* Edge Case: Invalid Member Warning */}
            {memberError && (
              <div className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-[11px] text-rose-300">
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{memberError}</span>
              </div>
            )}

            {/* Member Verified Success Banner */}
            {memberSuccess && (
              <div className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-[11px] text-emerald-300">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{memberSuccess}</span>
              </div>
            )}

            {/* Manual Tier Selectors */}
            <div className="flex items-center gap-1 pt-1">
              {['Guest', 'Junior', 'Silver', 'Gold'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => {
                    onUpdateMemberTier(tier);
                    setMemberError(null);
                  }}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition ${
                    memberTier === tier
                      ? 'btn-champagne font-bold'
                      : 'bg-[#07261c] text-emerald-400/80 hover:bg-[#0b3829] hover:text-white border border-emerald-900/50'
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

      {/* Edge Case: Order Already Settled Warning */}
      {isSettled && (
        <div className="my-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tab Closed & Settled</span>
          </div>
          <p className="text-[11px] text-emerald-400/80">
            Settled via <span className="uppercase font-semibold">{activeOrder.paymentMethod || 'Card'}</span>. Adding items or re-settlement is prohibited.
          </p>
        </div>
      )}

      {/* Itemized Order List */}
      <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2 max-h-[300px]">
        {!hasItems ? (
          <div className="text-center py-8 text-emerald-500/70 text-xs border border-dashed border-emerald-900/60 rounded-2xl bg-[#02140e]/30">
            No items in tab. Select items from the menu to build order.
          </div>
        ) : (
          allItems.map((item, idx) => {
            const unitPrice = item.unitPrice || item.price || 0;
            const lineTotal = unitPrice * (item.quantity || 1);
            const itemId = item.itemId || item.id;

            return (
              <div
                key={`${itemId}-${idx}`}
                className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-2 transition ${
                  item.isExisting
                    ? 'bg-[#02140e]/70 border-emerald-900/50'
                    : 'bg-emerald-950/30 border-[#dfc99a]/30'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white truncate">
                      {item.name}
                    </span>
                    {!item.isExisting && (
                      <span className="text-[9px] bg-[#dfc99a]/20 text-[#dfc99a] px-1.5 py-0.5 rounded font-bold">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-400/70 mt-0.5 font-mono">
                    ₹{unitPrice} each
                    {item.notes && <span className="ml-1 text-[#dfc99a]">({item.notes})</span>}
                  </div>
                </div>

                {/* Quantity Controls enforcing Positive Quantity */}
                <div className="flex items-center gap-2">
                  {!isSettled ? (
                    <div className="flex items-center border border-emerald-900/60 rounded-xl bg-[#07261c] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.isExisting) {
                            if (item.quantity > 1 && onUpdateExistingItemQty) {
                              onUpdateExistingItemQty(activeOrder.id, itemId, item.quantity - 1);
                            }
                          } else {
                            onUpdateDraftItemQty(item.id, -1);
                          }
                        }}
                        disabled={item.quantity <= 1}
                        className="px-1.5 py-0.5 text-emerald-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Decrease quantity"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="px-1.5 font-mono font-bold text-white text-xs min-w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.isExisting) {
                            if (onUpdateExistingItemQty) {
                              onUpdateExistingItemQty(activeOrder.id, itemId, item.quantity + 1);
                            }
                          } else {
                            onUpdateDraftItemQty(item.id, 1);
                          }
                        }}
                        className="px-1.5 py-0.5 text-emerald-400 hover:text-white"
                        title="Increase quantity"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-emerald-300 px-2 py-0.5 bg-[#07261c] rounded-lg text-xs border border-emerald-900/50">
                      {item.quantity}x
                    </span>
                  )}

                  <span className="font-mono font-bold text-white text-right min-w-[55px]">
                    ₹{lineTotal}
                  </span>

                  {!item.isExisting && !isSettled && onRemoveDraftItem && (
                    <button
                      type="button"
                      onClick={() => onRemoveDraftItem(item.id)}
                      className="text-emerald-500/70 hover:text-rose-400 p-1 transition"
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

      {/* Bill Breakdown Summary */}
      <div className="pt-3 border-t border-emerald-900/40 space-y-1.5 text-xs">
        <div className="flex justify-between text-emerald-300/80">
          <span>Subtotal ({allItems.length} items)</span>
          <span className="font-mono text-emerald-100">₹{subtotal}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-[#dfc99a] font-medium">
            <span>Member Discount ({memberTier} - {Math.round(discountRate * 100)}%)</span>
            <span className="font-mono">-₹{discountAmount}</span>
          </div>
        )}

        <div className="flex justify-between text-emerald-300/80">
          <span>Club Tax & GST (5%)</span>
          <span className="font-mono text-emerald-100">₹{tax}</span>
        </div>

        <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-emerald-900/40">
          <span className="font-serif">Total Payable</span>
          <span className="font-mono text-[#dfc99a] text-lg font-bold">₹{total}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-2 space-y-2">
        {/* Send Draft to Kitchen / Open Tab */}
        {hasDraftItems && !isSettled && (
          <button
            type="button"
            onClick={onSendOrderToKitchen}
            disabled={isSendingOrder}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition active:scale-98 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSendingOrder
                ? 'Dispatching to Kitchen...'
                : activeOrder
                ? `Send Additional (${draftItems.length}) Items to Kitchen`
                : `Open Tab & Send (${draftItems.length}) Items`}
            </span>
          </button>
        )}

        {/* Proceed to Settlement Button */}
        <button
          type="button"
          onClick={() =>
            onOpenSettlement({
              subtotal,
              discountAmount,
              discountPercentage: Math.round(discountRate * 100),
              tax,
              total,
              memberTier,
              memberName: memberName || (memberTier !== 'Guest' ? `${memberTier} Member` : 'Walk-in Guest'),
              memberId
            })
          }
          disabled={!hasItems || isSettled || subtotal <= 0}
          className={`w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg ${
            !hasItems || isSettled || subtotal <= 0
              ? 'bg-[#07261c] text-emerald-600/60 cursor-not-allowed border border-emerald-900/40'
              : 'btn-champagne active:scale-98'
          }`}
          title={
            isSettled
              ? 'Tab is already settled'
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
        {hasDraftItems && !isSettled && (
          <button
            type="button"
            onClick={onClearDraft}
            className="w-full py-1.5 text-[11px] text-emerald-400/70 hover:text-rose-400 flex items-center justify-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Discard Draft Items</span>
          </button>
        )}
      </div>
    </div>
  );
}

