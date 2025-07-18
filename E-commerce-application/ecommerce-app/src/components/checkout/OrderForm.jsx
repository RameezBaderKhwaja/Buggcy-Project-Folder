"use client"

import { useState, useMemo, useCallback } from "react"
import { CreditCard, MapPin, User, Mail, Phone, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StripeCheckout from "./StripeCheckout"
import { useCart } from "@/hooks/useCart"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/services/apiService"

const OrderForm = ({ onOrderComplete }) => {
  const { items, grandTotal, clearCart } = useCart()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("stripe")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zipCode: "",
    country: "PK", 
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    saveInfo: false,
    subscribe: false,
  })

  // Memoized form validation
  const isFormValid = useMemo(() => {
    // Changed 'state' to 'province' in required fields
    const requiredFields = ["firstName", "lastName", "email", "phone", "address", "city", "province", "zipCode"]

    const basicFieldsValid = requiredFields.every((field) => formData[field].trim() !== "")

    if (paymentMethod === "card") {
      const cardFields = ["cardNumber", "expiryDate", "cvv", "cardName"]
      return basicFieldsValid && cardFields.every((field) => formData[field].trim() !== "")
    }

    return basicFieldsValid
  }, [formData, paymentMethod])

  // Memoized order summary
  const orderSummary = useMemo(
    () => ({
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
      total: grandTotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [items, grandTotal],
  )

  // Memoized handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const handleStripeSuccess = useCallback(
    async (paymentIntent) => {
      try {
        const orderData = {
          customer: formData,
          items: orderSummary.items,
          total: orderSummary.total,
          paymentMethod: "stripe",
          paymentIntentId: paymentIntent.id,
          orderDate: new Date().toISOString(),
        }

        const response = await apiService.submitOrder(orderData)

        if (response.success) {
          clearCart()
          toast({
            title: "Order placed successfully!",
            description: `Your order #${response.orderId} has been confirmed.`,
          })

          if (onOrderComplete) {
            onOrderComplete(response)
          }
        }
      } catch (error) {
        console.error("Order submission failed:", error)
        toast({
          title: "Order failed",
          description: "There was an error processing your order. Please try again.",
          variant: "destructive",
        })
      }
    },
    [formData, orderSummary, clearCart, toast, onOrderComplete],
  )

  const handleStripeError = useCallback(
    (error) => {
      console.error("Stripe payment failed:", error)
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
    },
    [toast],
  )

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()

      if (!isFormValid) {
        toast({
          title: "Form incomplete",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      if (paymentMethod === "card") {
        setLoading(true)

        try {
          const orderData = {
            customer: formData,
            items: orderSummary.items,
            total: orderSummary.total,
            paymentMethod: "card",
            orderDate: new Date().toISOString(),
          }

          const response = await apiService.submitOrder(orderData)

          if (response.success) {
            clearCart()
            toast({
              title: "Order placed successfully!",
              description: `Your order #${response.orderId} has been confirmed.`,
            })

            if (onOrderComplete) {
              onOrderComplete(response)
            }
          }
        } catch (error) {
          console.error("Order submission failed:", error)
          toast({
            title: "Order failed",
            description: "There was an error processing your order. Please try again.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    },
    [formData, isFormValid, orderSummary, paymentMethod, clearCart, toast, onOrderComplete],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Shipping Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="province">Province *</Label> {/* Changed label to Province */}
              <Select value={formData.province} onValueChange={(value) => handleInputChange("province", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Punjab">Punjab</SelectItem>
                  <SelectItem value="Sindh">Sindh</SelectItem>
                  <SelectItem value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</SelectItem>
                  <SelectItem value="Balochistan">Balochistan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PK">Pakistan</SelectItem> 
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stripe">Stripe Payment</TabsTrigger>
              <TabsTrigger value="card">Credit Card</TabsTrigger>
            </TabsList>

            <TabsContent value="stripe">
              {isFormValid && (
                <StripeCheckout amount={grandTotal} onSuccess={handleStripeSuccess} onError={handleStripeError} />
              )}
              {!isFormValid && (
                <div className="text-center py-8 text-muted-foreground">
                  Please fill in all required fields above to proceed with payment.
                </div>
              )}
            </TabsContent>

            <TabsContent value="card" className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                  required={paymentMethod === "card"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                    required={paymentMethod === "card"}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange("cvv", e.target.value)}
                      className="pl-10"
                      required={paymentMethod === "card"}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="cardName">Name on Card *</Label>
                <Input
                  id="cardName"
                  value={formData.cardName}
                  onChange={(e) => handleInputChange("cardName", e.target.value)}
                  required={paymentMethod === "card"}
                />
              </div>

              {paymentMethod === "card" && (
                <Button type="submit" className="w-full" size="lg" disabled={loading || !isFormValid}>
                  {loading ? "Processing..." : `Place Order - $${grandTotal.toFixed(2)}`}
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveInfo"
                checked={formData.saveInfo}
                onCheckedChange={(checked) => handleInputChange("saveInfo", checked)}
              />
              <Label htmlFor="saveInfo">Save my information for future orders</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="subscribe"
                checked={formData.subscribe}
                onCheckedChange={(checked) => handleInputChange("subscribe", checked)}
              />
              <Label htmlFor="subscribe">Subscribe to our newsletter for updates and offers</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export default OrderForm
