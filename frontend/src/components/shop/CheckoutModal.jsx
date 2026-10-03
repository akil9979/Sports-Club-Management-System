import React, { useState, useEffect } from 'react';
import { useShopCart } from '../../features/shop/ShopCartContext.jsx';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { createShopOrder } from '../../features/shop/shopApi.js';
import { 
  X, 
  Truck, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  UserCheck, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function CheckoutModal() {
  const { 
    cart, 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    clearCart, 
    cartSubtotal,
    setActiveOrderConfirmation 
  } = useShopCart();

  const { user } = useAuth();

  const [fulfilmentType, setFulfilmentType] = useState('pickup'); // 'pickup' | 'delivery'
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [pickupTime, setPickupTime] = useState('Today, within 2 hours (Front Desk)');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Initialize customer information from auth session if available
  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '';
      setCustomerName(fullName);
      setCustomerEmail(user.email || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  if (!isCheckoutOpen) return null;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Cannot checkout with an empty equipment bag.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (fulfilmentType === 'delivery' && (!deliveryAddress.trim() || deliveryAddress.trim().length < 5)) {
      setErrorMessage('Please provide a complete delivery address (minimum 5 characters).');
      return;
    }

    setSubmitting(true);

    const orderPayload = {
      memberId: user?.memberId || user?.member?.id || null,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim() || null,
      orderType: fulfilmentType === 'delivery' ? 'online_delivery' : 'online_pickup',
      fulfilmentType,
      deliveryAddress: fulfilmentType === 'delivery' ? deliveryAddress.trim() : null,
      deliveryNotes: fulfilmentType === 'delivery' && deliveryNotes ? deliveryNotes.trim() : null,
      pickupTime: fulfilmentType === 'pickup' ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : null,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      const res = await createShopOrder(orderPayload);
      if (res.success && res.data) {
        clearCart();
        setIsCheckoutOpen(false);
        setActiveOrderConfirmation(res.data);
      } else {
        throw new Error(res.message || 'Failed to complete order');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'An error occurred while placing your order. Please check inventory and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#010b07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#041c14] border border-[#dfc99a]/30 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#dfc99a]/15 bg-[#02140e]/95 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white">Order Checkout & Fulfilment</h3>
              <p className="text-xs text-[#ede0c4]/70">Unified Pro Shop & In-House Inventory Service</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 rounded-full text-[#ede0c4] hover:text-white hover:bg-[#07261c] border border-transparent hover:border-[#dfc99a]/20 transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Fulfilment Method Switcher */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider">
              1. Choose Fulfilment Method:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pickup Option */}
              <button
                type="button"
                onClick={() => setFulfilmentType('pickup')}
                className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3.5 ${
                  fulfilmentType === 'pickup'
                    ? 'bg-[#07261c] border-[#dfc99a] text-white shadow-lg shadow-[#dfc99a]/10'
                    : 'bg-[#02140e] border-[#dfc99a]/15 text-[#ede0c4]/70 hover:border-[#dfc99a]/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  fulfilmentType === 'pickup' ? 'bg-[#dfc99a] text-[#02140e]' : 'bg-[#041c14] text-[#dfc99a]'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Counter Pickup</span>
                    {fulfilmentType === 'pickup' && <CheckCircle2 className="w-4 h-4 text-[#dfc99a]" />}
                  </div>
                  <span className="text-xs text-[#ede0c4]/60 block mt-0.5">Collect at Front Desk or Assigned Locker</span>
                </div>
              </button>

              {/* Delivery Option */}
              <button
                type="button"
                onClick={() => setFulfilmentType('delivery')}
                className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3.5 ${
                  fulfilmentType === 'delivery'
                    ? 'bg-[#07261c] border-[#dfc99a] text-white shadow-lg shadow-[#dfc99a]/10'
                    : 'bg-[#02140e] border-[#dfc99a]/15 text-[#ede0c4]/70 hover:border-[#dfc99a]/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  fulfilmentType === 'delivery' ? 'bg-[#dfc99a] text-[#02140e]' : 'bg-[#041c14] text-emerald-400'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Doorstep Delivery</span>
                    {fulfilmentType === 'delivery' && <CheckCircle2 className="w-4 h-4 text-[#dfc99a]" />}
                  </div>
                  <span className="text-xs text-[#ede0c4]/60 block mt-0.5">Direct express courier to your residence</span>
                </div>
              </button>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="space-y-4 pt-2 border-t border-[#dfc99a]/15">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider">
                2. Customer Contact Details:
              </label>
              {user && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#dfc99a] font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Verified Member: {user.memberNumber || user.role}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#ede0c4]/70 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Devon Conway"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-xs text-white placeholder-[#ede0c4]/30 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#ede0c4]/70 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-xs text-white placeholder-[#ede0c4]/30 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#ede0c4]/70 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-xs text-white placeholder-[#ede0c4]/30 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>
            </div>
          </div>

          {/* Fulfilment-specific Inputs */}
          {fulfilmentType === 'delivery' ? (
            <div className="space-y-3 pt-2 border-t border-[#dfc99a]/15">
              <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider">
                3. Delivery Address & Gate Instructions:
              </label>
              <div>
                <label className="block text-[11px] text-[#ede0c4]/70 mb-1">Street Address / Society Name *</label>
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Apartment / Villa Number, Street, Landmark, City & PIN Code"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-xs text-white placeholder-[#ede0c4]/30 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#ede0c4]/70 mb-1">Special Delivery Notes (Optional)</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Leave with club reception desk or security gate"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-xs text-white placeholder-[#ede0c4]/30 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2 border-t border-[#dfc99a]/15">
              <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider">
                3. Counter Pickup Schedule:
              </label>
              <div className="p-3.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-[#ede0c4]/80 flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#dfc99a] shrink-0" />
                <span>
                  Items will be prepared immediately by our pro shop staff and available for collection at the front desk (or placed in your locker).
                </span>
              </div>
            </div>
          )}

          {/* Order Summary & Pricing Preview */}
          <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#ede0c4]">
              <span>Items Total ({cart.length} line {cart.length === 1 ? 'item' : 'items'}):</span>
              <span className="font-mono">₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#dfc99a]">
              <span className="flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Membership Privilege:</span>
              </span>
              <span className="font-bold">
                {user?.role === 'member' || user?.memberId ? 'Server Tier Discount (Up to 20% Off)' : 'Standard Rate'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#ede0c4]/70 pt-1 border-t border-[#dfc99a]/10">
              <span>Estimated Tax (5% GST):</span>
              <span className="font-mono">Calculated on invoice</span>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-[#dfc99a]/20">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Estimated Checkout Total:</span>
              <span className="text-xl font-serif font-black text-[#dfc99a]">
                ₹{cartSubtotal.toLocaleString('en-IN')}*
              </span>
            </div>
            <p className="text-[10px] text-[#ede0c4]/50 leading-tight">
              *Final authoritative invoice totals, member discount deductions, and taxes are calculated by the club database upon order creation.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold btn-champagne flex items-center justify-center gap-2 shadow-xl shadow-[#dfc99a]/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#02140e]" />
                  <span>Verifying Stock & Creating Order...</span>
                </>
              ) : (
                <>
                  <span>Place Shop Order ({fulfilmentType === 'delivery' ? 'Home Delivery' : 'Desk Pickup'})</span>
                  <ArrowRight className="w-4 h-4 text-[#02140e]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
