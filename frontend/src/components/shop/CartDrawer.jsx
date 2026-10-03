import React from 'react';
import { useShopCart } from '../../features/shop/ShopCartContext.jsx';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  Package
} from 'lucide-react';

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    cartSubtotal, 
    totalCartCount,
    setIsCheckoutOpen
  } = useShopCart();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#010b07]/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#041c14] border-l border-[#dfc99a]/30 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-[#dfc99a]/15 bg-[#02140e]/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Your Pro Equipment Bag</h3>
                <span className="text-xs text-[#ede0c4]/70">{totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} selected</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-[#ede0c4] hover:text-white hover:bg-[#07261c] border border-transparent hover:border-[#dfc99a]/20 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20 flex items-center justify-center text-[#dfc99a]/40">
                  <Package className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-serif font-bold text-base">Your Bag is Empty</h4>
                  <p className="text-xs text-[#ede0c4]/70 max-w-xs">
                    Explore tournament rackets, match balls, court shoes, and stringing services.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold btn-champagne shadow-md"
                >
                  Browse Catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(({ product, quantity }) => {
                  const maxStock = product.stock || 99;
                  const itemTotal = product.price * quantity;

                  return (
                    <div 
                      key={product.id}
                      className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 flex items-center justify-between gap-3 shadow-lg hover:border-[#dfc99a]/30 transition-colors"
                    >
                      {/* Image Thumbnail */}
                      <img
                        src={product.imageUrl || product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#dfc99a]/20 shrink-0 bg-[#041c14]"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{product.name}</h4>
                        <div className="text-[11px] text-[#ede0c4]/60 font-mono mt-0.5">
                          ₹{Number(product.price).toLocaleString('en-IN')} each
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 bg-[#041c14] border border-[#dfc99a]/30 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="p-1 text-[#ede0c4] hover:text-white hover:bg-[#07261c] rounded"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold font-mono text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={quantity >= maxStock}
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="p-1 text-[#ede0c4] hover:text-white hover:bg-[#07261c] rounded disabled:opacity-30"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Line Total */}
                      <div className="text-right shrink-0">
                        <span className="text-sm font-serif font-black text-[#dfc99a]">
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] font-semibold text-rose-400/80 hover:text-rose-300 underline"
                  >
                    Clear entire bag
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[#dfc99a]/15 bg-[#02140e] space-y-4">
              {/* Member Perk Banner */}
              <div className="p-3 rounded-xl bg-[#dfc99a]/10 border border-[#dfc99a]/25 flex items-center gap-2.5 text-xs text-[#ede0c4]">
                <Sparkles className="w-4 h-4 text-[#dfc99a] shrink-0" />
                <span className="leading-snug">
                  Authoritative membership discounts (Gold 20%, Silver 10%) are automatically calculated by the server on checkout.
                </span>
              </div>

              {/* Subtotal */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs font-bold text-[#ede0c4]/70 uppercase tracking-wider">Catalog Subtotal:</span>
                <span className="text-2xl font-serif font-black text-white">
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold btn-champagne flex items-center justify-center gap-2 shadow-xl shadow-[#dfc99a]/20 transition-all hover:scale-[1.02]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#02140e]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
