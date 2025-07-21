"use client"

import { useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { Star, ShoppingCart, Edit, Trash2, MoreVertical, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ProductEditDialog from "./ProductEditDialog"
import { useModal } from "@/hooks/useModal"
import { useWishlist } from "@/hooks/useWishlist"
import { cn } from "@/lib/utils"

const ProductCard = ({ product, onAddToCart, showCrudButtons = false, onEdit, onDelete, viewMode = "grid" }) => {
  const { showModal } = useModal()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const isWishlisted = isInWishlist(product.id)

  const handleAddToCart = useCallback(
    (e) => {
      e.preventDefault()
      if (onAddToCart) {
        onAddToCart(product)
        showModal({
          title: "Added to Cart",
          content: `${product.title} has been added to your cart.`,
          type: "success",
        })
      }
    },
    [product, onAddToCart, showModal],
  )

  const handleWishlistToggle = useCallback(
    (e) => {
      e.preventDefault()
      if (isWishlisted) {
        removeFromWishlist(product.id)
        showModal({
          title: "Removed from Wishlist",
          content: `${product.title} has been removed from your wishlist.`,
          type: "info",
        })
      } else {
        addToWishlist(product)
        showModal({
          title: "Added to Wishlist",
          content: `${product.title} has been added to your wishlist.`,
          type: "success",
        })
      }
    },
    [product, isWishlisted, addToWishlist, removeFromWishlist, showModal],
  )

  const handleEditClick = useCallback((e) => {
    e.preventDefault()
    setShowEditDialog(true)
  }, [])

  const handleEditSave = useCallback(
    async (product, updatedData) => {
      if (onEdit) {
        await onEdit(product, updatedData)
      }
    },
    [onEdit],
  )

  const handleDeleteClick = useCallback((e) => {
    e.preventDefault()
    setShowDeleteDialog(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (onDelete) {
      onDelete(product.id)
      showModal({
        title: "Product Deleted",
        content: `${product.title} has been deleted permanently.`,
        type: "success",
      })
    }
    setShowDeleteDialog(false)
  }, [product, onDelete, showModal])

  const renderStars = (rating) => {
    const stars = []
    const ratingValue = rating || 0
    const fullStars = Math.floor(ratingValue)
    const hasHalfStar = ratingValue % 1 !== 0

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>,
        )
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />)
      }
    }
    return stars
  }

  if (!product || !product.id) {
    return null
  }

  return (
    <>
      <Card
        className={cn(
          "group h-full flex overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative bg-white",
          "hover:shadow-primary/20",
          viewMode === "grid" ? "flex-col" : "flex-row items-center p-4",
        )}
      >
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWishlistToggle}
            className="h-8 w-8 p-0 hover:bg-accent bg-white/80 backdrop-blur-sm border border-border"
          >
            <Heart className={cn("h-4 w-4", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400")} />
          </Button>

          {showCrudButtons && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent bg-white/80 backdrop-blur-sm border border-border"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg">
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {viewMode === "grid" && (
          <CardHeader className="p-4 pb-0">
            <Badge className="w-fit capitalize bg-gray-100 text-black hover:bg-gray-200 border-gray-300">
              {product.category}
            </Badge>
          </CardHeader>
        )}

        <Link
          to={`/product/${product.id}`}
          className={cn("flex-1 flex", viewMode === "grid" ? "flex-col" : "flex-row items-center gap-4 w-full")}
        >
          <div
            className={cn(
              "relative aspect-square overflow-hidden bg-white p-4",
              viewMode === "grid" ? "w-full" : "w-32 h-32 flex-shrink-0",
            )}
          >
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.title}
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <CardContent className={cn("flex-1 flex flex-col", viewMode === "grid" ? "p-4" : "p-0")}>
            {viewMode === "list" && (
              <Badge className="w-fit capitalize mb-2 bg-gray-100 text-black hover:bg-gray-200 border-gray-300">
                {product.category}
              </Badge>
            )}

            {/* Product Title - now shows full name */}
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors text-black flex items-start">
              {product.title}
            </h3>

            {/* Spacer to push stars and price to bottom */}
            <div className="flex-grow" />

            {/* Stars - fixed position relative to bottom */}
            <div className="flex items-center space-x-2 mb-1 h-5">
              <div className="flex items-center space-x-1">
                {renderStars(product.rating?.rate)}
                <span className="text-sm text-gray-600 ml-1">({product.rating?.count})</span>
              </div>
            </div>

            {/* Price - fixed position relative to bottom */}
            <div>
              <span className="text-2xl font-bold text-primary">${product.price?.toFixed(2)}</span>
            </div>
          </CardContent>
        </Link>

        <CardFooter className={cn("p-4 pt-0", viewMode === "list" && "ml-auto flex-shrink-0")}>
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="w-full hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent border border-border text-foreground shadow-sm" // Added shadow-sm
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>

      <ProductEditDialog
        product={product}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleEditSave}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="overflow-y-auto scrollbar-hide max-h-32">
              Are you sure you want to delete "{product.title}"? This will be permanently deleted from your local
              storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ProductCard
