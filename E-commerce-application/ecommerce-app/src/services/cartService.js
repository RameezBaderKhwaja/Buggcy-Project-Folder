import { create } from "zustand"
import { persist } from "zustand/middleware"

// Cart service using Zustand
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      // Add item to cart
      addToCart: (product) => {
        const { items } = get()
        const existingItem = items.find((item) => item.id === product.id)

        let newItems
        if (existingItem) {
          newItems = items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        } else {
          newItems = [...items, { ...product, quantity: 1 }]
        }

        const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

        set({ items: newItems, total, itemCount })
      },

      // Remove item from cart
      removeFromCart: (productId) => {
        const { items } = get()
        const newItems = items.filter((item) => item.id !== productId)
        const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

        set({ items: newItems, total, itemCount })
      },

      // Update item quantity
      updateQuantity: (productId, quantity) => {
        const { items } = get()
        const newItems = items
          .map((item) => (item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item))
          .filter((item) => item.quantity > 0)

        const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

        set({ items: newItems, total, itemCount })
      },

      // Clear cart
      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 })
      },

      // Get cart summary
      getCartSummary: () => {
        const { items, total, itemCount } = get()
        return { items, total, itemCount }
      },
    }),
    {
      name: "shopping-cart",
      getStorage: () => localStorage,
    },
  ),
)

// Cart service functions
export const cartService = {
  addToCart: (product) => useCartStore.getState().addToCart(product),
  removeFromCart: (productId) => useCartStore.getState().removeFromCart(productId),
  updateQuantity: (productId, quantity) => useCartStore.getState().updateQuantity(productId, quantity),
  clearCart: () => useCartStore.getState().clearCart(),
  getCartSummary: () => useCartStore.getState().getCartSummary(),
}
