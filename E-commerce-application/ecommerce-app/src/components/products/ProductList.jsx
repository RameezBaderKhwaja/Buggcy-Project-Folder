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
    if (!products || !Array.isArray(products)) return []

    const sorted = [...products]
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
      case "rating":
        return sorted.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0))
      case "name":
        return sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
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
        console.log("🔄 ProductList: Handling edit for product", product.id, "with data:", updatedData)
        const result = await updateProduct(product.id, updatedData)
        console.log("✅ ProductList: Edit completed successfully:", result)
        return result
      } catch (error) {
        console.error("❌ ProductList: Failed to update product:", error)
        throw error
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
          <div key={`skeleton-${index}`} className="space-y-4">
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
      {sortedProducts.map((product) => {
        if (!product || !product.id) {
          return null
        }

        return (
          <ProductCard
            key={`product-${product.id}-${product.price}`}
            product={product}
            onAddToCart={handleAddToCart}
            showCrudButtons={showCrudButtons}
            onEdit={handleEdit}
            onDelete={handleDelete}
            viewMode={viewMode}
          />
        )
      })}
    </div>
  )
}

export default ProductList
