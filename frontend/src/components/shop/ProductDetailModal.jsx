import React, { useState } from 'react';
import { useShopCart } from '../../features/shop/ShopCartContext.jsx';
import { 
  X, 
  Star, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Package, 
  Minus, 
  Plus 
} from 'lucide-react';

export default function ProductDetailModal() {
  const { selectedProductForDetail, setSelectedProductForDetail, addToCart, setIsCartOpen } = useShopCart();
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!selectedProductForDetail) return null;

  const product = selectedProductForDetail;
  const isOutOfStock = !product.inStock || product.stock === 0;
  const maxStock = product.stock || 0;

  const handleIncrement = () => {
    if (quantity < maxStock) {
      setQuantity(q => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, quantity);
    if (res.success) {
      setAddedAnimation(true);
      setTimeout(() => {
        setAddedAnimation(false);
        setSelectedProductForDetail(null);
        setIsCartOpen(true);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#010b07]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#041c14] border border-[#dfc99a]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setSelectedProductForDetail(null)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#02140e]/80 text-[#ede0c4] hover:text-white hover:bg-[#02140e] border border-[#dfc99a]/20 transition-colors"
          aria-label="Close product view"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Media Column */}
        <div className="md:w-1/2 relative bg-[#02140e] flex items-center justify-center min-h-[260px] md:min-h-[360px]">
          <img
            src={product.imageUrl || product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041c14] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#041c14] opacity-80" />

          {/* Badges Over Image */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#02140e]/95 text-[#ede0c4] border border-[#dfc99a]/30 uppercase tracking-wider shadow-lg">
              {product.category}
            </span>
            {product.badge && (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/20">
                {product.badge}
              </span>
            )}
          </div>
        </div>

        {/* Product Info & Controls Column */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Rating & Sport */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#dfc99a] font-bold">
                <Star className="w-4 h-4 fill-[#dfc99a] text-[#dfc99a]" />
                <span>{product.rating ? Number(product.rating).toFixed(1) : '4.9'}</span>
                <span className="text-[#ede0c4]/50">• Pro Approved</span>
              </div>
              <span className="text-[11px] font-mono text-[#dfc99a] bg-[#02140e] px-2.5 py-1 rounded-lg border border-[#dfc99a]/20">
                SKU: {product.sku || product.id}
              </span>
            </div>

            {/* Product Title */}
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight leading-snug">
              {product.name}
            </h3>

            {/* Stock Level Status */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                  <Package className="w-3.5 h-3.5" />
                  <span>Out of Shelf Stock</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  <Package className="w-3.5 h-3.5" />
                  <span>Available on Shelf ({product.stock} units)</span>
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#ede0c4]/80 leading-relaxed">
              {product.description}
            </p>

            {/* Price Breakdown */}
            <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#ede0c4]/60 uppercase font-semibold">Standard Retail Price:</span>
                <span className="text-sm line-through text-[#ede0c4]/50 font-mono">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-[#dfc99a]/10">
                <span className="text-xs text-[#dfc99a] font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#dfc99a]" />
                  <span>Member Benefit Rate:</span>
                </span>
                <span className="text-xl font-serif font-black text-white">
                  ₹{Number(product.memberPrice || product.price * 0.8).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Selector & Action */}
          <div className="space-y-4 pt-2 border-t border-[#dfc99a]/15">
            {!isOutOfStock && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ede0c4] uppercase tracking-wider">Select Quantity:</span>
                <div className="flex items-center gap-3 bg-[#02140e] p-1 rounded-xl border border-[#dfc99a]/30">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="p-1.5 rounded-lg text-[#ede0c4] hover:bg-[#07261c] disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold font-mono text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= maxStock}
                    className="p-1.5 rounded-lg text-[#ede0c4] hover:bg-[#07261c] disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-xl ${
                isOutOfStock
                  ? 'bg-[#02140e] text-[#ede0c4]/40 border border-[#dfc99a]/10 cursor-not-allowed'
                  : addedAnimation
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 scale-[0.98]'
                  : 'btn-champagne'
              }`}
            >
              {isOutOfStock ? (
                <span>Item Currently Unavailable</span>
              ) : addedAnimation ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Added {quantity} to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#02140e]" />
                  <span>Add {quantity > 1 ? `${quantity} Items` : 'to Cart'} • ₹{(Number(product.price) * quantity).toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
