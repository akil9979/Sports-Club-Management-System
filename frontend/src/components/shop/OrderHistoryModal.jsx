import React, { useState, useEffect } from 'react';
import { useShopCart } from '../../features/shop/ShopCartContext.jsx';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { getShopOrders } from '../../features/shop/shopApi.js';
import { 
  X, 
  ShoppingBag, 
  Clock, 
  Truck, 
  Package, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Receipt,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function OrderHistoryModal() {
  const { isOrderHistoryOpen, setIsOrderHistoryOpen, setActiveOrderConfirmation } = useShopCart();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShopOrders({ memberId: user?.memberId || user?.member?.id });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load order history:', err);
      setError('Could not retrieve order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOrderHistoryOpen) {
      fetchOrders();
    }
  }, [isOrderHistoryOpen, user]);

  if (!isOrderHistoryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#010b07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#041c14] border border-[#dfc99a]/30 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#dfc99a]/15 bg-[#02140e]/95 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white">Your Pro Shop Order History</h3>
              <p className="text-xs text-[#ede0c4]/70">
                {user ? `Orders for ${user.firstName || 'Member'} (${user.memberNumber || user.email})` : 'Recent online equipment purchases'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOrderHistoryOpen(false)}
            className="p-2 rounded-full text-[#ede0c4] hover:text-white hover:bg-[#07261c] border border-transparent hover:border-[#dfc99a]/20 transition-colors"
            aria-label="Close order history"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 w-32 bg-[#06261b] rounded" />
                    <div className="h-5 w-20 bg-[#06261b] rounded" />
                  </div>
                  <div className="h-4 w-48 bg-[#06261b] rounded" />
                  <div className="h-10 w-full bg-[#06261b] rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-8 text-center space-y-3 max-w-md mx-auto">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <p className="text-sm text-rose-300 font-medium">{error}</p>
              <button
                type="button"
                onClick={fetchOrders}
                className="px-4 py-2 bg-[#06261b] text-xs font-semibold text-white rounded-xl hover:bg-[#0a3425] border border-[#dfc99a]/20"
              >
                <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && orders.length === 0 && (
            <div className="p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20 flex items-center justify-center text-[#dfc99a]/40 mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-serif font-bold text-white">No Orders Placed Yet</h4>
                <p className="text-xs text-[#ede0c4]/70">
                  When you order equipment, rackets, or match balls, your digital invoices and pickup tokens will appear here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderHistoryOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold btn-champagne shadow-md"
              >
                Explore Pro Shop
              </button>
            </div>
          )}

          {/* Order Cards List */}
          {!loading && !error && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => {
                const isDelivery = order.fulfilmentType === 'delivery' || order.orderType === 'online_delivery';
                const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Recently Placed';

                return (
                  <div
                    key={order.id || order.orderNumber}
                    className="p-5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20 hover:border-[#dfc99a]/40 transition-all space-y-3.5 shadow-lg"
                  >
                    {/* Top Row: Order Number, Date, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-[#dfc99a]">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-[#ede0c4]/50">• {dateStr}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.status === 'completed' || order.status === 'fulfilled'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : order.status === 'cancelled'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/30'
                        }`}>
                          {order.status || 'Pending'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#041c14] text-[#ede0c4] border border-[#dfc99a]/15 flex items-center gap-1">
                          {isDelivery ? <Truck className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-[#dfc99a]" />}
                          <span>{isDelivery ? 'Delivery' : 'Pickup'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="divide-y divide-[#dfc99a]/10 rounded-xl bg-[#041c14] border border-[#dfc99a]/10 overflow-hidden text-xs">
                      {(order.items || []).map((item, idx) => (
                        <div key={item.id || idx} className="p-2.5 px-3 flex items-center justify-between">
                          <span className="text-white font-medium">
                            {item.quantity} × {item.productName || item.name || 'Pro Shop Item'}
                          </span>
                          <span className="font-mono text-[#ede0c4]/80">
                            ₹{Number(item.totalPrice || item.unitPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary & Receipt Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#dfc99a]/10 text-xs">
                      <div className="flex items-center gap-3 text-[#ede0c4]/70">
                        <span>Items: {order.totalQuantity || order.items?.reduce((a, b) => a + b.quantity, 0) || order.items?.length || 1}</span>
                        {Number(order.discountAmount || 0) > 0 && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Saved ₹{Number(order.discountAmount).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-[#ede0c4]/50 uppercase font-bold mr-1.5">Total Paid:</span>
                          <span className="font-serif font-black text-sm text-[#dfc99a]">
                            ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsOrderHistoryOpen(false);
                            setActiveOrderConfirmation(order);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#07261c] hover:bg-[#0c3a2b] text-[#dfc99a] border border-[#dfc99a]/30 transition flex items-center gap-1"
                        >
                          <span>Receipt</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-[#02140e] border-t border-[#dfc99a]/15 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={fetchOrders}
            className="text-xs text-[#ede0c4]/70 hover:text-white flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh History</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOrderHistoryOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-bold btn-champagne"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
