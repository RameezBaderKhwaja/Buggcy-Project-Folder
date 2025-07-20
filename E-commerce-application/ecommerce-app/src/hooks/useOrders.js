"use client"

import { useOrderStore } from "@/services/orderService"

// Export useOrders for convenience, similar to useCart and useWishlist
export const useOrders = () => {
  const { orders, addOrder, updateOrderStatus, clearOrders, getOrderCount } = useOrderStore()

  return {
    orders,
    addOrder,
    updateOrderStatus,
    clearOrders,
    getOrderCount,
  }
}
