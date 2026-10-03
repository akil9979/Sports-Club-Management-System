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
    <section id="shop-section" className={`w-full ${embedded ? 'py-4' : 'py-20 bg-slate-950 border-t border-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>The Champions Club Pro Shop</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Championship Gear & In-House Workshop
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Order from home for instant counter pickup or club locker delivery. 
            Same shelf inventory, exclusive member rates, and 10-minute racket restringing.
          </p>

          {/* Category Filter Chips */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pt-4 pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-bold'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* WORKSHOP & RESTORATION CALLOUT */}
        <div className="mb-12 glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-teal-950/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base">Snapped a string 10 mins before your match?</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">
                  Express Service
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Our front desk pro technicians provide rapid 10-minute restringing and regripping. 
                Keep spare reels on file or pick from Babolat, Wilson, and Yonex strings right at the counter.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Collect at Front Desk</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Genuine Certified</span>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-4 animate-pulse">
                <div className="h-44 w-full bg-slate-800 rounded-xl"></div>
                <div className="h-5 w-3/4 bg-slate-800 rounded"></div>
                <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
                <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
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
              className="px-4 py-2 bg-slate-800 text-xs font-semibold text-white rounded-xl hover:bg-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Retry Catalog
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && products.length === 0 && (
          <div className="glass-panel p-10 rounded-2xl text-center space-y-3 max-w-lg mx-auto border-slate-800">
            <Package className="w-12 h-12 text-slate-500 mx-auto" />
            <h4 className="text-white font-bold text-base">No Items in this Category</h4>
            <p className="text-xs text-slate-400">
              New shipments of gear are arriving this week. Contact the desk to reserve customized equipment.
            </p>
            <button
              onClick={() => setActiveCategory('All')}
              className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold"
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
                  className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                >
                  <div>
                    {/* Image Container with Badges */}
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700 uppercase tracking-wider">
                          {product.category}
                        </span>
                        {product.badge && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 shadow-md">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      {/* Stock Pill */}
                      <div className="absolute top-3 right-3">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 backdrop-blur-md text-rose-300 border border-rose-800">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 backdrop-blur-md text-amber-300 border border-amber-800 animate-pulse">
                            Only {product.stock} Left
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                            In Stock ({product.stock})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{product.rating || '4.8'}</span>
                        <span className="text-slate-500 text-[10px]">• Pro Approved</span>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {product.name}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Pricing Comparison */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Retail Price</div>
                          <div className="text-sm font-medium text-slate-400 line-through">
                            ₹{product.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1 justify-end">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            Member Price
                          </div>
                          <div className="text-base font-extrabold text-white">
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
                          ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30'
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
