import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  UserCheck,
  CheckCircle2,
  Printer,
  ShieldCheck,
  AlertOctagon,
  AlertCircle
} from 'lucide-react';

export default function PaymentSettlementModal({
  isOpen,
  onClose,
  selectedTable,
  activeOrder,
  settlementDetails,
  onConfirmSettlement,
  isSettling = false
}) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [tipPercentage, setTipPercentage] = useState(0);
  const [cashTendered, setCashTendered] = useState('');
  const [settledReceipt, setSettledReceipt] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  if (!isOpen) return null;

  // Validation: Do not settle without valid order
  const isValidOrder =
    selectedTable &&
    settlementDetails &&
    settlementDetails.total > 0 &&
    (!activeOrder || activeOrder.status !== 'settled');

  // Edge case: Already settled order
  const isAlreadySettled = activeOrder && activeOrder.status === 'settled';

  const baseTotal = settlementDetails?.total || 0;
  const tipAmount = Math.round((baseTotal * tipPercentage) / 100);
  const grandTotal = baseTotal + tipAmount;

  const cashAmount = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashAmount - grandTotal);
  const isCashInsufficient = paymentMethod === 'cash' && cashAmount < grandTotal && cashAmount > 0;

  const handleSettle = async () => {
    // Validation: Payment method required
    if (!paymentMethod) {
      setPaymentError('Payment method is required. Please select Cash, Card, UPI, or Member Tab.');
      return;
    }

    // Validation: Do not settle twice
    if (isAlreadySettled) {
      setPaymentError('This tab is already settled. Duplicate settlement is prohibited.');
      return;
    }

    if (!isValidOrder) {
      setPaymentError('Cannot settle: selected table has no valid open order.');
      return;
    }

    setPaymentError(null);
    try {
      const receipt = await onConfirmSettlement({
        paymentMethod,
        tipAmount,
        grandTotal,
        subtotal: settlementDetails.subtotal,
        discountAmount: settlementDetails.discountAmount,
        discountPercentage: settlementDetails.discountPercentage,
        tax: settlementDetails.tax,
        memberTier: settlementDetails.memberTier || 'Guest',
        memberName: settlementDetails.memberName || 'Guest',
        memberId: settlementDetails.memberId || null,
        tableName: selectedTable.name,
        tableNumber: selectedTable.number
      });

      if (receipt) {
        setSettledReceipt(receipt);
      }
    } catch (err) {
      setPaymentError(err.message || 'Payment processing failed. Please try again or choose another method.');
    }
  };

  const handleClose = () => {
    setSettledReceipt(null);
    setTipPercentage(0);
    setCashTendered('');
    setPaymentError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02140e]/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#041c14] border border-emerald-900/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#dfc99a]/15 border border-[#dfc99a]/30 flex items-center justify-center text-[#dfc99a]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#fcfaf5]">
                {settledReceipt ? 'Payment Settled Successfully' : 'Table Tab Settlement'}
              </h3>
              <p className="text-xs text-emerald-300/70">
                {selectedTable?.name} (#{selectedTable?.number})
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-emerald-400/80 hover:text-white p-1 rounded-lg hover:bg-[#07261c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Post-settlement receipt view */}
          {settledReceipt ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-16 h-16 bg-[#dfc99a]/20 text-[#dfc99a] rounded-full flex items-center justify-center mx-auto border border-[#dfc99a]/40 shadow-lg shadow-[#dfc99a]/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-serif font-bold text-[#fcfaf5]">Payment Confirmed</h4>
                <p className="text-emerald-400/80 text-xs mt-1 font-mono">
                  Receipt #{settledReceipt.receiptNumber || 'RCP-SETTLED'}
                </p>
              </div>

              {/* Receipt details slip */}
              <div className="bg-[#02140e]/90 border border-emerald-900/60 rounded-2xl p-4 text-left font-mono text-xs space-y-2 text-emerald-200">
                <div className="flex justify-between border-b border-emerald-900/50 pb-2">
                  <span className="text-emerald-400/70">Club Table:</span>
                  <span className="font-bold text-[#fcfaf5]">{selectedTable?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400/70">Payment Channel:</span>
                  <span className="uppercase font-semibold text-[#dfc99a]">
                    {settledReceipt.paymentMethod || paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400/70">Guest / Member:</span>
                  <span>{settlementDetails?.memberName || 'Guest'} ({settlementDetails?.memberTier || 'Guest'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400/70">Subtotal:</span>
                  <span>₹{settlementDetails?.subtotal}</span>
                </div>
                {settlementDetails?.discountAmount > 0 && (
                  <div className="flex justify-between text-[#dfc99a]">
                    <span>Member Discount ({settlementDetails?.discountPercentage || 0}%):</span>
                    <span>-₹{settlementDetails?.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-emerald-400/70">GST Tax (5%):</span>
                  <span>₹{settlementDetails?.tax}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>Staff Gratuity:</span>
                    <span>+₹{tipAmount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-emerald-900/50 pt-2 text-[#fcfaf5] font-bold text-sm">
                  <span className="font-serif">Total Amount Paid:</span>
                  <span className="text-[#dfc99a] text-base">₹{grandTotal}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 rounded-2xl font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 btn-champagne rounded-2xl font-bold transition"
                >
                  Done & Clear Table
                </button>
              </div>
            </div>
          ) : isAlreadySettled ? (
            /* Edge Case Alert: Already Settled Order */
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-3">
              <AlertOctagon className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-sm font-serif font-bold text-amber-200">
                Order Already Settled
              </h4>
              <p className="text-xs text-amber-300/80 max-w-sm mx-auto">
                This table tab was already closed and marked as paid via {activeOrder.paymentMethod || 'card'}. Duplicate settlement is prohibited.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 rounded-xl text-xs font-semibold"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : !isValidOrder ? (
            /* Validation: Do not settle without valid order */
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-2">
              <AlertOctagon className="w-10 h-10 text-rose-400 mx-auto" />
              <h4 className="text-sm font-serif font-bold text-rose-200">
                Invalid Order for Settlement
              </h4>
              <p className="text-xs text-rose-300/80">
                Cannot settle an empty tab or invalid order. Add items to tab first.
              </p>
            </div>
          ) : (
            /* Normal Settlement Flow */
            <>
              {/* Payment Error Banner if any */}
              {paymentError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Payment Methods */}
              <div>
                <label className="block text-emerald-300 font-semibold mb-2">
                  Select Payment Method <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('card');
                      setPaymentError(null);
                    }}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition text-left ${
                      paymentMethod === 'card'
                        ? 'bg-gradient-to-br from-[#dfc99a]/15 via-[#041c14] to-[#02140e] border-[#dfc99a] text-[#fcfaf5] ring-1 ring-[#dfc99a]/40'
                        : 'bg-[#02140e]/80 border-emerald-900/50 text-emerald-400 hover:border-emerald-700/60 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0 text-[#dfc99a]" />
                    <div>
                      <div className="font-semibold text-white">Credit / Debit Card</div>
                      <div className="text-[10px] text-emerald-400/70">POS Card Terminal</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setPaymentError(null);
                    }}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition text-left ${
                      paymentMethod === 'cash'
                        ? 'bg-gradient-to-br from-[#dfc99a]/15 via-[#041c14] to-[#02140e] border-[#dfc99a] text-[#fcfaf5] ring-1 ring-[#dfc99a]/40'
                        : 'bg-[#02140e]/80 border-emerald-900/50 text-emerald-400 hover:border-emerald-700/60 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4 shrink-0 text-[#dfc99a]" />
                    <div>
                      <div className="font-semibold text-white">Cash Payment</div>
                      <div className="text-[10px] text-emerald-400/70">Cash Register</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('upi');
                      setPaymentError(null);
                    }}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition text-left ${
                      paymentMethod === 'upi'
                        ? 'bg-gradient-to-br from-[#dfc99a]/15 via-[#041c14] to-[#02140e] border-[#dfc99a] text-[#fcfaf5] ring-1 ring-[#dfc99a]/40'
                        : 'bg-[#02140e]/80 border-emerald-900/50 text-emerald-400 hover:border-emerald-700/60 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4 shrink-0 text-[#dfc99a]" />
                    <div>
                      <div className="font-semibold text-white">UPI / Instant QR</div>
                      <div className="text-[10px] text-emerald-400/70">Scan at Table</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('member_tab');
                      setPaymentError(null);
                    }}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition text-left ${
                      paymentMethod === 'member_tab'
                        ? 'bg-gradient-to-br from-[#dfc99a]/15 via-[#041c14] to-[#02140e] border-[#dfc99a] text-[#fcfaf5] ring-1 ring-[#dfc99a]/40'
                        : 'bg-[#02140e]/80 border-emerald-900/50 text-emerald-400 hover:border-emerald-700/60 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0 text-[#dfc99a]" />
                    <div>
                      <div className="font-semibold text-white">Member Club Tab</div>
                      <div className="text-[10px] text-emerald-400/70">Monthly Bill Ledger</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tip / Gratuity Selection */}
              <div>
                <label className="block text-emerald-300 font-semibold mb-1.5">
                  Staff Gratuity / Tip
                </label>
                <div className="flex items-center gap-2">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTipPercentage(pct)}
                      className={`flex-1 py-1.5 rounded-xl font-semibold transition ${
                        tipPercentage === pct
                          ? 'btn-champagne font-bold'
                          : 'bg-[#07261c] text-emerald-400/80 hover:bg-[#0b3829] hover:text-white border border-emerald-900/50'
                      }`}
                    >
                      {pct === 0 ? 'No Tip' : `${pct}% (₹${Math.round((baseTotal * pct) / 100)})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash calculation if cash is chosen */}
              {paymentMethod === 'cash' && (
                <div className="p-3 bg-[#02140e]/90 border border-emerald-900/60 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300">Amount Tendered:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder={grandTotal.toString()}
                        className="w-24 px-2 py-1 bg-[#07261c] border border-emerald-800 rounded-lg text-right font-mono text-white text-xs focus:outline-none focus:border-[#dfc99a]"
                      />
                    </div>
                  </div>

                  {changeDue > 0 && (
                    <div className="flex items-center justify-between text-[#dfc99a] font-bold">
                      <span>Change to Return:</span>
                      <span className="font-mono text-sm">₹{changeDue}</span>
                    </div>
                  )}

                  {isCashInsufficient && (
                    <p className="text-[11px] text-rose-400">
                      Tendered amount is less than total payable.
                    </p>
                  )}
                </div>
              )}

              {/* Final Summary Card with Member Discount Details */}
              <div className="p-3.5 bg-[#02140e]/90 border border-emerald-900/60 rounded-2xl space-y-1.5 font-mono">
                <div className="flex justify-between text-emerald-400/80">
                  <span>Tab Subtotal:</span>
                  <span>₹{settlementDetails.subtotal}</span>
                </div>
                {settlementDetails.discountAmount > 0 && (
                  <div className="flex justify-between text-[#dfc99a]">
                    <span>
                      Member Discount ({settlementDetails.memberTier} - {settlementDetails.discountPercentage}%):
                    </span>
                    <span>-₹{settlementDetails.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-400/80">
                  <span>GST & Club Tax (5%):</span>
                  <span>₹{settlementDetails.tax}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>Staff Tip:</span>
                    <span>+₹{tipAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-emerald-900/50">
                  <span className="font-serif">Total Due:</span>
                  <span className="text-[#dfc99a] text-base">₹{grandTotal}</span>
                </div>
              </div>

              {/* Settlement Button */}
              <button
                type="button"
                onClick={handleSettle}
                disabled={isSettling || isCashInsufficient || !paymentMethod}
                className="w-full py-3 btn-champagne font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#dfc99a]/20 transition active:scale-98 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSettling
                    ? 'Processing Settlement...'
                    : `Confirm & Settle ₹${grandTotal} (${paymentMethod.toUpperCase()})`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

