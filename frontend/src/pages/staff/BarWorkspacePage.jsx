import React, { useState, useEffect, useCallback } from 'react';
import {
  getBarTables,
  getBarMenu,
  getBarOrders,
  saveBarOrder,
  updateKitchenStatus,
  settleBarOrder
} from '../../features/bar/barApi.js';
import TableGrid from '../../components/bar/TableGrid.jsx';
import MenuCategoryPanel from '../../components/bar/MenuCategoryPanel.jsx';
import ActiveOrdersPanel from '../../components/bar/ActiveOrdersPanel.jsx';
import TabSummary from '../../components/bar/TabSummary.jsx';
import PaymentSettlementModal from '../../components/bar/PaymentSettlementModal.jsx';
import KitchenStatusBadge from '../../components/bar/KitchenStatusBadge.jsx';
import {
  Flame,
  Receipt,
  RefreshCw,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export default function BarWorkspacePage({ activePortalTab = 'pos' }) {
  // State for core data
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);

  // Loading & error states
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Active POS workspace selection
  const [selectedTable, setSelectedTable] = useState(null);
  const [draftItems, setDraftItems] = useState([]);
  const [memberTier, setMemberTier] = useState('Guest');

  // Settlement modal state
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementDetails, setSettlementDetails] = useState(null);
  const [isSettling, setIsSettling] = useState(false);
  const [isSendingOrder, setIsSendingOrder] = useState(false);

  // Success toast/notification
  const [toastMessage, setToastMessage] = useState(null);

  // Edge case test simulation flags
  const [simulateError, setSimulateError] = useState(false);
  const [simulateEmptyTables, setSimulateEmptyTables] = useState(false);
  const [simulateEmptyMenu, setSimulateEmptyMenu] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Tables
  const loadTables = useCallback(async () => {
    if (simulateError) {
      setLoadingTables(false);
      setApiError('Simulated network error: HTTP 503 Service Unavailable');
      return;
    }
    if (simulateEmptyTables) {
      setLoadingTables(false);
      setTables([]);
      return;
    }

    try {
      setLoadingTables(true);
      setApiError(null);
      const data = await getBarTables();
      setTables(data);
    } catch (err) {
      setApiError(err.message || 'Failed to load tables');
    } finally {
      setLoadingTables(false);
    }
  }, [simulateError, simulateEmptyTables]);

  // Fetch Menu
  const loadMenu = useCallback(async () => {
    if (simulateError) {
      setLoadingMenu(false);
      return;
    }
    if (simulateEmptyMenu) {
      setLoadingMenu(false);
      setMenu([]);
      return;
    }

    try {
      setLoadingMenu(true);
      const data = await getBarMenu();
      setMenu(data);
    } catch (err) {
      console.error('Menu load error:', err);
    } finally {
      setLoadingMenu(false);
    }
  }, [simulateError, simulateEmptyMenu]);

  // Fetch Orders
  const loadOrders = useCallback(async () => {
    if (simulateError) {
      setLoadingOrders(false);
      return;
    }

    try {
      setLoadingOrders(true);
      const data = await getBarOrders();
      setOrders(data);
    } catch (err) {
      console.error('Orders load error:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [simulateError]);

  // Initial load
  useEffect(() => {
    loadTables();
    loadMenu();
    loadOrders();
  }, [loadTables, loadMenu, loadOrders]);

  // Find active order for selected table
  const activeOrderForTable = selectedTable
    ? orders.find((o) => o.tableId === selectedTable.id && o.status === 'open') ||
      orders.find((o) => o.tableId === selectedTable.id && o.status === 'settled')
    : null;

  // Handle table selection
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setDraftItems([]);

    // Check if table has a seated member with tier
    if (table.membershipTier) {
      setMemberTier(table.membershipTier);
    } else {
      const order = orders.find((o) => o.tableId === table.id && o.status === 'open');
      if (order && order.membershipTier) {
        setMemberTier(order.membershipTier);
      } else {
        setMemberTier('Guest');
      }
    }
  };

  // Add item from menu to draft tab
  const handleAddItemToTab = (item, quantity = 1) => {
    if (!selectedTable) {
      showToast('Validation Error: Please select a table first.');
      return;
    }
    if (quantity <= 0) {
      showToast('Validation Error: Menu quantity must be positive.');
      return;
    }

    setDraftItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          unitPrice: item.price,
          quantity,
          notes: ''
        }
      ];
    });

    showToast(`Added ${quantity}x ${item.name} to tab.`);
  };

  // Update draft item quantity
  const handleUpdateDraftItemQty = (itemId, delta) => {
    setDraftItems((prev) => {
      return prev
        .map((it) => {
          if (it.id === itemId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean);
    });
  };

  // Remove item from draft
  const handleRemoveDraftItem = (itemId) => {
    setDraftItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // Clear draft
  const handleClearDraft = () => {
    setDraftItems([]);
  };

  // Send order to kitchen
  const handleSendOrderToKitchen = async () => {
    if (!selectedTable) {
      showToast('Validation Error: Selected table is required.');
      return;
    }
    if (draftItems.length === 0) {
      showToast('No items to send.');
      return;
    }

    setIsSendingOrder(true);
    try {
      const existingItems = activeOrderForTable?.items || [];
      const formattedDrafts = draftItems.map((d) => ({
        itemId: d.id,
        name: d.name,
        quantity: d.quantity,
        unitPrice: d.price,
        notes: d.notes || '',
        kitchenStatus: 'PENDING'
      }));

      const combinedItems = [...existingItems, ...formattedDrafts];
      const subtotal = combinedItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);

      const discountPercentage =
        memberTier === 'Gold' ? 15 : memberTier === 'Silver' || memberTier === 'Junior' ? 10 : 0;
      const discountAmount = Math.round((subtotal * discountPercentage) / 100);
      const tax = Math.round((subtotal - discountAmount) * 0.05);
      const total = subtotal - discountAmount + tax;

      const orderPayload = {
        id: activeOrderForTable?.id || `ORD-${Date.now().toString().slice(-4)}`,
        tableId: selectedTable.id,
        tableName: selectedTable.name,
        status: 'open',
        kitchenStatus: 'PENDING',
        memberId: selectedTable.memberId || null,
        memberName: selectedTable.memberName || (memberTier !== 'Guest' ? `${memberTier} Member` : 'Walk-in Guest'),
        membershipTier: memberTier,
        discountPercentage,
        discountAmount,
        tax,
        subtotal,
        total,
        items: combinedItems,
        createdAt: activeOrderForTable?.createdAt || new Date().toISOString()
      };

      const res = await saveBarOrder(orderPayload);
      if (res && res.order) {
        // Update orders list
        setOrders((prev) => {
          const index = prev.findIndex((o) => o.id === res.order.id);
          if (index > -1) {
            const next = [...prev];
            next[index] = res.order;
            return next;
          }
          return [res.order, ...prev];
        });

        // Update tables list
        setTables((prev) =>
          prev.map((t) => {
            if (t.id === selectedTable.id) {
              return {
                ...t,
                status: 'open',
                currentOrderId: res.order.id,
                activeTabTotal: res.order.total,
                membershipTier: memberTier
              };
            }
            return t;
          })
        );

        setSelectedTable((prev) => ({
          ...prev,
          status: 'open',
          currentOrderId: res.order.id,
          activeTabTotal: res.order.total
        }));

        setDraftItems([]);
        showToast(`Order #${res.order.id} sent to kitchen/bar!`);
      }
    } catch (err) {
      showToast(`Failed to send order: ${err.message}`);
    } finally {
      setIsSendingOrder(false);
    }
  };

  // Update kitchen status
  const handleUpdateKitchenStatus = async (orderId, nextStatus) => {
    try {
      const res = await updateKitchenStatus(orderId, nextStatus);
      if (res) {
        setOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === orderId) {
              return { ...ord, kitchenStatus: nextStatus };
            }
            return ord;
          })
        );
        showToast(`Order #${orderId} marked as ${nextStatus}`);
      }
    } catch (err) {
      showToast(`Error updating status: ${err.message}`);
    }
  };

  // Open settlement modal
  const handleOpenSettlement = (details) => {
    if (!selectedTable) {
      showToast('Validation: Selected table required.');
      return;
    }
    if (!details || details.total <= 0) {
      showToast('Validation: Do not settle without valid order.');
      return;
    }
    setSettlementDetails(details);
    setSettlementModalOpen(true);
  };

  // Confirm settlement
  const handleConfirmSettlement = async (payload) => {
    if (!activeOrderForTable) {
      showToast('Validation: No active order to settle.');
      return null;
    }

    setIsSettling(true);
    try {
      const res = await settleBarOrder(activeOrderForTable.id, {
        paymentMethod: payload.paymentMethod,
        amountPaid: payload.grandTotal,
        tip: payload.tipAmount
      });

      if (res && res.success) {
        // Mark order as settled
        setOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === activeOrderForTable.id) {
              return {
                ...ord,
                status: 'settled',
                kitchenStatus: 'SERVED',
                settledAt: res.settledAt,
                paymentMethod: res.paymentMethod
              };
            }
            return ord;
          })
        );

        // Update table to available
        setTables((prev) =>
          prev.map((t) => {
            if (t.id === selectedTable.id) {
              return {
                ...t,
                status: 'available',
                currentOrderId: null,
                activeTabTotal: 0,
                memberId: null,
                memberName: null,
                membershipTier: null
              };
            }
            return t;
          })
        );

        setSelectedTable((prev) => ({
          ...prev,
          status: 'available',
          currentOrderId: null,
          activeTabTotal: 0
        }));

        setDraftItems([]);
        showToast(`Table #${selectedTable.number} tab settled via ${payload.paymentMethod.toUpperCase()}`);
        return res;
      }
      return null;
    } catch (err) {
      showToast(`Settlement error: ${err.message}`);
      return null;
    } finally {
      setIsSettling(false);
    }
  };

  // Helper to select table by ID from active orders panel
  const handleSelectTableById = (tableId) => {
    const target = tables.find((t) => t.id === tableId);
    if (target) {
      handleSelectTable(target);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Simulator Toolbar for Edge Cases Testing */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Edge Case Simulator:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Simulated Error */}
          <button
            onClick={() => {
              setSimulateError(!simulateError);
              setSimulateEmptyTables(false);
              setSimulateEmptyMenu(false);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              simulateError
                ? 'bg-rose-500 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {simulateError ? 'Reset API Failure' : 'Test API Failure'}
          </button>

          {/* Toggle Empty Tables */}
          <button
            onClick={() => {
              setSimulateEmptyTables(!simulateEmptyTables);
              setSimulateError(false);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              simulateEmptyTables
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {simulateEmptyTables ? 'Restore Tables' : 'Test No Tables'}
          </button>

          {/* Toggle Empty Menu */}
          <button
            onClick={() => {
              setSimulateEmptyMenu(!simulateEmptyMenu);
              setSimulateError(false);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              simulateEmptyMenu
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {simulateEmptyMenu ? 'Restore Menu' : 'Test No Menu'}
          </button>

          {/* Refresh all */}
          <button
            onClick={() => {
              setSimulateError(false);
              setSimulateEmptyTables(false);
              setSimulateEmptyMenu(false);
              loadTables();
              loadMenu();
              loadOrders();
              showToast('Refreshed from live bar API endpoints.');
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px] flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Main Workspace Mode Tabs */}
      {activePortalTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Table Grid & Active Orders (5 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <TableGrid
              tables={tables}
              selectedTable={selectedTable}
              onSelectTable={handleSelectTable}
              loading={loadingTables}
              error={apiError}
              onRetry={loadTables}
            />

            <ActiveOrdersPanel
              orders={orders}
              loading={loadingOrders}
              error={apiError}
              selectedTable={selectedTable}
              onSelectTableById={handleSelectTableById}
              onUpdateKitchenStatus={handleUpdateKitchenStatus}
              onProceedToSettle={(order) => {
                const tbl = tables.find((t) => t.id === order.tableId);
                if (tbl) setSelectedTable(tbl);
                handleOpenSettlement({
                  subtotal: order.subtotal,
                  discountAmount: order.discountAmount,
                  tax: order.tax,
                  total: order.total,
                  memberTier: order.membershipTier || 'Guest'
                });
              }}
              onRefresh={loadOrders}
            />
          </div>

          {/* Center Column: Menu & Category Panel (5 cols) */}
          <div className="lg:col-span-5">
            <MenuCategoryPanel
              menu={menu}
              loading={loadingMenu}
              error={apiError}
              selectedTable={selectedTable}
              onAddItemToTab={handleAddItemToTab}
              onRetry={loadMenu}
            />
          </div>

          {/* Right Column: Running Tab Summary & Settlement (3 cols) */}
          <div className="lg:col-span-3">
            <TabSummary
              selectedTable={selectedTable}
              activeOrder={activeOrderForTable}
              draftItems={draftItems}
              memberTier={memberTier}
              onUpdateMemberTier={setMemberTier}
              onUpdateDraftItemQty={handleUpdateDraftItemQty}
              onRemoveDraftItem={handleRemoveDraftItem}
              onClearDraft={handleClearDraft}
              onSendOrderToKitchen={handleSendOrderToKitchen}
              onOpenSettlement={handleOpenSettlement}
              isSendingOrder={isSendingOrder}
            />
          </div>
        </div>
      )}

      {/* KDS (Kitchen Display System) Full View */}
      {activePortalTab === 'kds' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-sky-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Kitchen & Bar Expediter Display (KDS)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live tickets queue for kitchen grill and main lounge bar
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-full">
                {orders.filter((o) => o.status === 'open').length} Live Tickets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {orders
                .filter((o) => o.status === 'open')
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-mono font-bold text-white text-base">
                          {order.id}
                        </span>
                        <div className="text-xs font-semibold text-emerald-400">
                          {order.tableName}
                        </div>
                      </div>
                      <KitchenStatusBadge status={order.kitchenStatus} size="md" />
                    </div>

                    <div className="space-y-2 py-1 text-xs">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-slate-300">
                          <span className="font-mono font-bold text-white">
                            {item.quantity}x {item.name}
                          </span>
                          {item.notes && (
                            <span className="text-[10px] text-amber-400 italic">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <div className="flex gap-2">
                        {order.kitchenStatus === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateKitchenStatus(order.id, 'PREPARING')}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition"
                          >
                            Start Prep
                          </button>
                        )}
                        {order.kitchenStatus === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateKitchenStatus(order.id, 'READY')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.kitchenStatus === 'READY' && (
                          <button
                            onClick={() => handleUpdateKitchenStatus(order.id, 'SERVED')}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
                          >
                            Mark Served
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Settled Orders Audit Tab */}
      {activePortalTab === 'audit' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  Settled Tabs & Payment Audit
                </h3>
                <p className="text-xs text-slate-400">
                  Closed transactions, member discount ledger, and receipts audit
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Table</th>
                  <th className="p-3">Guest / Member</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Total Paid</th>
                  <th className="p-3">Settled At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {orders
                  .filter((o) => o.status === 'settled')
                  .map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{ord.id}</td>
                      <td className="p-3 text-slate-300">{ord.tableName}</td>
                      <td className="p-3 text-slate-300">{ord.memberName || 'Guest'}</td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-semibold">
                          {ord.membershipTier || 'Guest'}
                        </span>
                      </td>
                      <td className="p-3 uppercase text-slate-300">{ord.paymentMethod || 'card'}</td>
                      <td className="p-3 text-slate-400">₹{ord.subtotal}</td>
                      <td className="p-3 text-emerald-400">-₹{ord.discountAmount || 0}</td>
                      <td className="p-3 font-bold text-emerald-400">₹{ord.total}</td>
                      <td className="p-3 text-slate-400">
                        {ord.settledAt ? new Date(ord.settledAt).toLocaleTimeString() : 'Recently'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Settlement Modal */}
      <PaymentSettlementModal
        isOpen={settlementModalOpen}
        onClose={() => setSettlementModalOpen(false)}
        selectedTable={selectedTable}
        activeOrder={activeOrderForTable}
        settlementDetails={settlementDetails}
        onConfirmSettlement={handleConfirmSettlement}
        isSettling={isSettling}
      />
    </div>
  );
}
