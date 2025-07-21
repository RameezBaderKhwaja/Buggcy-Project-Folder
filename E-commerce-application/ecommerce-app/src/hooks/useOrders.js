"use client"

import { useOrderStore } from "@/services/orderService"

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
