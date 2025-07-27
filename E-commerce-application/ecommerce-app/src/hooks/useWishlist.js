"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Wishlist service using Zustand
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: (product) => {
        const { items } = get()

        const existingItem = items.find((item) => item.id === product.id)

        if (!existingItem) {
          const newItems = [...items, product]
          set({ items: newItems })
          return true
        }
        return false
      },

      removeFromWishlist: (productId) => {
        const { items } = get()

        const newItems = items.filter((item) => item.id !== productId)
        set({ items: newItems })
        return true
      },

      isInWishlist: (productId) => {
        const { items } = get()
        const exists = items.some((item) => item.id === productId)
        return exists
      },

      clearWishlist: () => {
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
