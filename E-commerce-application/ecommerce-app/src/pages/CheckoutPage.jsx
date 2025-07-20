"use client"

import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import OrderForm from "@/components/checkout/OrderForm"
import { useCart } from "@/hooks/useCart"

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { items, subtotal, tax, grandTotal, isEmpty } = useCart()
  const [paymentMethod, setPaymentMethod] = useState("stripe") // Lift payment method state

  const stripeFee = useMemo(() => {
    // The fee is always $2, but it's only applied to the total if Stripe is selected.
    return 2.0
  }, [])

  const finalTotal = useMemo(() => {
    // Only add stripeFee if the payment method is 'stripe'
    return grandTotal + (paymentMethod === "stripe" ? stripeFee : 0)
  }, [grandTotal, stripeFee, paymentMethod])

  const handleOrderComplete = (response) => {
    navigate("/", {
      replace: true,
      state: { orderSuccess: true, orderId: response.orderId },
    })
  }

  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Add some products to your cart before checking out.</p>
            <Button onClick={() => navigate("/products")}>Go Shopping</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <OrderForm
            onOrderComplete={handleOrderComplete}
            paymentMethod={paymentMethod} // Pass payment method state
            setPaymentMethod={setPaymentMethod} // Pass setter for payment method
            finalTotal={finalTotal} // Pass final total to OrderForm
          />
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-white rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight mb-1">
                        {item.title.length > 30 ? `${item.title.substring(0, 30)}...` : item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-right">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {/* Stripe fee is now only shown in summary if Stripe is selected */}
                {paymentMethod === "stripe" && (
                  <div className="flex justify-between text-red-600">
                    <span>Stripe Fee:</span>
                    <span>+${stripeFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
