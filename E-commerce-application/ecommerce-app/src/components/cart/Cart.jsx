"use client"

import { useMemo, useCallback } from "react"
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/useCart"
import { Link } from "react-router-dom"

const Cart = () => {
  const { items, total, itemCount, isEmpty, subtotal, tax, grandTotal, removeFromCart, updateQuantity, clearCart } =
    useCart()

  // Memoized cart items with calculations
  const cartItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      itemTotal: item.price * item.quantity,
    }))
  }, [items])

  // Memoized handlers
  const handleQuantityChange = useCallback(
    (productId, newQuantity) => {
      if (newQuantity <= 0) {
        removeFromCart(productId)
      } else {
        updateQuantity(productId, newQuantity)
      }
    },
    [removeFromCart, updateQuantity],
  )

  const handleRemoveItem = useCallback(
    (productId) => {
      removeFromCart(productId)
    },
    [removeFromCart],
  )

  const handleClearCart = useCallback(() => {
    clearCart()
  }, [clearCart])

  if (isEmpty) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-6">Add some products to your cart to get started.</p>
          <Link to="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cart Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shopping Cart ({itemCount} items)</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCart}
            className="text-destructive hover:text-destructive bg-transparent border border-border hover:bg-accent"
          >
            Clear Cart
          </Button>
        </CardHeader>
      </Card>

      {/* Cart Items */}
      <div className="space-y-4">
        {cartItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                {/* Product Image */}
                <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-contain p-2"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2 capitalize">{item.category}</p>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                    <span className="text-muted-foreground">
                      × {item.quantity} = ${item.itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    className="bg-transparent border border-border hover:bg-accent"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    className="bg-transparent border border-border hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Remove Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-destructive hover:text-destructive bg-transparent border border-border hover:bg-accent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>FREE</span>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <Link to="/checkout">
            <Button className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default Cart
