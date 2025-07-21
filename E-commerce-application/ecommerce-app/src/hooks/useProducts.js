"use client"

import useSWR from "swr"
import { useMemo, useCallback } from "react"
import { apiService } from "@/services/apiService"

const LOCAL_STORAGE_KEY = "shophub_local_products"

const getLocalProducts = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    return {}
  }
}

const setLocalProducts = (products) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products))
  } catch (error) {
  }
}

export const useProducts = (category = null, searchTerm = "") => {
  const fetcher = useCallback(async () => {
    let apiProducts
    try {
      if (category && category !== "all") {
        apiProducts = await apiService.getProductsByCategory(category)
      } else {
        apiProducts = await apiService.getProducts()
      }
    } catch (apiError) {
      apiProducts = []
    }

    const localProducts = getLocalProducts()

    const mergedProducts = apiProducts
      .map((product) => {
        const localProduct = localProducts[product.id]
        const baseProduct = { ...product, rating: product.rating || { rate: 0, count: 0 } }

        if (localProduct) {
          if (localProduct.deleted) {
            return null
          }
          return { ...baseProduct, ...localProduct }
        }
        return baseProduct
      })
      .filter(Boolean)

    const localCreated = Object.values(localProducts).filter((p) => p.isLocal && !p.deleted)

    return [...mergedProducts, ...localCreated]
  }, [category])

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

  const filteredProducts = useMemo(() => {
    if (!products) return []

    if (!searchTerm) return products

    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [products, searchTerm])

  const productOperations = useMemo(
    () => ({
      createProduct: async (productData) => {
        try {
          const newId = Date.now()
          const newProduct = {
            ...productData,
            id: newId,
            isLocal: true,
            rating: productData.rating || { rate: 0, count: 0 },
          }

          const localProducts = getLocalProducts()
          localProducts[newId] = newProduct
          setLocalProducts(localProducts)

          const updatedProducts = [...(products || []), newProduct]
          mutate(updatedProducts, false)

          return newProduct
        } catch (error) {
          throw new Error("Failed to create product")
        }
      },

      updateProduct: async (id, productData) => {
        try {
          if (!products || !Array.isArray(products)) {
            throw new Error("Products not loaded")
          }

          const productId = Number.parseInt(id)
          const currentProduct = products.find((p) => p.id === productId)
          if (!currentProduct) {
            throw new Error("Product not found")
          }

          const updatedProduct = {
            ...currentProduct,
            title: productData.title || currentProduct.title,
            price: Number.parseFloat(productData.price) || currentProduct.price,
            description: productData.description || currentProduct.description,
            category: productData.category || currentProduct.category,
            image: productData.image || currentProduct.image,
            id: productId,
            rating: currentProduct.rating || { rate: 0, count: 0 },
          }

          const localProducts = getLocalProducts()
          const productToSave = {
            ...updatedProduct,
            lastModified: Date.now(),
          }

          localProducts[productId] = productToSave
          setLocalProducts(localProducts)

          const updatedProductsInCache = products.map((p) => (p.id === productId ? updatedProduct : p))
          await mutate(updatedProductsInCache, false)
          mutate(`/products/${id}`, updatedProduct, false)

          try {
            await apiService.updateProduct(id, updatedProduct)
          } catch (apiError) {
          }

          return updatedProduct
        } catch (error) {
          throw new Error(`Failed to update product: ${error.message}`)
        }
      },

      deleteProduct: async (id) => {
        try {
          const productId = Number.parseInt(id)

          const localProducts = getLocalProducts()
          localProducts[productId] = { deleted: true, deletedAt: Date.now() }
          setLocalProducts(localProducts)

          const updatedProducts = (products || []).filter((p) => p.id !== productId)
          mutate(updatedProducts, false)

          try {
            await apiService.deleteProduct(id)
          } catch (apiError) {
          }

          return true
        } catch (error) {
          throw new Error("Failed to delete product")
        }
      },

      refreshProducts: () => mutate(),

      clearLocalChanges: () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
        mutate()
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

export const useProduct = (id) => {
  const fetcher = useCallback(async () => {
    if (!id) return null

    const localProducts = getLocalProducts()
    const localProduct = localProducts[id]

    if (localProduct?.deleted) {
      return null
    }

    let apiProduct
    try {
      apiProduct = await apiService.getProduct(id)
    } catch (error) {
      return localProduct ? { ...localProduct, rating: localProduct.rating || { rate: 0, count: 0 } } : null
    }

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
          rating: product.rating || { rate: 0, count: 0 },
          id: productId,
        }

        const localProducts = getLocalProducts()
        localProducts[productId] = {
          ...mergedData,
          lastModified: Date.now(),
        }
        setLocalProducts(localProducts)

        mutate(mergedData, false)

        try {
          await apiService.updateProduct(product.id, mergedData)
        } catch (apiError) {
        }

        return mergedData
      } catch (error) {
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
