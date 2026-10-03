import React, { useState } from 'react';
import { useShopCart } from '../../features/shop/ShopCartContext.jsx';
import { 
  Star, 
  Sparkles, 
  ShoppingBag, 
  Check, 
  Eye, 
  AlertCircle 
} from 'lucide-react';

export default function ProductCard({ product }) {
  const { addToCart, setSelectedProductForDetail, setIsCartOpen } = useShopCart();
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isOutOfStock = !product.inStock || product.stock === 0;
  const isLowStock = product.inStock && product.stock > 0 && product.stock <= 5;

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    const res = addToCart(product, 1);
    if (res.success) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1500);
    }
  };

  const handleCardClick = () => {
    setSelectedProductForDetail(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="glass-panel rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#dfc99a]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group cursor-pointer border border-[#dfc99a]/15 bg-[#041c14]/90 backdrop-blur-md"
    >
      <div>
        {/* Product Image Header with Status Overlays */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-[#02140e]">
          <img
            src={product.imageUrl || product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#02140e] via-transparent to-transparent opacity-80" />

          {/* Top-Left Category & Custom Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#02140e]/90 backdrop-blur-md text-[#ede0c4] border border-[#dfc99a]/25 uppercase tracking-wider">
              {product.category}
            </span>
            {product.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/20">
                {product.badge}
              </span>
            )}
          </div>

          {/* Top-Right Real-time Unified Inventory Indicator */}
          <div className="absolute top-3 right-3 z-10">
            {isOutOfStock ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/90 backdrop-blur-md text-rose-300 border border-rose-800">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dfc99a]/20 backdrop-blur-md text-[#dfc99a] border border-[#dfc99a]/40 animate-pulse">
                Only {product.stock} Left
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#02140e]/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                In Stock ({product.stock})
              </span>
            )}
          </div>

          {/* Quick View Floating Button on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#02140e]/40 backdrop-blur-xs">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#041c14]/90 border border-[#dfc99a]/40 text-[#ede0c4] flex items-center gap-1.5 shadow-xl">
              <Eye className="w-3.5 h-3.5 text-[#dfc99a]" />
              <span>Quick View</span>
            </span>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-[#dfc99a] font-bold">
              <Star className="w-3.5 h-3.5 fill-[#dfc99a] text-[#dfc99a]" />
              <span>{product.rating ? Number(product.rating).toFixed(1) : '4.9'}</span>
            </div>
            <span className="text-[#ede0c4]/50 text-[10px] uppercase font-semibold tracking-wider">
              {product.sport || 'Pro Equipment'}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#dfc99a] transition-colors line-clamp-1">
            {product.name}
          </h4>

          <p className="text-xs text-[#ede0c4]/70 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Pricing Grid */}
          <div className="pt-2.5 border-t border-[#dfc99a]/15 flex items-baseline justify-between">
            <div>
              <div className="text-[9px] text-[#ede0c4]/50 uppercase font-bold tracking-wider">Retail Rate</div>
              <div className="text-xs font-semibold text-[#ede0c4]/50 line-through">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-[#dfc99a] uppercase font-bold flex items-center gap-1 justify-end">
                <Sparkles className="w-2.5 h-2.5 text-[#dfc99a]" />
                <span>Member Privilege</span>
              </div>
              <div className="text-base font-black text-white">
                ₹{Number(product.memberPrice || product.price * 0.8).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-1">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleQuickAdd}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md ${
            isOutOfStock
              ? 'bg-[#02140e] text-[#ede0c4]/40 border border-[#dfc99a]/10 cursor-not-allowed'
              : addedAnimation
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25'
              : 'btn-champagne'
          }`}
        >
          {isOutOfStock ? (
            <span>Sold Out</span>
          ) : addedAnimation ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-[#02140e]" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
