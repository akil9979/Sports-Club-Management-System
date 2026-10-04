import React, { useState, useEffect, useCallback } from 'react';
import {
  getBarTables,
  getBarMenu,
  getBarOrders,
  createBarOrder,
  addItemsToBarOrder,
  updateBarOrderItem,
  updateKitchenStatus,
  settleBarOrder,
  resetInMemoryBarState
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
  CheckCircle2,
  AlertTriangle
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
  const [memberName, setMemberName] = useState('Walk-in Guest');
  const [memberId, setMemberId] = useState(null);

  // Edge case alerts
  const [tableActiveNotice, setTableActiveNotice] = useState(null);

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
  const [simulatePaymentFailure, setSimulatePaymentFailure] = useState(false);

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

  // Handle table selection (with "table already in active use" handling)
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setDraftItems([]);
    setTableActiveNotice(null);

    // Check if table has an active order running
    const existingOrder = orders.find((o) => o.tableId === table.id && o.status === 'open');
    if (existingOrder) {
      setTableActiveNotice(
        `Table #${table.number} is in active use with open tab #${existingOrder.id}. Running total: ₹${existingOrder.total}.`
      );
      if (existingOrder.membershipTier) {
        setMemberTier(existingOrder.membershipTier);
      }
      if (existingOrder.memberName) {
        setMemberName(existingOrder.memberName);
      }
      if (existingOrder.memberId) {
        setMemberId(existingOrder.memberId);
      }
    } else if (table.membershipTier) {
      setMemberTier(table.membershipTier);
      setMemberName(table.memberName || `${table.membershipTier} Member`);
      setMemberId(table.memberId || null);
    } else {
      setMemberTier('Guest');
      setMemberName('Walk-in Guest');
      setMemberId(null);
    }
  };

  // Add item from menu to draft tab
  const handleAddItemToTab = (item, quantity = 1) => {
    if (!selectedTable) {
      showToast('Validation Error: Please select a table first.');
      return;
    }

    // Validation: Positive quantity
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      showToast('Validation Error: Menu quantity must be a positive integer.');
      return;
    }

    // Validation: Do not add items after settlement
    if (activeOrderForTable && activeOrderForTable.status === 'settled') {
      showToast('Validation Error: Tab is already settled and closed. Clear table to start new tab.');
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

    showToast(`Added ${quantity}x ${item.name} to draft.`);
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

  // Update existing order item quantity via PATCH /api/bar/orders/:id/items/:itemId
  const handleUpdateExistingItemQty = async (orderId, itemId, newQty) => {
    if (newQty <= 0) {
      showToast('Validation Error: Item quantity must be positive.');
      return;
    }
    try {
      const res = await updateBarOrderItem(orderId, itemId, { quantity: newQty });
      if (res && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? res.order : o))
        );
        setTables((prev) =>
          prev.map((t) =>
            t.id === selectedTable.id ? { ...t, activeTabTotal: res.order.total } : t
          )
        );
        showToast('Updated item quantity.');
      }
    } catch (err) {
      showToast(`Error updating item: ${err.message}`);
    }
  };

  // Remove item from draft
  const handleRemoveDraftItem = (itemId) => {
    setDraftItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // Clear draft
  const handleClearDraft = () => {
    setDraftItems([]);
  };

  // Send order to kitchen (creates or updates tab)
  const handleSendOrderToKitchen = async () => {
    if (!selectedTable) {
      showToast('Validation Error: Selected table is required.');
      return;
    }
    if (draftItems.length === 0) {
      showToast('No items to send.');
      return;
    }

    // Validation: Do not add items after settlement
    if (activeOrderForTable && activeOrderForTable.status === 'settled') {
      showToast('Validation Error: Cannot add items to an already-settled order.');
      return;
    }

    setIsSendingOrder(true);
    try {
      // If order already exists, call POST /api/bar/orders/:id/items
      if (activeOrderForTable && activeOrderForTable.status === 'open') {
        const res = await addItemsToBarOrder(activeOrderForTable.id, draftItems);
        if (res && res.order) {
          setOrders((prev) =>
            prev.map((o) => (o.id === activeOrderForTable.id ? res.order : o))
          );
          setTables((prev) =>
            prev.map((t) =>
              t.id === selectedTable.id ? { ...t, activeTabTotal: res.order.total } : t
            )
          );
          setDraftItems([]);
          showToast(`Added ${draftItems.length} items to open tab #${activeOrderForTable.id}`);
        }
      } else {
        // Create new tab via POST /api/bar/orders
        const discountPercentage =
          memberTier === 'Gold' ? 15 : memberTier === 'Silver' || memberTier === 'Junior' ? 10 : 0;

        const orderPayload = {
          tableId: selectedTable.id,
          tableName: selectedTable.name,
          memberId: memberId || null,
          memberName: memberName || (memberTier !== 'Guest' ? `${memberTier} Member` : 'Walk-in Guest'),
          membershipTier: memberTier,
          discountPercentage,
          items: draftItems.map((d) => ({
            itemId: d.id,
            name: d.name,
            quantity: d.quantity,
            unitPrice: d.price,
            notes: d.notes || '',
            kitchenStatus: 'PENDING'
          }))
        };

        const res = await createBarOrder(orderPayload);
        if (res && res.order) {
          setOrders((prev) => [res.order, ...prev.filter((o) => o.id !== res.order.id)]);
          setTables((prev) =>
            prev.map((t) =>
              t.id === selectedTable.id
                ? {
                    ...t,
                    status: 'open',
                    currentOrderId: res.order.id,
                    activeTabTotal: res.order.total,
                    membershipTier: memberTier,
                    memberName
                  }
                : t
            )
          );
          setSelectedTable((prev) => ({
            ...prev,
            status: 'open',
            currentOrderId: res.order.id,
            activeTabTotal: res.order.total
          }));
          setDraftItems([]);
          showToast(`Opened tab #${res.order.id} for ${selectedTable.name}`);
        }
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
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
      showToast('Validation Error: Selected table required.');
      return;
    }
    if (!details || details.total <= 0) {
      showToast('Validation Error: Do not settle without valid order.');
      return;
    }
    setSettlementDetails(details);
    setSettlementModalOpen(true);
  };

  // Confirm settlement with payment failure simulation capability
  const handleConfirmSettlement = async (payload) => {
    if (!activeOrderForTable) {
      throw new Error('Validation Error: No active order to settle.');
    }

    if (simulatePaymentFailure) {
      throw new Error('Simulated Payment Gateway Error: Card / UPI transaction declined by bank.');
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
        setTableActiveNotice(null);
        showToast(`Tab #${activeOrderForTable.id} settled via ${payload.paymentMethod.toUpperCase()}`);
        return res;
      }
      return null;
    } finally {
      setIsSettling(false);
    }
  };

  // Select table by ID helper
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#041c14] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Edge Case Simulator Toolbar */}
      <div className="bg-[#041c14]/80 border border-emerald-900/50 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2 text-emerald-400/70">
          <Sliders className="w-4 h-4 text-[#dfc99a]" />
          <span className="font-semibold text-emerald-100">Operations & Edge Simulator:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Test Payment Failure */}
          <button
            type="button"
            onClick={() => setSimulatePaymentFailure(!simulatePaymentFailure)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              simulatePaymentFailure
                ? 'bg-rose-500 text-white shadow'
                : 'bg-[#07261c] text-emerald-200 hover:text-white border border-emerald-800/60'
            }`}
          >
            {simulatePaymentFailure ? 'Reset Payment Failure' : 'Test Payment Failure'}
          </button>

          {/* Toggle Simulated API Error */}
          <button
            type="button"
            onClick={() => {
              setSimulateError(!simulateError);
              setSimulateEmptyTables(false);
              setSimulateEmptyMenu(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              simulateError
                ? 'bg-rose-500 text-white shadow'
                : 'bg-[#07261c] text-emerald-200 hover:text-white border border-emerald-800/60'
            }`}
          >
            {simulateError ? 'Reset Network Error' : 'Test Network Failure'}
          </button>

          {/* Toggle Empty Tables */}
          <button
            type="button"
            onClick={() => {
              setSimulateEmptyTables(!simulateEmptyTables);
              setSimulateError(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              simulateEmptyTables
                ? 'btn-champagne shadow'
                : 'bg-[#07261c] text-emerald-200 hover:text-white border border-emerald-800/60'
            }`}
          >
            {simulateEmptyTables ? 'Restore Tables' : 'Test No Tables'}
          </button>

          {/* Toggle Empty Menu */}
          <button
            type="button"
            onClick={() => {
              setSimulateEmptyMenu(!simulateEmptyMenu);
              setSimulateError(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              simulateEmptyMenu
                ? 'btn-champagne shadow'
                : 'bg-[#07261c] text-emerald-200 hover:text-white border border-emerald-800/60'
            }`}
          >
            {simulateEmptyMenu ? 'Restore Menu' : 'Test No Menu'}
          </button>

          {/* Reset Demo Data */}
          <button
            type="button"
            onClick={() => {
              resetInMemoryBarState();
              setSimulateError(false);
              setSimulateEmptyTables(false);
              setSimulateEmptyMenu(false);
              setSimulatePaymentFailure(false);
              loadTables();
              loadMenu();
              loadOrders();
              showToast('Demo data and tabs reset to seed state.');
            }}
            className="px-2.5 py-1 bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 rounded-lg text-[11px] flex items-center gap-1 transition border border-emerald-800/60"
          >
            <RefreshCw className="w-3 h-3 text-[#dfc99a]" />
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Edge Case Alert: Table Already In Active Use */}
      {tableActiveNotice && (
        <div className="p-3 bg-[#07261c] border border-[#dfc99a]/40 rounded-xl flex items-center justify-between text-xs text-[#dfc99a]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#dfc99a] shrink-0" />
            <span>{tableActiveNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setTableActiveNotice(null)}
            className="text-emerald-200 hover:text-white text-[11px] px-2 py-0.5 rounded bg-[#02140e] border border-emerald-900/60"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Mode Tabs */}
      {activePortalTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4">
          {/* Left Column: Table Grid & Active Orders (1 col on lg, 4 cols on xl) */}
          <div className="lg:col-span-1 xl:col-span-4 space-y-4">
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
                  discountPercentage: order.discountPercentage,
                  tax: order.tax,
                  total: order.total,
                  memberTier: order.membershipTier || 'Guest',
                  memberName: order.memberName,
                  memberId: order.memberId
                });
              }}
              onRefresh={loadOrders}
            />
          </div>

          {/* Center Column: Menu & Category Panel (1 col on lg, 4 cols on xl) */}
          <div className="lg:col-span-1 xl:col-span-4">
            <MenuCategoryPanel
              menu={menu}
              loading={loadingMenu}
              error={apiError}
              selectedTable={selectedTable}
              onAddItemToTab={handleAddItemToTab}
              onRetry={loadMenu}
            />
          </div>

          {/* Right Column: Running Tab Summary & Settlement (2 cols on lg, 4 cols on xl) */}
          <div className="lg:col-span-2 xl:col-span-4">
            <TabSummary
              selectedTable={selectedTable}
              activeOrder={activeOrderForTable}
              draftItems={draftItems}
              memberTier={memberTier}
              memberName={memberName}
              memberId={memberId}
              onUpdateMemberTier={setMemberTier}
              onUpdateMemberInfo={({ id, name, tier }) => {
                setMemberId(id);
                setMemberName(name);
                setMemberTier(tier);
              }}
              onUpdateDraftItemQty={handleUpdateDraftItemQty}
              onUpdateExistingItemQty={handleUpdateExistingItemQty}
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
          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-sky-400" />
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#fcfaf5]">
                    Kitchen & Bar Expediter Display (KDS)
                  </h3>
                  <p className="text-xs text-emerald-300/70">
                    Live tickets queue for kitchen grill and main lounge bar
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full font-bold">
                {orders.filter((o) => o.status === 'open').length} Live Tickets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {orders
                .filter((o) => o.status === 'open')
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-emerald-900/50 bg-[#02140e]/80 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
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
                        <div key={i} className="flex justify-between items-center text-emerald-100">
                          <span className="font-mono font-bold text-white">
                            {item.quantity}x {item.name}
                          </span>
                          {item.notes && (
                            <span className="text-[10px] text-[#dfc99a] italic">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400/70 font-mono">
                        Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <div className="flex gap-2">
                        {order.kitchenStatus === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateKitchenStatus(order.id, 'PREPARING')}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition"
                          >
                            Start Prep
                          </button>
                        )}
                        {order.kitchenStatus === 'PREPARING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateKitchenStatus(order.id, 'READY')}
                            className="px-3 py-1 btn-emerald rounded-lg text-xs font-bold transition"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.kitchenStatus === 'READY' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateKitchenStatus(order.id, 'SERVED')}
                            className="px-3 py-1 btn-champagne rounded-lg text-xs font-bold transition"
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
        <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6 text-[#dfc99a]" />
              <div>
                <h3 className="text-lg font-serif font-bold text-[#fcfaf5]">
                  Settled Tabs & Payment Audit
                </h3>
                <p className="text-xs text-emerald-300/70">
                  Closed transactions, member discount ledger, and receipts audit
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#02140e] border-b border-emerald-900/40 text-emerald-400/70 uppercase font-mono text-[10px]">
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
              <tbody className="divide-y divide-emerald-900/30 font-mono">
                {orders
                  .filter((o) => o.status === 'settled')
                  .map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#07261c]/40 transition-colors">
                      <td className="p-3 font-bold text-white">{ord.id}</td>
                      <td className="p-3 text-emerald-200">{ord.tableName}</td>
                      <td className="p-3 text-emerald-100">{ord.memberName || 'Guest'}</td>
                      <td className="p-3">
                        <span className="text-[#dfc99a] font-semibold">
                          {ord.membershipTier || 'Guest'}
                        </span>
                      </td>
                      <td className="p-3 uppercase text-emerald-300">{ord.paymentMethod || 'card'}</td>
                      <td className="p-3 text-emerald-400/70">₹{ord.subtotal}</td>
                      <td className="p-3 text-emerald-400">-₹{ord.discountAmount || 0}</td>
                      <td className="p-3 font-bold text-[#dfc99a]">₹{ord.total}</td>
                      <td className="p-3 text-emerald-400/70">
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
