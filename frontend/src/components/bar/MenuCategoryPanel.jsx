import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, UtensilsCrossed, AlertTriangle, Clock } from 'lucide-react';

export default function MenuCategoryPanel({
  menu = [],
  loading = false,
  error = null,
  selectedTable = null,
  onAddItemToTab,
  onRetry
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState({});

  // Categories list
  const categories = useMemo(() => {
    const list = ['All'];
    menu.forEach((item) => {
      if (item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    return list;
  }, [menu]);

  // Filtered menu items
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [menu, activeCategory, searchQuery]);

  // Quantity helpers ensuring positive values
  const getQty = (itemId) => quantities[itemId] || 1;

  const updateQty = (itemId, delta) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 1;
      const next = current + delta;
      if (next < 1) return prev; // Enforce Menu quantity positive
      return { ...prev, [itemId]: next };
    });
  };

  const handleAdd = (item) => {
    const qty = getQty(item.id);
    if (qty <= 0) return; // Strict validation: Menu quantity positive
    onAddItemToTab(item, qty);
    // Reset quantity back to 1 after adding
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  if (loading) {
    return (
      <div className="bg-[#041c14]/90 rounded-3xl border border-emerald-900/40 p-5">
        <div className="h-10 bg-[#07261c] rounded-xl mb-4 animate-pulse" />
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-24 bg-[#07261c] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#07261c]/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <h4 className="text-base font-serif font-bold text-rose-200">Failed to Load Bar Menu</h4>
        <p className="text-sm text-rose-300/80 max-w-md mx-auto mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#041c14]/90 backdrop-blur-md rounded-3xl border border-emerald-900/40 p-5 shadow-xl flex flex-col h-full">
      {/* Search and Category Header */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#dfc99a]" />
            <h3 className="text-lg font-serif font-bold text-[#fcfaf5] tracking-wide">
              Bar & Kitchen Menu
            </h3>
          </div>
          <span className="text-xs text-emerald-400/80 font-mono">
            {filteredMenu.length} Items Available
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-500/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search beverages, cocktails, culinary items..."
            className="w-full pl-10 pr-4 py-2 bg-[#02140e]/90 border border-emerald-900/60 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-none focus:border-[#dfc99a] focus:ring-1 focus:ring-[#dfc99a]/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'btn-champagne font-bold'
                  : 'bg-[#07261c] text-emerald-300/80 hover:bg-[#0b3829] hover:text-white border border-emerald-900/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Table Alert / Validation Notice */}
      {!selectedTable && (
        <div className="mb-4 px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Select a table first from the left panel before adding items to tab.</span>
        </div>
      )}

      {/* Items Grid */}
      {filteredMenu.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 border border-dashed border-emerald-900/60 rounded-2xl bg-[#02140e]/40 text-center">
          <UtensilsCrossed className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="text-sm font-serif font-semibold text-emerald-200">No Menu Items Found</p>
          <p className="text-xs text-emerald-400/70 mt-1 max-w-xs">
            {searchQuery
              ? `No items match "${searchQuery}" in ${activeCategory}.`
              : `No items available in category ${activeCategory}.`}
          </p>
          {(searchQuery || activeCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="mt-3 px-3 py-1.5 bg-[#07261c] hover:bg-[#0b3829] text-xs text-emerald-200 rounded-lg transition border border-emerald-800/60"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[520px] pr-1">
          {filteredMenu.map((item) => {
            const qty = getQty(item.id);
            const isOutOfStock = !item.inStock || item.stock <= 0;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isOutOfStock
                    ? 'bg-[#02140e]/40 border-emerald-950 opacity-60'
                    : 'bg-[#02140e]/80 border-emerald-900/50 hover:border-[#dfc99a]/40 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-semibold text-[#fcfaf5] tracking-tight">
                          {item.name}
                        </h4>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-300/70 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-400/80">
                    <span className="bg-[#07261c] px-2 py-0.5 rounded-md text-emerald-300 border border-emerald-900/50">
                      {item.category}
                    </span>
                    {item.prepTimeMinutes && (
                      <span className="flex items-center gap-1 text-emerald-400/70">
                        <Clock className="w-3 h-3 text-emerald-500/70" />
                        {item.prepTimeMinutes}m
                      </span>
                    )}
                    {isOutOfStock ? (
                      <span className="text-rose-400 font-medium">Out of stock</span>
                    ) : (
                      <span className="text-emerald-500/80 font-mono">Stock: {item.stock}</span>
                    )}
                  </div>
                </div>

                {/* Price & Quantity Controls */}
                <div className="mt-3 pt-2.5 border-t border-emerald-900/40 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono font-bold text-white text-base">
                        ₹{item.price}
                      </span>
                      {item.memberPrice && (
                        <span className="text-[11px] font-mono text-[#dfc99a] font-medium">
                          (₹{item.memberPrice} Mbr)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Add Action */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-emerald-900/60 rounded-xl bg-[#07261c] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        disabled={qty <= 1 || isOutOfStock}
                        className="px-2 py-1 text-emerald-400 hover:text-white hover:bg-[#0b3829] disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 py-1 text-xs font-mono font-bold text-white min-w-6 text-center">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, 1)}
                        disabled={isOutOfStock}
                        className="px-2 py-1 text-emerald-400 hover:text-white hover:bg-[#0b3829] disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdd(item)}
                      disabled={isOutOfStock || !selectedTable}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm ${
                        isOutOfStock || !selectedTable
                          ? 'bg-[#07261c] text-emerald-600/60 cursor-not-allowed border border-emerald-900/40'
                          : 'btn-champagne active:scale-95'
                      }`}
                      title={!selectedTable ? 'Select a table first' : `Add ${qty} to Tab`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

