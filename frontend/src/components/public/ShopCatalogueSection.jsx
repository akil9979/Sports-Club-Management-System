import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  AlertCircle, 
  RefreshCw, 
  Package, 
  Wrench, 
  Truck, 
  ShieldCheck, 
  Search,
  Receipt,
  Filter,
  CheckCircle
} from 'lucide-react';
import { getProducts } from '../../features/shop/shopApi.js';
import { useShopCart } from '../../features/shop/ShopCartContext.jsx';
import ProductCard from '../shop/ProductCard.jsx';
import ProductDetailModal from '../shop/ProductDetailModal.jsx';
import CartDrawer from '../shop/CartDrawer.jsx';
import CheckoutModal from '../shop/CheckoutModal.jsx';
import OrderConfirmationModal from '../shop/OrderConfirmationModal.jsx';
import OrderHistoryModal from '../shop/OrderHistoryModal.jsx';

export default function ShopCatalogueSection({ embedded = false }) {
  const { 
    totalCartCount, 
    setIsCartOpen, 
    setIsOrderHistoryOpen 
  } = useShopCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  const categories = ['All', 'Rackets', 'Balls', 'Shoes', 'Cricket', 'Accessories'];

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts({
        category: activeCategory !== 'All' ? activeCategory : '',
        search: searchQuery.trim(),
        inStock: inStockOnly ? true : undefined
      });
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Could not load pro shop items. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeCategory, inStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <section id="shop-section" className={`w-full ${embedded ? 'py-4' : 'py-20 bg-[#02140e] border-t border-[#dfc99a]/15'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header & Cart Quick Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/25 backdrop-blur-md">
              <ShoppingBag className="w-3.5 h-3.5 text-[#dfc99a]" />
              <span>The Pro Shop & Workshop Desk</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Championship Gear & Live Inventory
            </h2>
            <p className="text-[#ede0c4]/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Unified shelf stock for instant front-desk collection or doorstep courier delivery. 
              Authoritative member discounts applied automatically on invoice checkout.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsOrderHistoryOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#041c14] hover:bg-[#07261c] text-[#ede0c4] border border-[#dfc99a]/30 transition flex items-center gap-2 shadow-lg"
            >
              <Receipt className="w-4 h-4 text-[#dfc99a]" />
              <span>My Orders</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold btn-champagne flex items-center gap-2.5 shadow-xl shadow-[#dfc99a]/20 transition relative"
            >
              <ShoppingBag className="w-4 h-4 text-[#02140e]" />
              <span>My Bag</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#02140e] text-[#dfc99a] border border-[#dfc99a]/40 text-[10px] font-black flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* WORKSHOP & RESTORATION CALLOUT */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#dfc99a]/30 bg-gradient-to-r from-[#06261b] via-[#041c14] to-[#02140e] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base">Snapped a string 10 mins before your match?</h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#dfc99a]/20 text-[#dfc99a] font-black uppercase tracking-wider">
                  Express Service
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#ede0c4]/80 max-w-xl leading-relaxed">
                Our front desk technicians provide calibrated electronic restringing and regripping in under 10 minutes. 
                Keep spare reels on file or select from Babolat, Wilson, and Yonex strings right at the counter.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3 text-xs text-[#ede0c4]">
            <div className="flex items-center gap-1.5 bg-[#02140e] px-3.5 py-2.5 rounded-xl border border-[#dfc99a]/20">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Collect at Front Desk</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#02140e] px-3.5 py-2.5 rounded-xl border border-[#dfc99a]/20">
              <ShieldCheck className="w-4 h-4 text-[#dfc99a]" />
              <span>100% Certified Genuine</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-[#dfc99a]/20 bg-[#041c14]/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] border-[#dfc99a] shadow-md shadow-[#dfc99a]/20'
                    : 'bg-[#02140e] text-[#ede0c4]/70 border-[#dfc99a]/15 hover:border-[#dfc99a]/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & In-Stock Toggle */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search rackets, balls, shoes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-xs text-white placeholder-[#ede0c4]/40 focus:outline-none focus:border-[#dfc99a]"
              />
              <Search className="w-3.5 h-3.5 text-[#dfc99a] absolute left-3 top-2.5" />
            </form>

            <label className="flex items-center gap-2 cursor-pointer bg-[#02140e] px-3 py-1.5 rounded-xl border border-[#dfc99a]/20 select-none text-xs text-[#ede0c4]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded accent-[#dfc99a] bg-[#041c14]"
              />
              <span className="text-[11px] font-semibold">In Stock Only</span>
            </label>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel rounded-2xl p-4 space-y-4 animate-pulse bg-[#041c14]">
                <div className="h-44 w-full bg-[#06261b] rounded-xl" />
                <div className="h-5 w-3/4 bg-[#06261b] rounded" />
                <div className="h-4 w-1/2 bg-[#06261b] rounded" />
                <div className="h-10 w-full bg-[#06261b] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="glass-panel p-8 rounded-2xl text-center space-y-3 border-rose-800/40 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm text-rose-300">{error}</p>
            <button
              type="button"
              onClick={fetchProducts}
              className="px-4 py-2 bg-[#06261b] text-xs font-semibold text-white rounded-xl hover:bg-[#0a3425] border border-[#dfc99a]/20"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Retry Catalog
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && products.length === 0 && (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-3 max-w-lg mx-auto">
            <Package className="w-12 h-12 text-[#dfc99a]/40 mx-auto" />
            <h4 className="text-white font-bold text-base">No Equipment Matches Found</h4>
            <p className="text-xs text-[#ede0c4]/70">
              Try adjusting your category filter or search keywords. New gear arrives weekly from official brands.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
                setInStockOnly(false);
              }}
              className="px-4 py-2 bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 rounded-xl text-xs font-bold hover:bg-[#dfc99a]/25"
            >
              Browse All Equipment
            </button>
          </div>
        )}

        {/* PRODUCTS GRID */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>

      {/* Mount All Modal Flows */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <OrderHistoryModal />
    </section>
  );
}
