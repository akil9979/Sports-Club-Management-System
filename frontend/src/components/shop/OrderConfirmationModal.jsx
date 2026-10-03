import React from 'react';
import { useShopCart } from '../../features/shop/ShopCartContext.jsx';
import { 
  CheckCircle, 
  X, 
  ShoppingBag, 
  Truck, 
  Clock, 
  Receipt, 
  Sparkles, 
  ArrowRight,
  User,
  MapPin,
  PackageCheck
} from 'lucide-react';

export default function OrderConfirmationModal() {
  const { activeOrderConfirmation, setActiveOrderConfirmation, setIsOrderHistoryOpen } = useShopCart();

  if (!activeOrderConfirmation) return null;

  const order = activeOrderConfirmation;
  const isDelivery = order.fulfilmentType === 'delivery' || order.orderType === 'online_delivery';

  const handleOpenHistory = () => {
    setActiveOrderConfirmation(null);
    setIsOrderHistoryOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#010b07]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#041c14] border border-[#dfc99a]/40 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Success Banner */}
        <div className="p-6 bg-gradient-to-r from-[#06261b] via-[#041c14] to-[#02140e] border-b border-[#dfc99a]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-bold text-white">Order Confirmed!</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/30">
                  {order.status || 'Pending'}
                </span>
              </div>
              <p className="text-xs text-[#ede0c4]/80 mt-0.5">
                Official Order Reference: <strong className="text-[#dfc99a] font-mono">{order.orderNumber}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveOrderConfirmation(null)}
            className="p-2 rounded-full text-[#ede0c4] hover:text-white hover:bg-[#07261c] border border-transparent hover:border-[#dfc99a]/20 transition-colors"
            aria-label="Close confirmation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Order Details & Receipt */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Fulfilment Status Card */}
          <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#dfc99a] uppercase tracking-wider">
              {isDelivery ? <Truck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              <span>Fulfilment Method: {isDelivery ? 'Doorstep Express Delivery' : 'Pro Shop Counter Pickup'}</span>
            </div>
            <div className="text-xs text-[#ede0c4]/80 space-y-1">
              <div>
                <strong>Customer:</strong> {order.customerName} ({order.customerEmail})
              </div>
              {order.customerPhone && (
                <div>
                  <strong>Phone:</strong> {order.customerPhone}
                </div>
              )}
              {isDelivery ? (
                <div className="pt-1 text-emerald-300">
                  <strong>Delivery Destination:</strong> {order.deliveryAddress}
                  {order.deliveryNotes && <span className="block text-[#ede0c4]/60 text-[11px] mt-0.5">Note: {order.deliveryNotes}</span>}
                </div>
              ) : (
                <div className="pt-1 text-emerald-300">
                  <strong>Collection Location:</strong> Champions Club Reception & Pro Shop Desk
                </div>
              )}
            </div>
          </div>

          {/* Purchased Line Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#ede0c4] uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#dfc99a]" />
              <span>Purchased Equipment Items ({order.items?.length || order.totalItems || 1})</span>
            </h4>

            <div className="divide-y divide-[#dfc99a]/10 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 overflow-hidden">
              {(order.items || []).map((item, idx) => (
                <div key={item.id || idx} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">{item.productName || item.name || `Item ${idx + 1}`}</span>
                    <span className="text-[11px] text-[#ede0c4]/60 font-mono">
                      Quantity: {item.quantity} × ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="font-serif font-black text-white text-sm">
                    ₹{Number(item.totalPrice || item.unitPrice * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Authoritative Financial Breakdown */}
          <div className="p-5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/25 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#ede0c4]">
              <span>Catalogue Subtotal:</span>
              <span className="font-mono">₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>

            {Number(order.discountAmount || 0) > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Member Privilege Discount:</span>
                </span>
                <span className="font-mono">- ₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#ede0c4]/70">
              <span>Goods & Services Tax (5% GST):</span>
              <span className="font-mono">₹{Number(order.taxAmount || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-[#dfc99a]/20">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Total Invoice Amount:</span>
              <span className="text-2xl font-serif font-black text-[#dfc99a]">
                ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-6 bg-[#02140e] border-t border-[#dfc99a]/15 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleOpenHistory}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-[#041c14] hover:bg-[#07261c] text-[#ede0c4] border border-[#dfc99a]/30 transition"
          >
            View in My Orders History
          </button>

          <button
            type="button"
            onClick={() => setActiveOrderConfirmation(null)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-extrabold btn-champagne flex items-center justify-center gap-2 shadow-lg"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4 text-[#02140e]" />
          </button>
        </div>
      </div>
    </div>
  );
}
