import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  AlertCircle, 
  RefreshCw, 
  Star, 
  Package, 
  Sparkles, 
  Wrench, 
  Truck, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import { getProducts } from '../../services/api.js';

export default function ShopCatalogueSection({ embedded = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Rackets', 'Balls', 'Shoes', 'Cricket', 'Accessories'];

  const fetchProducts = async (cat = activeCategory) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(cat);
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Could not load pro shop items. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory]);

  return (
    <section id="shop-section" className={`w-full ${embedded ? 'py-4' : 'py-20 bg-[#02140e] border-t border-[#dfc99a]/15'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/25 backdrop-blur-md">
            <ShoppingBag className="w-3.5 h-3.5 text-[#dfc99a]" />
            <span>The Pro Shop & Workshop Desk</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Championship Gear & In-House Workshop
          </h2>
          <p className="text-[#ede0c4]/80 text-sm sm:text-base leading-relaxed">
            Order online for instant counter pickup or club locker delivery. 
            Synchronized live shelf inventory, certified authenticity, and 10-minute restringing.
          </p>

          {/* Category Filter Chips */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pt-4 pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] border-[#dfc99a] shadow-md shadow-[#dfc99a]/20'
                    : 'bg-[#041c14] text-[#ede0c4]/70 border-[#dfc99a]/15 hover:border-[#dfc99a]/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* WORKSHOP & RESTORATION CALLOUT */}
        <div className="mb-12 glass-panel p-6 sm:p-8 rounded-3xl border border-[#dfc99a]/30 bg-gradient-to-r from-[#06261b] via-[#041c14] to-[#02140e] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
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
          <div className="shrink-0 flex items-center gap-4 text-xs text-[#ede0c4]">
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

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel rounded-2xl p-4 space-y-4 animate-pulse">
                <div className="h-44 w-full bg-[#06261b] rounded-xl"></div>
                <div className="h-5 w-3/4 bg-[#06261b] rounded"></div>
                <div className="h-4 w-1/2 bg-[#06261b] rounded"></div>
                <div className="h-10 w-full bg-[#06261b] rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="glass-panel p-6 rounded-2xl text-center space-y-3 border-rose-800/40 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm text-rose-300">{error}</p>
            <button
              onClick={() => fetchProducts(activeCategory)}
              className="px-4 py-2 bg-[#06261b] text-xs font-semibold text-white rounded-xl hover:bg-[#0a3425]"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Retry Catalog
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && products.length === 0 && (
          <div className="glass-panel p-10 rounded-2xl text-center space-y-3 max-w-lg mx-auto">
            <Package className="w-12 h-12 text-[#dfc99a]/40 mx-auto" />
            <h4 className="text-white font-bold text-base">No Items in this Category</h4>
            <p className="text-xs text-[#ede0c4]/70">
              New shipments of gear are arriving this week. Contact the desk to reserve custom equipment.
            </p>
            <button
              onClick={() => setActiveCategory('All')}
              className="px-4 py-2 bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 rounded-xl text-xs font-bold"
            >
              Browse All Gear
            </button>
          </div>
        )}

        {/* PRODUCTS GRID */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isOutOfStock = !product.inStock || product.stock === 0;
              const isLowStock = product.inStock && product.stock > 0 && product.stock <= 5;

              return (
                <div
                  key={product.id}
                  className="glass-panel rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#dfc99a]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                >
                  <div>
                    {/* Image Container with Badges */}
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-[#041c14]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#02140e] via-transparent to-transparent opacity-70" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#02140e]/90 backdrop-blur-md text-[#ede0c4] border border-[#dfc99a]/20 uppercase tracking-wider">
                          {product.category}
                        </span>
                        {product.badge && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] shadow-md">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      {/* Stock Pill */}
                      <div className="absolute top-3 right-3">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/90 backdrop-blur-md text-rose-300 border border-rose-800">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dfc99a]/20 backdrop-blur-md text-[#dfc99a] border border-[#dfc99a]/40 animate-pulse">
                            Only {product.stock} Left
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#02140e]/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                            In Stock ({product.stock})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-1 text-xs text-[#dfc99a] font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#dfc99a] text-[#dfc99a]" />
                        <span>{product.rating || '4.8'}</span>
                        <span className="text-[#ede0c4]/50 text-[10px]">• Pro Approved</span>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#dfc99a] transition-colors line-clamp-1">
                        {product.name}
                      </h4>

                      <p className="text-xs text-[#ede0c4]/70 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Pricing Comparison */}
                      <div className="pt-2 border-t border-[#dfc99a]/15 flex items-baseline justify-between">
                        <div>
                          <div className="text-[10px] text-[#ede0c4]/50 uppercase font-bold">Retail Rate</div>
                          <div className="text-sm font-medium text-[#ede0c4]/50 line-through">
                            ₹{product.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[#dfc99a] uppercase font-bold flex items-center gap-1 justify-end">
                            <Sparkles className="w-2.5 h-2.5 text-[#dfc99a]" />
                            Member Privilege
                          </div>
                          <div className="text-base font-black text-white">
                            ₹{product.memberPrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0">
                    <Link
                      to={`/enquiry?product=${encodeURIComponent(product.name)}&productId=${product.id}&intent=reserve_item`}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isOutOfStock
                          ? 'bg-[#041c14] text-[#ede0c4]/50 hover:text-white border border-[#dfc99a]/15'
                          : 'bg-[#dfc99a]/15 hover:bg-gradient-to-r hover:from-[#f7f1e3] hover:to-[#dfc99a] text-[#dfc99a] hover:text-[#02140e] border border-[#dfc99a]/30 shadow-sm'
                      }`}
                    >
                      {isOutOfStock ? (
                        <span>Enquire for Restock</span>
                      ) : (
                        <>
                          <span>Reserve for Pickup</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
