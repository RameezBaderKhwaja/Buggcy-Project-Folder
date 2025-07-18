"use client"

import { useCartStore } from "@/services/cartService"
import { useCallback, useMemo } from "react"

// Custom hook for managing cart state using Zustand
export const useCart = () => {
  const {
    items,
    total,
    itemCount,
    addToCart: addToCartStore,
    removeFromCart: removeFromCartStore,
    updateQuantity: updateQuantityStore,
    clearCart: clearCartStore,
  } = useCartStore()

  // Memoized cart operations
  const cartOperations = useMemo(
    () => ({
      addToCart: addToCartStore,
      removeFromCart: removeFromCartStore,
      updateQuantity: updateQuantityStore,
      clearCart: clearCartStore,
    }),
    [addToCartStore, removeFromCartStore, updateQuantityStore, clearCartStore],
  )

  // Memoized cart summary
  const cartSummary = useMemo(
    () => ({
      items,
      total,
      itemCount,
      isEmpty: items.length === 0,
      subtotal: total,
      tax: total * 0.08,
      grandTotal: total * 1.08,
    }),
    [items, total, itemCount],
  )

  // Callback to check if item is in cart
  const isInCart = useCallback(
    (productId) => {
      return items.some((item) => item.id === productId)
    },
    [items],
  )

  // Callback to get item quantity
  const getItemQuantity = useCallback(
    (productId) => {
      const item = items.find((item) => item.id === productId)
      return item ? item.quantity : 0
    },
    [items],
  )

  return {
    ...cartSummary,
    ...cartOperations,
    isInCart,
    getItemQuantity,
  }
}
