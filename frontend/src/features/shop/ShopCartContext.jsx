import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredCart, saveStoredCart, clearStoredCart } from './shopApi.js';

const ShopCartContext = createContext(null);

export function ShopCartProvider({ children }) {
  const [cart, setCart] = useState(() => getStoredCart());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [activeOrderConfirmation, setActiveOrderConfirmation] = useState(null);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    saveStoredCart(cart);
  }, [cart]);

  const addToCart = useCallback((product, quantity = 1) => {
    if (!product || !product.id) return { success: false, message: 'Invalid product' };
    const numQty = parseInt(quantity, 10);
    if (!Number.isInteger(numQty) || numQty <= 0) {
      return { success: false, message: 'Quantity must be greater than zero' };
    }

    const availableStock = product.stock !== undefined ? product.stock : 999;
    if (availableStock <= 0) {
      return { success: false, message: `'${product.name}' is currently out of stock` };
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const existingItem = prevCart[existingIndex];
        const newQty = existingItem.quantity + numQty;
        const cappedQty = Math.min(newQty, availableStock);
        const updated = [...prevCart];
        updated[existingIndex] = { ...existingItem, quantity: cappedQty, product };
        return updated;
      } else {
        const initialQty = Math.min(numQty, availableStock);
        return [...prevCart, { product, quantity: initialQty }];
      }
    });

    return { success: true, message: `Added ${product.name} to cart` };
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    const numQty = parseInt(quantity, 10);
    if (!Number.isInteger(numQty) || numQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock !== undefined ? item.product.stock : 999;
          const safeQty = Math.min(numQty, maxStock);
          return { ...item, quantity: safeQty };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    clearStoredCart();
  }, []);

  const totalCartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  return (
    <ShopCartContext.Provider
      value={{
        cart,
        totalCartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isOrderHistoryOpen,
        setIsOrderHistoryOpen,
        selectedProductForDetail,
        setSelectedProductForDetail,
        activeOrderConfirmation,
        setActiveOrderConfirmation,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </ShopCartContext.Provider>
  );
}

export function useShopCart() {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error('useShopCart must be used within a ShopCartProvider');
  }
  return context;
}
