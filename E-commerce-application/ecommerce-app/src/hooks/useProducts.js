"use client"

import useSWR from "swr"
import { useMemo, useCallback } from "react"
import { apiService } from "@/services/apiService"

// Local storage key for persistent changes
const LOCAL_STORAGE_KEY = "shophub_local_products"

// Helper functions for local storage with enhanced debugging
const getLocalProducts = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : {}
    console.log("📦 Retrieved from localStorage:", parsed)
    return parsed
  } catch (error) {
    console.error("❌ Error reading localStorage:", error)
    return {}
  }
}

const setLocalProducts = (products) => {
  try {
    const stringified = JSON.stringify(products)
    localStorage.setItem(LOCAL_STORAGE_KEY, stringified)
    console.log("💾 Saved to localStorage:", products)
    console.log("🔑 localStorage key:", LOCAL_STORAGE_KEY)

    // Verify it was saved
    const verification = localStorage.getItem(LOCAL_STORAGE_KEY)
    console.log("✅ Verification - localStorage contains:", verification ? "DATA FOUND" : "NO DATA")
  } catch (error) {
    console.error("❌ Error saving to localStorage:", error)
  }
}

// Custom hook for fetching and managing product data using SWR
export const useProducts = (category = null, searchTerm = "") => {
  // Fetcher function for SWR
  const fetcher = useCallback(async () => {
    let apiProducts
    try {
      if (category && category !== "all") {
        apiProducts = await apiService.getProductsByCategory(category)
      } else {
        apiProducts = await apiService.getProducts()
      }
    } catch (apiError) {
      console.error("API fetch failed, attempting to use local data only:", apiError)
      apiProducts = [] // Fallback to empty array if API fails
    }

    // Merge with local changes
    const localProducts = getLocalProducts()

    // Apply local changes to API products
    const mergedProducts = apiProducts
      .map((product) => {
        const localProduct = localProducts[product.id]
        // FIXED: Ensure rating is always an object, even if API doesn't provide it
        const baseProduct = { ...product, rating: product.rating || { rate: 0, count: 0 } }

        if (localProduct) {
          if (localProduct.deleted) {
            return null // Mark for filtering
          }
          return { ...baseProduct, ...localProduct }
        }
        return baseProduct
      })
      .filter(Boolean) // Remove deleted products

    // Add locally created products
    const localCreated = Object.values(localProducts).filter((p) => p.isLocal && !p.deleted)

    return [...mergedProducts, ...localCreated]
  }, [category])

  // SWR hook for data fetching
  const {
    data: products,
    error,
    isLoading,
    mutate,
    isValidating,
  } = useSWR(category ? `/products/category/${category}` : "/products", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  })

  // Memoized filtered products based on search term
  const filteredProducts = useMemo(() => {
    if (!products) return []

    if (!searchTerm) return products

    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [products, searchTerm])

  // Memoized product operations
  const productOperations = useMemo(
    () => ({
      // Create product
      createProduct: async (productData) => {
        try {
          const newId = Date.now()
          const newProduct = {
            ...productData,
            id: newId,
            isLocal: true,
            rating: productData.rating || { rate: 0, count: 0 },
          }

          // Save to localStorage
          const localProducts = getLocalProducts()
          localProducts[newId] = newProduct
          setLocalProducts(localProducts)

          // Update cache
          const updatedProducts = [...(products || []), newProduct]
          mutate(updatedProducts, false)

          console.log("✅ Product created locally:", newProduct)
          return newProduct
        } catch (error) {
          console.error("❌ Failed to create product:", error)
          throw new Error("Failed to create product")
        }
      },

      // Update product - Enhanced with localStorage persistence and debugging
      updateProduct: async (id, productData) => {
        try {
          console.log("🔄 Starting product update:", id, productData)

          if (!products || !Array.isArray(products)) {
            throw new Error("Products not loaded")
          }

          const productId = Number.parseInt(id)

          // Find current product
          const currentProduct = products.find((p) => p.id === productId)
          if (!currentProduct) {
            throw new Error("Product not found")
          }

          console.log("📦 Current product:", currentProduct)

          // Create updated product with proper data types
          const updatedProduct = {
            ...currentProduct,
            title: productData.title || currentProduct.title,
            price: Number.parseFloat(productData.price) || currentProduct.price,
            description: productData.description || currentProduct.description,
            category: productData.category || currentProduct.category,
            image: productData.image || currentProduct.image,
            id: productId,
            // FIXED: Ensure rating is preserved and is an object
            rating: currentProduct.rating || { rate: 0, count: 0 },
          }

          console.log("✅ Updated product data:", updatedProduct)

          // Save to localStorage for persistence - ENHANCED DEBUGGING
          const localProducts = getLocalProducts()
          const productToSave = {
            ...updatedProduct,
            lastModified: Date.now(),
          }

          localProducts[productId] = productToSave
          console.log("💾 About to save to localStorage:", localProducts)

          setLocalProducts(localProducts)

          // Double check localStorage was updated
          const verifyStorage = getLocalProducts()
          console.log("🔍 Verification after save:", verifyStorage)

          // Update local cache immediately
          const updatedProductsInCache = products.map((p) => (p.id === productId ? updatedProduct : p))

          console.log(
            "🔄 Updating cache with:",
            updatedProductsInCache.find((p) => p.id === productId),
          )

          // Force cache update with revalidation disabled
          await mutate(updatedProductsInCache, false)

          // Also update single product cache if it exists
          mutate(`/products/${id}`, updatedProduct, false)

          console.log("✅ Cache updated successfully and saved to localStorage")

          // Send to API in background (won't persist due to FakeStoreAPI)
          try {
            await apiService.updateProduct(id, updatedProduct)
            console.log("📡 API update sent (won't persist due to FakeStoreAPI)")
          } catch (apiError) {
            console.warn("⚠️ API update failed, but local changes preserved:", apiError)
          }

          return updatedProduct
        } catch (error) {
          console.error("❌ Failed to update product:", error)
          throw new Error(`Failed to update product: ${error.message}`)
        }
      },

      // Delete product - Enhanced with localStorage persistence
      deleteProduct: async (id) => {
        try {
          const productId = Number.parseInt(id)

          // Mark as deleted in localStorage
          const localProducts = getLocalProducts()
          localProducts[productId] = {
            deleted: true,
            deletedAt: Date.now(),
          }
          setLocalProducts(localProducts)

          // Remove from cache immediately
          const filteredProducts = (products || []).filter((p) => p.id !== productId)
          mutate(filteredProducts, false)

          console.log("✅ Product deleted locally and will persist across refreshes")

          // Send to API in background (won't persist due to FakeStoreAPI)
          try {
            await apiService.deleteProduct(id)
            console.log("📡 API delete sent (won't persist due to FakeStoreAPI)")
          } catch (apiError) {
            console.warn("⚠️ API delete failed, but local changes preserved:", apiError)
          }

          return true
        } catch (error) {
          console.error("❌ Failed to delete product:", error)
          throw new Error("Failed to delete product")
        }
      },

      // Refresh products
      refreshProducts: () => mutate(),

      // Clear local changes (for testing)
      clearLocalChanges: () => {
        console.log("🧹 Clearing localStorage...")
        localStorage.removeItem(LOCAL_STORAGE_KEY)
        console.log("✅ localStorage cleared")
        mutate()
      },

      // Debug function to check localStorage
      debugLocalStorage: () => {
        console.log("🔍 DEBUG: Checking localStorage...")
        console.log("Key:", LOCAL_STORAGE_KEY)
        const data = localStorage.getItem(LOCAL_STORAGE_KEY)
        console.log("Raw data:", data)
        console.log("Parsed data:", data ? JSON.parse(data) : "No data found")

        // List all localStorage keys
        console.log("All localStorage keys:", Object.keys(localStorage))
      },
    }),
    [products, mutate],
  )

  return {
    products: filteredProducts,
    error,
    isLoading,
    isValidating,
    ...productOperations,
  }
}

// Hook for fetching a single product
export const useProduct = (id) => {
  const fetcher = useCallback(async () => {
    if (!id) return null

    // Check localStorage first
    const localProducts = getLocalProducts()
    const localProduct = localProducts[id]

    if (localProduct?.deleted) {
      return null // Product was deleted locally
    }

    let apiProduct
    try {
      apiProduct = await apiService.getProduct(id)
    } catch (error) {
      console.warn("Failed to fetch from API:", error)
      // If API fails, return local product if available, ensuring rating is an object
      return localProduct ? { ...localProduct, rating: localProduct.rating || { rate: 0, count: 0 } } : null
    }

    // Merge with local changes, ensuring rating is always an object
    const baseProduct = { ...apiProduct, rating: apiProduct.rating || { rate: 0, count: 0 } }

    if (localProduct && !localProduct.deleted) {
      return { ...baseProduct, ...localProduct }
    }

    return baseProduct
  }, [id])

  const {
    data: product,
    error,
    isLoading,
    mutate,
  } = useSWR(id ? `/products/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300000,
  })

  const updateProduct = useCallback(
    async (productData) => {
      if (!product) return null

      try {
        const productId = Number.parseInt(product.id)

        const mergedData = {
          ...product,
          ...productData,
          // FIXED: Ensure rating is preserved and is an object
          rating: product.rating || { rate: 0, count: 0 },
          id: productId,
        }

        // Save to localStorage
        const localProducts = getLocalProducts()
        localProducts[productId] = {
          ...mergedData,
          lastModified: Date.now(),
        }
        setLocalProducts(localProducts)

        // Update cache
        mutate(mergedData, false)

        // Send to API in background
        try {
          await apiService.updateProduct(product.id, mergedData)
        } catch (apiError) {
          console.warn("API update failed, but local changes preserved:", apiError)
        }

        return mergedData
      } catch (error) {
        console.error("Failed to update single product:", error)
        throw error
      }
    },
    [product, mutate],
  )

  return {
    product,
    error,
    isLoading,
    refreshProduct: mutate,
    updateProduct,
  }
}

// Hook for fetching categories
export const useCategories = () => {
  const {
    data: categories,
    error,
    isLoading,
  } = useSWR("/products/categories", apiService.getCategories, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 3600000,
  })

  return {
    categories: categories || [],
    error,
    isLoading,
  }
}
