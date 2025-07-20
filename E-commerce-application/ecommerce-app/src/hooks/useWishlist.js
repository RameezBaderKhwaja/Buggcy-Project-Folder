"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Add this debug function at the top after imports
const debugWishlist = (action, productId, items) => {
  console.log(`🔍 WISHLIST DEBUG: ${action}`, {
    productId,
    currentItems: items?.map((i) => ({ id: i.id, title: i.title?.slice(0, 20) })),
    itemCount: items?.length || 0,
    timestamp: new Date().toLocaleTimeString(),
  })
}

// Wishlist service using Zustand
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: (product) => {
        const { items } = get()
        debugWishlist("ADD_ATTEMPT", product.id, items)

        const existingItem = items.find((item) => item.id === product.id)

        if (!existingItem) {
          const newItems = [...items, product]
          set({ items: newItems })
          debugWishlist("ADD_SUCCESS", product.id, newItems)
          return true
        }
        debugWishlist("ADD_ALREADY_EXISTS", product.id, items)
        return false
      },

      removeFromWishlist: (productId) => {
        const { items } = get()
        debugWishlist("REMOVE_ATTEMPT", productId, items)

        const newItems = items.filter((item) => item.id !== productId)
        set({ items: newItems })
        debugWishlist("REMOVE_SUCCESS", productId, newItems)
        return true
      },

      // FIXED: Add debug log to isInWishlist
      isInWishlist: (productId) => {
        const { items } = get()
        const exists = items.some((item) => item.id === productId)
        console.log(`🔍 WISHLIST DEBUG: CHECK_EXISTS for Product ID ${productId}: ${exists}`)
        return exists
      },

      clearWishlist: () => {
        debugWishlist("CLEAR_ALL", null, [])
        set({ items: [] })
      },

      getWishlistCount: () => {
        const { items } = get()
        return items.length
      },
    }),
    {
      name: "wishlist-storage",
      getStorage: () => localStorage,
      onRehydrateStorage: () => {
        console.log("🔄 WISHLIST: Starting rehydration...")
        return (state, error) => {
          if (error) {
            console.error("❌ WISHLIST: Rehydration error", error)
          } else {
            console.log("✅ WISHLIST: Rehydration complete", {
              itemCount: state?.items?.length || 0,
              items: state?.items?.map((i) => ({ id: i.id, title: i.title?.slice(0, 20) })) || [],
            })
          }
        }
      },
    },
  ),
)

// Export useWishlist for convenience, but encourage direct store selection for reactivity
export const useWishlist = () => {
  const { items, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist, getWishlistCount } = useWishlistStore()

  return {
    items,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    getWishlistCount,
  }
}
