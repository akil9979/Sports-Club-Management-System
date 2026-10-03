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
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5">
        <div className="h-10 bg-slate-800 rounded-xl mb-4 animate-skeleton" />
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-24 bg-slate-800 rounded-lg animate-skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-xl animate-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <h4 className="text-base font-semibold text-rose-200">Failed to Load Bar Menu</h4>
        <p className="text-sm text-rose-300/80 max-w-md mx-auto mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/90 p-5 shadow-xl flex flex-col h-full">
      {/* Search and Category Header */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              Bar & Kitchen Menu
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredMenu.length} Items Available
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drinks, cocktails, food by name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
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
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 text-center">
          <UtensilsCrossed className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">No Menu Items Found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
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
              className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg transition"
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
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isOutOfStock
                    ? 'bg-slate-950/40 border-slate-900 opacity-60'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-semibold text-white tracking-tight">
                          {item.name}
                        </h4>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                    <span className="bg-slate-800/70 px-2 py-0.5 rounded text-slate-300">
                      {item.category}
                    </span>
                    {item.prepTimeMinutes && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {item.prepTimeMinutes}m
                      </span>
                    )}
                    {isOutOfStock ? (
                      <span className="text-rose-400 font-medium">Out of stock</span>
                    ) : (
                      <span className="text-slate-500">Stock: {item.stock}</span>
                    )}
                  </div>
                </div>

                {/* Price & Quantity Controls */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono font-bold text-white text-base">
                        ₹{item.price}
                      </span>
                      {item.memberPrice && (
                        <span className="text-[11px] font-mono text-emerald-400 font-medium">
                          (₹{item.memberPrice} Mbr)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Add Action */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-800 rounded-lg bg-slate-900 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        disabled={qty <= 1 || isOutOfStock}
                        className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                        className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdd(item)}
                      disabled={isOutOfStock || !selectedTable}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        isOutOfStock || !selectedTable
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
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
