"use client"

import { useCartStore } from "@/services/cartService"
import { useCallback, useMemo } from "react"

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

  const cartOperations = useMemo(
    () => ({
      addToCart: addToCartStore,
      removeFromCart: removeFromCartStore,
      updateQuantity: updateQuantityStore,
      clearCart: clearCartStore,
    }),
    [addToCartStore, removeFromCartStore, updateQuantityStore, clearCartStore],
  )

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

  const isInCart = useCallback(
    (productId) => {
      return items.some((item) => item.id === productId)
    },
    [items],
  )

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
