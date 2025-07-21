"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Star, ShoppingCart, Heart, Share2, ArrowLeft, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart } from "@/hooks/useCart"
import { useProduct } from "@/hooks/useProducts"
import { useToast } from "@/hooks/use-toast"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { useWishlistStore } from "@/hooks/useWishlist"

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, isInCart, getItemQuantity } = useCart()
  const { toast } = useToast()
  const { showModal } = useModal()

  const addToWishlist = useWishlistStore((s) => s.addToWishlist)
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist)
  const wishlistItems = useWishlistStore((s) => s.items)

  const { product, isLoading, error } = useProduct(id)
  const [quantity, setQuantity] = useState(1)

  const isWishlisted = useMemo(() => {
    return product ? wishlistItems.some((item) => item.id === product.id) : false
  }, [product, wishlistItems])

  useEffect(() => {
    setQuantity(1)
  }, [product])

  const productInfo = useMemo(
    () => ({
      isInCart: product ? isInCart(product.id) : false,
      currentQuantity: product ? getItemQuantity(product.id) : 0,
      totalPrice: product ? product.price * quantity : 0,
    }),
    [product, quantity, isInCart, getItemQuantity],
  )

  const renderStars = useCallback((rating) => {
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
  }, [])

  const handleWishlistToggle = useCallback(
    (e) => {
      e?.preventDefault()
      if (!product) return

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

  const handleAddToCart = useCallback(() => {
    if (!product) return

    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }

    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.title} added to your cart.`,
    })
  }, [addToCart, product, quantity, toast])

  const handleQuantityChange = useCallback((change) => {
    setQuantity((prev) => Math.max(1, prev + change))
  }, [])

  const handleShare = useCallback(() => {
    if (navigator.share && product) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard.",
      })
    }
  }, [product, toast])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Product not found</h3>
            <p className="text-muted-foreground">The product you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-lg overflow-hidden">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-full object-contain p-8"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Badge className="mb-2 capitalize bg-gray-100 text-black hover:bg-gray-200 border-gray-300">
              {product.category}
            </Badge>
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                {renderStars(product.rating?.rate)}
                <span className="font-semibold ml-2">{product.rating?.rate || 0}</span>
                <span className="text-muted-foreground">({product.rating?.count || 0} reviews)</span>
              </div>
              {productInfo.isInCart && <Badge variant="outline">{productInfo.currentQuantity} in cart</Badge>}
            </div>

            <div className="text-3xl font-bold text-primary mb-6">${product.price.toFixed(2)}</div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="font-semibold">Quantity:</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="bg-transparent border border-border hover:bg-accent"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  className="bg-transparent border border-border hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-muted-foreground">Total: ${productInfo.totalPrice.toFixed(2)}</span>
            </div>

            <div className="flex space-x-4">
              <Button onClick={handleAddToCart} className="flex-1" size="lg">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleWishlistToggle}
                className="bg-transparent border border-border hover:bg-accent"
              >
                <Heart className={cn("h-5 w-5", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400")} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleShare}
                className="bg-transparent border border-border hover:bg-accent"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU:</span>
              <span>#{product.id.toString().padStart(6, "0")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="capitalize">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Availability:</span>
              <span className="text-green-600">In Stock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
