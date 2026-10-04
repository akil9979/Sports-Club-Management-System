import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Package,
  Layers,
  ArrowUpDown,
  FileText,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X,
  ChevronRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventory,
  getLowStockItems,
  getStockMovements,
  recordStockMovement,
  getShopOrders,
  updateShopOrderStatus
} from '../../features/shop/shopApi.js';

export default function ShopInventoryWorkspace() {
  const { can, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Active sub-tab
  const [subTab, setSubTab] = useState('products'); // 'products' | 'inventory' | 'movements' | 'orders'

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Data states
  const [products, setProducts] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [movements, setMovements] = useState([]);
  const [orders, setOrders] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Product Form state
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Rackets',
    sku: '',
    price: '',
    memberPrice: '',
    stockQuantity: 10,
    lowStockThreshold: 5,
    description: '',
    isActive: true
  });

  // Stock Movement Form state
  const [movementForm, setMovementForm] = useState({
    productId: '',
    movementType: 'restock',
    quantity: 10,
    notes: ''
  });

  // Fetch all shop workspace datasets
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const [prodsRes, invRes, lowRes, movRes, ordRes] = await Promise.allSettled([
        getProducts(),
        can('inventory.view') ? getInventory() : Promise.resolve([]),
        can('inventory.view') ? getLowStockItems() : Promise.resolve([]),
        can('stock_movements.view') ? getStockMovements() : Promise.resolve([]),
        can('shop_orders.view') ? getShopOrders() : Promise.resolve([])
      ]);

      if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value || []);
      if (invRes.status === 'fulfilled') setInventoryList(invRes.value || []);
      if (lowRes.status === 'fulfilled') setLowStockList(lowRes.value || []);
      if (movRes.status === 'fulfilled') setMovements(movRes.value || []);
      if (ordRes.status === 'fulfilled') setOrders(ordRes.value || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to sync data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [can]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle open Add/Edit product modal
  const handleOpenProductModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name || '',
        category: prod.category || 'Rackets',
        sku: prod.sku || '',
        price: prod.price || '',
        memberPrice: prod.memberPrice || '',
        stockQuantity: prod.stock || prod.stockQuantity || 0,
        lowStockThreshold: prod.lowStockThreshold || 5,
        description: prod.description || '',
        isActive: prod.isActive !== false
      });
    } else {
      if (!isAdmin) {
        setFeedback({ type: 'error', message: 'Access Restricted: Adding new products to the catalogue is strictly restricted to Administrators.' });
        return;
      }
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: 'Rackets',
        sku: `PROD-${Date.now().toString().slice(-6)}`,
        price: '',
        memberPrice: '',
        stockQuantity: 10,
        lowStockThreshold: 5,
        description: '',
        isActive: true
      });
    }
    setIsProductModalOpen(true);
  };

  // Handle save product (Create / Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const payload = {
        name: productForm.name,
        category: productForm.category,
        sku: productForm.sku,
        price: parseFloat(productForm.price),
        memberPrice: productForm.memberPrice ? parseFloat(productForm.memberPrice) : null,
        description: productForm.description,
        isActive: productForm.isActive
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        setFeedback({ type: 'success', message: `Product '${payload.name}' updated successfully!` });
      } else {
        if (!isAdmin) {
          setFeedback({ type: 'error', message: 'Forbidden: Adding new products is restricted strictly to administrators.' });
          return;
        }
        await createProduct({
          ...payload,
          stockQuantity: parseInt(productForm.stockQuantity, 10) || 0,
          lowStockThreshold: parseInt(productForm.lowStockThreshold, 10) || 5
        });
        setFeedback({ type: 'success', message: `New product '${payload.name}' added to catalogue!` });
      }
      setIsProductModalOpen(false);
      loadData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    }
  };

  // Handle Delete/Archive Product
  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to deactivate or remove '${prod.name}'?`)) return;
    try {
      await deleteProduct(prod.id);
      setFeedback({ type: 'success', message: `Product '${prod.name}' successfully archived.` });
      loadData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete product' });
    }
  };

  // Handle open Stock Adjustment Modal
  const handleOpenStockModal = (prod = null) => {
    setSelectedStockProduct(prod);
    setMovementForm({
      productId: prod?.id || (products[0]?.id || ''),
      movementType: 'restock',
      quantity: 10,
      notes: ''
    });
    setIsStockModalOpen(true);
  };

  // Handle record stock movement
  const handleRecordMovement = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await recordStockMovement({
        productId: movementForm.productId,
        movementType: movementForm.movementType,
        quantity: parseInt(movementForm.quantity, 10),
        notes: movementForm.notes
      });
      setFeedback({ type: 'success', message: 'Inventory movement recorded successfully!' });
      setIsStockModalOpen(false);
      loadData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record movement' });
    }
  };

  // Handle Order Status Change
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateShopOrderStatus(orderId, newStatus);
      setFeedback({ type: 'success', message: `Order status updated to '${newStatus}'` });
      loadData(true);
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update order status' });
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      (p.name + ' ' + (p.sku || '') + ' ' + (p.category || ''))
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // Extract unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#041c14] border border-[#dfc99a]/30 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#dfc99a]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] flex items-center justify-center font-bold shadow-xl shadow-[#dfc99a]/15">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-black text-[#fcfaf5] tracking-tight">
                  Pro Shop & Commercial Inventory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 uppercase">
                  Central Club Store
                </span>
              </div>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                Manage club retail catalogue, real-time inventory adjustments, and member orders.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 transition disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#dfc99a]' : ''}`} />
            </button>

            {can('stock_movements.create') && (
              <button
                type="button"
                onClick={() => handleOpenStockModal()}
                className="px-3.5 py-2 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#dfc99a]" />
                <span>Record Movement</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2 rounded-xl btn-champagne text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#dfc99a]/15 hover:scale-105 transition-all"
                title="Add New Product (Admin Only)"
              >
                <Plus className="w-4 h-4 text-[#02140e]" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Low Stock Alert Banner (if applicable) */}
        {can('inventory.view') && lowStockList.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Low Stock Notice:</strong> {lowStockList.length} items require restock replenishment.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('inventory')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold border border-amber-500/40 text-[11px]"
            >
              View Low Stock
            </button>
          </div>
        )}

        {/* Workspace Tab Ribbon */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-emerald-900/40 overflow-x-auto text-xs pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSubTab('products')}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              subTab === 'products'
                ? 'bg-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/15'
                : 'text-emerald-300/80 hover:text-white hover:bg-[#07261c]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catalogue Products</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              subTab === 'products' ? 'bg-[#02140e]/20 text-[#02140e]' : 'bg-[#07261c] text-emerald-300'
            }`}>
              {products.length}
            </span>
          </button>

          {can('inventory.view') && (
            <button
              type="button"
              onClick={() => setSubTab('inventory')}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
                subTab === 'inventory'
                  ? 'bg-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/15'
                  : 'text-emerald-300/80 hover:text-white hover:bg-[#07261c]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stock & Inventory</span>
              {lowStockList.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                  {lowStockList.length}
                </span>
              )}
            </button>
          )}

          {can('stock_movements.view') && (
            <button
              type="button"
              onClick={() => setSubTab('movements')}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
                subTab === 'movements'
                  ? 'bg-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/15'
                  : 'text-emerald-300/80 hover:text-white hover:bg-[#07261c]'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Stock Movements Log</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'movements' ? 'bg-[#02140e]/20 text-[#02140e]' : 'bg-[#07261c] text-emerald-300'
              }`}>
                {movements.length}
              </span>
            </button>
          )}

          {can('shop_orders.view') && (
            <button
              type="button"
              onClick={() => setSubTab('orders')}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
                subTab === 'orders'
                  ? 'bg-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/15'
                  : 'text-emerald-300/80 hover:text-white hover:bg-[#07261c]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Shop Orders</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'orders' ? 'bg-[#02140e]/20 text-[#02140e]' : 'bg-[#07261c] text-emerald-300'
              }`}>
                {orders.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-emerald-400">
          <Loader2 className="w-8 h-8 text-[#dfc99a] animate-spin" />
          <span className="text-sm font-serif">Loading Shop Operations Data...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: PRODUCTS CATALOGUE */}
          {subTab === 'products' && (
            <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, SKU..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-xs text-white placeholder-emerald-700/60 focus:outline-none focus:border-[#dfc99a]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter products by category"
                    className="px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-xs text-white focus:outline-none focus:border-[#dfc99a] w-full sm:w-auto"
                  >
                    <option value="all">All Categories ({products.length})</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Table */}
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-emerald-500/70 text-xs">
                  No products found matching your search.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-900/40 text-emerald-400/70 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Product</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">SKU</th>
                        <th className="py-3 px-3">Retail Price</th>
                        <th className="py-3 px-3">Member Price</th>
                        <th className="py-3 px-3">Stock Units</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/30">
                      {filteredProducts.map((p) => {
                        const stockCount = p.stock !== undefined ? p.stock : (p.stockQuantity || 0);
                        const isLow = stockCount > 0 && stockCount <= (p.lowStockThreshold || 5);
                        const isOut = stockCount === 0;

                        return (
                          <tr key={p.id} className="hover:bg-[#07261c]/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">{p.name}</div>
                              {p.description && (
                                <p className="text-[10px] text-emerald-400/60 line-clamp-1 max-w-xs">
                                  {p.description}
                                </p>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-lg bg-[#07261c] text-emerald-300 border border-emerald-800/60 text-[10px]">
                                {p.category || 'General'}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-mono text-[11px] text-emerald-300/80">
                              {p.sku}
                            </td>

                            <td className="py-3 px-3 font-bold text-white">
                              ₹{Number(p.price).toLocaleString()}
                            </td>

                            <td className="py-3 px-3 font-bold text-[#dfc99a]">
                              {p.memberPrice ? `₹${Number(p.memberPrice).toLocaleString()}` : '—'}
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-300'}`}>
                                  {stockCount}
                                </span>
                                {isOut && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">
                                    OUT
                                  </span>
                                )}
                                {isLow && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                                    LOW
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.isActive !== false
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-700/40 text-slate-400 border border-slate-600/40'
                              }`}>
                                {p.isActive !== false ? 'Active' : 'Archived'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {can('inventory.update') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStockModal(p)}
                                    className="p-1.5 rounded-lg bg-[#07261c] hover:bg-[#0b3829] text-emerald-300 hover:text-[#dfc99a] border border-emerald-800/60 transition"
                                    title="Adjust Stock"
                                  >
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {can('products.update') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProductModal(p)}
                                    className="p-1.5 rounded-lg bg-[#07261c] hover:bg-[#0b3829] text-emerald-300 hover:text-white border border-emerald-800/60 transition"
                                    title="Edit Product"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {can('products.delete') && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p)}
                                    className="p-1.5 rounded-lg bg-[#07261c] hover:bg-rose-500/20 text-emerald-400 hover:text-rose-300 border border-emerald-800/60 transition"
                                    title="Deactivate / Archive Product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INVENTORY & STOCK */}
          {subTab === 'inventory' && can('inventory.view') && (
            <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#dfc99a]" />
                    <span>Real-time Warehouse Inventory</span>
                  </h3>
                  <p className="text-xs text-emerald-400/70 mt-0.5">
                    Continuous shelf tracking, safety thresholds, and reorder levels.
                  </p>
                </div>

                {can('stock_movements.create') && (
                  <button
                    type="button"
                    onClick={() => handleOpenStockModal()}
                    className="px-3 py-1.5 rounded-xl btn-champagne text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add / Adjust Stock</span>
                  </button>
                )}
              </div>

              {inventoryList.length === 0 && products.length === 0 ? (
                <div className="py-12 text-center text-emerald-500/70 text-xs">
                  No inventory data available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-900/40 text-emerald-400/70 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Item Name</th>
                        <th className="py-3 px-3">SKU</th>
                        <th className="py-3 px-3">Current Stock</th>
                        <th className="py-3 px-3">Low Threshold</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/30">
                      {(inventoryList.length > 0 ? inventoryList : products).map((item) => {
                        const count = item.quantityOnHand !== undefined ? item.quantityOnHand : (item.stock || item.stockQuantity || 0);
                        const threshold = item.lowStockThreshold || 5;
                        const isLow = count > 0 && count <= threshold;
                        const isOut = count === 0;

                        return (
                          <tr key={item.id} className="hover:bg-[#07261c]/40 transition-colors">
                            <td className="py-3 px-3 font-bold text-white">
                              {item.productName || item.name}
                            </td>
                            <td className="py-3 px-3 font-mono text-emerald-300/80">
                              {item.sku}
                            </td>
                            <td className="py-3 px-3 font-bold text-base text-white">
                              {count}
                            </td>
                            <td className="py-3 px-3 text-emerald-400/70">
                              {threshold}
                            </td>
                            <td className="py-3 px-3">
                              {isOut ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Low Stock Alert
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Optimal Stock
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {can('inventory.update') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenStockModal(item)}
                                  className="px-2.5 py-1 rounded-lg bg-[#07261c] hover:bg-[#0b3829] text-xs font-semibold text-[#dfc99a] border border-emerald-800/60"
                                >
                                  Adjust
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STOCK MOVEMENTS LOG */}
          {subTab === 'movements' && can('stock_movements.view') && (
            <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
              <div>
                <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#dfc99a]" />
                  <span>Audit Trail: Stock Movements</span>
                </h3>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  Historical log of stock receipts, customer sales, adjustments, and write-offs.
                </p>
              </div>

              {movements.length === 0 ? (
                <div className="py-12 text-center text-emerald-500/70 text-xs">
                  No stock movement history recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-900/40 text-emerald-400/70 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Product</th>
                        <th className="py-3 px-3">Movement Type</th>
                        <th className="py-3 px-3">Change Qty</th>
                        <th className="py-3 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/30">
                      {movements.map((m) => {
                        const isPositive = ['restock', 'return', 'audit_increase', 'intake'].includes(m.movementType);
                        return (
                          <tr key={m.id} className="hover:bg-[#07261c]/40 transition-colors">
                            <td className="py-3 px-3 text-emerald-300/80 font-mono text-[11px]">
                              {new Date(m.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-semibold text-white">
                              {m.productName || m.productId}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-lg bg-[#07261c] text-emerald-200 border border-emerald-800/60 uppercase font-mono text-[10px]">
                                {m.movementType}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold font-mono">
                              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                                {isPositive ? `+${m.quantity}` : `-${Math.abs(m.quantity)}`}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-emerald-400/70 text-[11px]">
                              {m.notes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SHOP ORDERS */}
          {subTab === 'orders' && can('shop_orders.view') && (
            <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
              <div>
                <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#dfc99a]" />
                  <span>Pro Shop Customer Orders</span>
                </h3>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  Fulfill member pickup and delivery requests, verify order contents, and update status.
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-emerald-500/70 text-xs">
                  No orders placed yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-900/40 text-emerald-400/70 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Order #</th>
                        <th className="py-3 px-3">Customer / Member</th>
                        <th className="py-3 px-3">Total Amount</th>
                        <th className="py-3 px-3">Payment</th>
                        <th className="py-3 px-3">Fulfillment Status</th>
                        <th className="py-3 px-3 text-right">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/30">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-[#07261c]/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-[#dfc99a]">
                            {o.orderNumber || o.id}
                          </td>
                          <td className="py-3 px-3 text-white">
                            <div className="font-semibold">{o.customerName || 'Club Member'}</div>
                            <div className="text-[10px] text-emerald-400/60">{o.customerEmail || ''}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            ₹{Number(o.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.paymentStatus === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {o.paymentStatus || 'unpaid'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#07261c] text-[#dfc99a] border border-[#dfc99a]/30">
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {can('shop_orders.update') ? (
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                aria-label={`Update status for order ${o.orderNumber || o.id}`}
                                className="px-2.5 py-1 rounded-lg bg-[#02140e] border border-emerald-800/60 text-xs text-white focus:outline-none focus:border-[#dfc99a]"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="fulfilled">Fulfilled</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className="text-emerald-700/60 text-[11px]">Read Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#02140e]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#041c14] border border-[#dfc99a]/40 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
              <h3 className="text-lg font-serif font-bold text-white">
                {editingProduct ? 'Edit Catalogue Product' : 'Add New Catalogue Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-emerald-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Wilson Pro Staff 97 Racket"
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                  >
                    <option value="Rackets">Rackets</option>
                    <option value="Balls">Balls</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Padel">Padel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="e.g. PROD-WILSON-97"
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Retail Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="12999"
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Member Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.memberPrice}
                    onChange={(e) => setProductForm({ ...productForm, memberPrice: e.target.value })}
                    placeholder="10399"
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-300 font-semibold mb-1">Initial Stock Units</label>
                    <input
                      type="number"
                      required
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-300 font-semibold mb-1">Low Stock Threshold</label>
                    <input
                      type="number"
                      required
                      value={productForm.lowStockThreshold}
                      onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Description</label>
                <textarea
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Brief specifications..."
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#07261c] text-emerald-300 hover:text-white border border-emerald-800/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-champagne font-bold text-[#02140e] shadow-lg shadow-[#dfc99a]/15"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT / MOVEMENT */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#02140e]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#041c14] border border-[#dfc99a]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#dfc99a]" />
                <span>Record Stock Movement</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="p-1 rounded-lg text-emerald-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Target Product</label>
                <select
                  value={movementForm.productId}
                  onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Movement Type</label>
                  <select
                    value={movementForm.movementType}
                    onChange={(e) => setMovementForm({ ...movementForm, movementType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                  >
                    <option value="restock">Restock Intake (+)</option>
                    <option value="damage">Damaged Write-off (-)</option>
                    <option value="write_off">General Write-off (-)</option>
                    <option value="return">Customer Return (+)</option>
                    <option value="audit_adjustment">Audit Correction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Audit Notes / Reference</label>
                <textarea
                  rows="2"
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="e.g. Shipment invoice #INV-4929 from distributor"
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#07261c] text-emerald-300 hover:text-white border border-emerald-800/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-champagne font-bold text-[#02140e] shadow-lg shadow-[#dfc99a]/15"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
