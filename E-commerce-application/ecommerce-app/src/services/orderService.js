"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Add this debug function at the top after imports
const debugOrders = (action, orderId, orders) => {
  console.log(`📦 ORDERS DEBUG: ${action}`, {
    orderId,
    currentOrders: orders?.map((o) => ({ id: o.orderId, total: o.total, status: o.status })),
    orderCount: orders?.length || 0,
    timestamp: new Date().toLocaleTimeString(),
  })
}

// Order service using Zustand
export const useOrderStore = create(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (order) => {
        const { orders } = get()
        debugOrders("ADD_ATTEMPT", order.orderId, orders)

        const newOrders = [...orders, order]
        set({ orders: newOrders })
        debugOrders("ADD_SUCCESS", order.orderId, newOrders)
        return true
      },

      // You can add other order-related actions here if needed, e.g., updateOrderStatus
      updateOrderStatus: (orderId, newStatus) => {
        const { orders } = get()
        const updatedOrders = orders.map((order) =>
          order.orderId === orderId ? { ...order, status: newStatus } : order,
        )
        set({ orders: updatedOrders })
        debugOrders("UPDATE_STATUS", orderId, updatedOrders)
      },

      clearOrders: () => {
        debugOrders("CLEAR_ALL", null, [])
        set({ orders: [] })
      },

      getOrderCount: () => {
        const { orders } = get()
        return orders.length
      },
    }),
    {
      name: "shophub-orders", // Unique name for localStorage
      getStorage: () => localStorage,
      onRehydrateStorage: () => {
        console.log("🔄 ORDERS: Starting rehydration...")
        return (state, error) => {
          if (error) {
            console.error("❌ ORDERS: Rehydration error", error)
          } else {
            console.log("✅ ORDERS: Rehydration complete", {
              orderCount: state?.orders?.length || 0,
              orders: state?.orders?.map((o) => ({ id: o.orderId, total: o.total, status: o.status })) || [],
            })
          }
        }
      },
    },
  ),
)

// Export useOrders for convenience
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
