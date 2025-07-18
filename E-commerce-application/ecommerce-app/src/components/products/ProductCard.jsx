"use client"

import { useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { Star, ShoppingCart, Edit, Trash2, MoreVertical } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils" // Import cn utility

const ProductCard = ({ product, onAddToCart, showCrudButtons = false, onEdit, onDelete, viewMode = "grid" }) => {
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleAddToCart = useCallback(
    (e) => {
      e.preventDefault()
      if (onAddToCart) {
        onAddToCart(product)
        toast({
          title: "Added to cart",
          description: `${product.title} has been added to your cart.`,
        })
      }
    },
    [product, onAddToCart, toast],
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
      toast({
        title: "Product deleted",
        description: `${product.title} has been deleted.`,
        variant: "destructive",
      })
    }
    setShowDeleteDialog(false)
  }, [product, onDelete, toast])

  const truncateTitle = (title, maxLength = 50) => {
    return title.length > maxLength ? title.substring(0, maxLength) + "..." : title
  }

  return (
    <>
      <Card
        className={cn(
          "group h-full flex overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative",
          "hover:shadow-primary/50", // Added glow effect on hover
          viewMode === "grid" ? "flex-col" : "flex-row items-center p-4",
        )}
      >
        {showCrudButtons && (
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent bg-transparent border border-border"
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
          </div>
        )}

        {/* Category Badge moved into CardHeader */}
        {viewMode === "grid" && (
          <CardHeader className="p-4 pb-0">
            <Badge className="w-fit capitalize">{product.category}</Badge>
          </CardHeader>
        )}

        <Link
          to={`/product/${product.id}`}
          className={cn("flex-1 flex", viewMode === "grid" ? "flex-col" : "flex-row items-center gap-4 w-full")}
        >
          <div
            className={cn(
              "relative aspect-square overflow-hidden bg-white p-4",
              viewMode === "grid" ? "w-full" : "w-32 h-32 flex-shrink-0", // Increased size for list view
            )}
          >
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.title}
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <CardContent className={cn("flex-1", viewMode === "grid" ? "p-4" : "p-0")}>
            {viewMode === "list" && <Badge className="w-fit capitalize mb-2">{product.category}</Badge>}
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {truncateTitle(product.title)}
            </h3>

            <div className="flex items-center space-x-2 mb-3">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-muted-foreground">
                  {product.rating?.rate || 0} ({product.rating?.count || 0})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
            </div>
          </CardContent>
        </Link>

        <CardFooter className={cn("p-4 pt-0", viewMode === "list" && "ml-auto flex-shrink-0")}>
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="w-full hover:bg-accent transition-colors bg-transparent border border-border"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
      <ProductEditDialog
        product={product}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleEditSave}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="overflow-y-auto scrollbar-hide max-h-32">
              Are you sure you want to delete "{product.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ProductCard
