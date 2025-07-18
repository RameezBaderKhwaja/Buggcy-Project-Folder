"use client"

import useSWR from "swr"
import { useMemo, useCallback } from "react"
import { apiService } from "@/services/apiService"

// Custom hook for fetching and managing product data using SWR
export const useProducts = (category = null, searchTerm = "") => {
  // Fetcher function for SWR
  const fetcher = useCallback(async () => {
    if (category && category !== "all") {
      return await apiService.getProductsByCategory(category)
    }
    return await apiService.getProducts()
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
          const newProduct = await apiService.createProduct(productData)
          // Optimistically update the cache
          mutate([...products, newProduct], false)
          return newProduct
        } catch (error) {
          throw new Error("Failed to create product")
        }
      },

      // Update product
      updateProduct: async (id, productData) => {
        try {
          const updatedProduct = await apiService.updateProduct(id, productData)
          // Optimistically update the cache
          const updatedProducts = products.map((p) => (p.id === id ? updatedProduct : p))
          mutate(updatedProducts, false)
          return updatedProduct
        } catch (error) {
          throw new Error("Failed to update product")
        }
      },

      // Delete product
      deleteProduct: async (id) => {
        try {
          await apiService.deleteProduct(id)
          // Optimistically update the cache
          const filteredProducts = products.filter((p) => p.id !== id)
          mutate(filteredProducts, false)
          return true
        } catch (error) {
          throw new Error("Failed to delete product")
        }
      },

      // Refresh products
      refreshProducts: () => mutate(),
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
    return await apiService.getProduct(id)
  }, [id])

  const {
    data: product,
    error,
    isLoading,
    mutate,
  } = useSWR(id ? `/products/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300000, // 5 minutes
  })

  return {
    product,
    error,
    isLoading,
    refreshProduct: mutate,
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
