"use client"

import { useMemo, useCallback } from "react"
import { useProducts } from "@/hooks/useProducts"
import { useCart } from "@/hooks/useCart"
import ProductCard from "./ProductCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const ProductList = ({
  category = null,
  searchTerm = "",
  sortBy = "default",
  showCrudButtons = false,
  viewMode = "grid",
}) => {
  const { products, error, isLoading, refreshProducts, createProduct, updateProduct, deleteProduct } = useProducts(
    category,
    searchTerm,
  )
  const { addToCart } = useCart()

  // Memoized sorted products
  const sortedProducts = useMemo(() => {
    if (!products) return []

    const sorted = [...products]
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price)
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price)
      case "rating":
        return sorted.sort((a, b) => b.rating.rate - a.rating.rate)
      case "name":
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return sorted
    }
  }, [products, sortBy])

  // Memoized handlers
  const handleAddToCart = useCallback(
    (product) => {
      addToCart(product)
    },
    [addToCart],
  )

  const handleEdit = useCallback(
    async (product, updatedData) => {
      try {
        await updateProduct(product.id, updatedData)
      } catch (error) {
        console.error("Failed to update product:", error)
      }
    },
    [updateProduct],
  )

  const handleDelete = useCallback(
    async (productId) => {
      try {
        await deleteProduct(productId)
      } catch (error) {
        console.error("Failed to delete product:", error)
      }
    },
    [deleteProduct],
  )

  const handleCreate = useCallback(
    async (productData) => {
      try {
        await createProduct(productData)
      } catch (error) {
        console.error("Failed to create product:", error)
      }
    },
    [createProduct],
  )

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load products. Please try again.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshProducts}
            className="ml-4 bg-transparent border border-border hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!sortedProducts.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid gap-6",
        viewMode === "grid" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        viewMode === "list" && "grid-cols-1",
      )}
    >
      {sortedProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
          showCrudButtons={showCrudButtons}
          onEdit={handleEdit}
          onDelete={handleDelete}
          viewMode={viewMode} 
        />
      ))}
    </div>
  )
}

export default ProductList
