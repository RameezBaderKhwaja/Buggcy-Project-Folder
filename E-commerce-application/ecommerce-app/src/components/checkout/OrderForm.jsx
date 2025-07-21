"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { CreditCard, MapPin, User, Mail, Phone, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import StripeCheckout from "./StripeCheckout"
import { useCart } from "@/hooks/useCart"
import { useModal } from "@/hooks/useModal"
import { apiService } from "@/services/apiService"
import { useOrders } from "@/hooks/useOrders"
import { cn } from "@/lib/utils"

const OrderForm = ({ onOrderComplete, paymentMethod, setPaymentMethod, finalTotal }) => {
  const { items, grandTotal, clearCart } = useCart()
  const { showModal } = useModal()
  const { addOrder } = useOrders()
  const [loading, setLoading] = useState(false)
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
  const [validationErrors, setValidationErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})

  const validateField = useCallback(
    (name, value) => {
      let error = ""
      switch (name) {
        case "firstName":
        case "lastName":
        case "cardName":
          if (!value.trim()) {
            error = "This field is required."
          } else if (!/^[a-zA-Z\s]+$/.test(value)) {
            error = "Only letters and spaces are allowed."
          } else if (value.trim().length < 2) {
            error = "Must be at least 2 characters."
          }
          break
        case "email":
          if (!value.trim()) {
            error = "Email is required."
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = "Invalid email format."
          }
          break
        case "phone":
          if (!value.trim()) {
            error = "Phone number is required."
          } else if (!/^\+?[0-9\s-]{7,15}$/.test(value)) {
            error = "Invalid phone number format."
          }
          break
        case "address":
          if (!value.trim()) {
            error = "Address is required."
          } else if (value.trim().length < 5) {
            error = "Address must be at least 5 characters."
          }
          break
        case "city":
          if (!value.trim()) {
            error = "City is required."
          } else if (!/^[a-zA-Z\s]+$/.test(value)) {
            error = "Only letters and spaces are allowed."
          }
          break
        case "province":
          if (!value || value === "") {
            error = "Province is required."
          }
          break
        case "zipCode":
          if (!value.trim()) {
            error = "ZIP Code is required."
          } else if (!/^[0-9]{5,10}$/.test(value)) {
            error = "Invalid ZIP Code format (5-10 digits)."
          }
          break
        case "country":
          if (!value || value === "") {
            error = "Country is required."
          }
          break
        case "cardNumber":
          if (paymentMethod === "card") {
            if (!value.trim()) {
              error = "Card number is required."
            } else if (!/^[0-9]{16}$/.test(value.replace(/\s/g, ""))) {
              error = "Invalid card number (16 digits)."
            }
          }
          break
        case "expiryDate":
          if (paymentMethod === "card") {
            if (!value.trim()) {
              error = "Expiry date is required."
            } else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(value)) {
              error = "Invalid format (MM/YY)."
            } else {
              const [month, year] = value.split("/").map(Number)
              const currentYear = new Date().getFullYear() % 100
              const currentMonth = new Date().getMonth() + 1

              if (year < currentYear || (year === currentYear && month < currentMonth)) {
                error = "Card has expired."
              }
            }
          }
          break
        case "cvv":
          if (paymentMethod === "card") {
            if (!value.trim()) {
              error = "CVV is required."
            } else if (!/^[0-9]{3,4}$/.test(value)) {
              error = "Invalid CVV (3 or 4 digits)."
            }
          }
          break
        default:
          break
      }
      return error
    },
    [paymentMethod],
  )

  const validateForm = useCallback(() => {
    const newErrors = {}
    let formIsValid = true
    Object.keys(formData).forEach((name) => {
      if (paymentMethod === "stripe" && ["cardNumber", "expiryDate", "cvv", "cardName"].includes(name)) {
        return
      }
      const error = validateField(name, formData[name])
      if (error) {
        newErrors[name] = error
        formIsValid = false
      }
    })
    setValidationErrors(newErrors)
    return formIsValid
  }, [formData, validateField, paymentMethod])

  const isFormValid = useMemo(() => {
    if (Object.keys(validationErrors).some((key) => validationErrors[key] !== "")) {
      return false
    }
    const requiredFields = ["firstName", "lastName", "email", "phone", "address", "city", "province", "zipCode"]
    const basicFieldsValid = requiredFields.every((field) => formData[field].trim() !== "")

    if (paymentMethod === "card") {
      const cardFields = ["cardNumber", "expiryDate", "cvv", "cardName"]
      return basicFieldsValid && cardFields.every((field) => formData[field].trim() !== "")
    }
    return basicFieldsValid
  }, [formData, paymentMethod, validationErrors])

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
      if (touchedFields[field]) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          [field]: validateField(field, value),
        }))
      }
    },
    [validateField, touchedFields],
  )

  const handleBlur = useCallback(
    (field) => {
      setTouchedFields((prev) => ({ ...prev, [field]: true }))
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        [field]: validateField(field, formData[field]),
      }))
    },
    [validateField, formData],
  )

  useEffect(() => {
    if (paymentMethod === "card") {
      const cardFields = ["cardNumber", "expiryDate", "cvv", "cardName"]
      const newErrors = {}
      cardFields.forEach((field) => {
        newErrors[field] = validateField(field, formData[field])
      })
      setValidationErrors((prevErrors) => ({ ...prevErrors, ...newErrors }))
    } else {
      setValidationErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors }
        delete updatedErrors.cardNumber
        delete updatedErrors.expiryDate
        delete updatedErrors.cvv
        delete updatedErrors.cardName
        return updatedErrors
      })
    }
  }, [paymentMethod, formData, validateField])

  const orderSummary = useMemo(
    () => ({
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        image: item.image,
      })),
      total: grandTotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [items, grandTotal],
  )

  const stripeFee = useMemo(() => {
    return 2.0
  }, [])

  const showSuccessModal = useCallback(
    (orderId) => {
      showModal({
        title: "Order Confirmed! 🎉",
        content: (
          <div className="space-y-4">
            <p className="text-green-600 font-semibold">Your order is on its way!</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Order Details:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span>{orderId}</span>
                </div>
                {orderSummary.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {item.title} (x{item.quantity})
                    </span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 font-semibold">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Estimated delivery: 3-5 business days</p>
          </div>
        ),
        type: "success",
      })
    },
    [orderSummary, finalTotal, showModal],
  )

  const handleStripeSuccess = useCallback(
    async (paymentIntent) => {
      try {
        const orderData = {
          customer: formData,
          items: orderSummary.items,
          total: finalTotal,
          paymentMethod: "stripe",
          paymentIntentId: paymentIntent.id,
          orderDate: new Date().toISOString(),
          status: "Processing",
        }

        const response = await apiService.submitOrder(orderData)

        if (response.success) {
          addOrder(response.data)
          clearCart()
          showSuccessModal(response.orderId)
          if (onOrderComplete) {
            onOrderComplete(response)
          }
        }
      } catch (error) {
        console.error("Order submission failed after Stripe success:", error)
        showModal({
          title: "Order Failed",
          content: "There was an error processing your order. Please try again.",
          type: "error",
        })
      }
    },
    [formData, orderSummary, finalTotal, clearCart, showSuccessModal, onOrderComplete, showModal, addOrder],
  )

  const handleStripeError = useCallback(
    (error) => {
      console.error("Stripe payment failed:", error)
      showModal({
        title: "Payment Failed",
        content: error.message || "There was an error processing your payment. Please try again.",
        type: "error",
      })
    },
    [showModal],
  )

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()

      const formIsValid = validateForm()
      if (!formIsValid) {
        showModal({
          title: "Form Incomplete",
          content: "Please correct the errors in the form.",
          type: "error",
        })
        return
      }

      if (paymentMethod === "stripe") {
        return
      }

      setLoading(true)

      try {
        const orderData = {
          customer: formData,
          items: orderSummary.items,
          total: finalTotal,
          paymentMethod: "card",
          orderDate: new Date().toISOString(),
          status: "Processing",
          orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        }

        const response = await apiService.submitOrder(orderData)

        if (response.success) {
          addOrder(orderData)
          clearCart()
          showSuccessModal(orderData.orderId)
          if (onOrderComplete) {
            onOrderComplete(response)
          }
        }
      } catch (error) {
        console.error("Order submission failed:", error)
        showModal({
          title: "Order Failed",
          content: "There was an error processing your order. Please try again.",
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    },
    [
      formData,
      paymentMethod,
      orderSummary,
      finalTotal,
      clearCart,
      showSuccessModal,
      onOrderComplete,
      showModal,
      validateForm,
      addOrder,
    ],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                onBlur={() => handleBlur("firstName")}
                className={cn(validationErrors.firstName && "border-destructive")}
                required
              />
              {validationErrors.firstName && (
                <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                onBlur={() => handleBlur("lastName")}
                className={cn(validationErrors.lastName && "border-destructive")}
                required
              />
              {validationErrors.lastName && (
                <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.lastName}</p>
              )}
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
                onBlur={() => handleBlur("email")}
                className={cn("pl-10", validationErrors.email && "border-destructive")}
                required
              />
            </div>
            {validationErrors.email && (
              <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.email}</p>
            )}
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
                onBlur={() => handleBlur("phone")}
                className={cn("pl-10", validationErrors.phone && "border-destructive")}
                required
              />
            </div>
            {validationErrors.phone && (
              <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.phone}</p>
            )}
          </div>
        </CardContent>
      </Card>

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
              onBlur={() => handleBlur("address")}
              className={cn(validationErrors.address && "border-destructive")}
              required
            />
            {validationErrors.address && (
              <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                onBlur={() => handleBlur("city")}
                className={cn(validationErrors.city && "border-destructive")}
                required
              />
              {validationErrors.city && (
                <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.city}</p>
              )}
            </div>
            <div>
              <Label htmlFor="province">Province *</Label>
              <Select
                value={formData.province}
                onValueChange={(value) => {
                  handleInputChange("province", value)
                  handleBlur("province")
                }}
              >
                <SelectTrigger className={cn(validationErrors.province && "border-destructive")}>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Punjab">Punjab</SelectItem>
                  <SelectItem value="Sindh">Sindh</SelectItem>
                  <SelectItem value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</SelectItem>
                  <SelectItem value="Balochistan">Balochistan</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.province && (
                <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.province}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                onBlur={() => handleBlur("zipCode")}
                className={cn(validationErrors.zipCode && "border-destructive")}
                required
              />
              {validationErrors.zipCode && (
                <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.zipCode}</p>
              )}
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => {
                  handleInputChange("country", value)
                  handleBlur("country")
                }}
              >
                <SelectTrigger className={cn(validationErrors.country && "border-destructive")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PK">Pakistan</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.country && (
                <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.country}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Method</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="stripe" id="stripe" />
              <Label htmlFor="stripe" className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Stripe Payment</div>
                    <div className="text-sm text-muted-foreground">Secure payment with Stripe</div>
                  </div>
                  <div className="text-sm text-red-600">+${stripeFee.toFixed(2)} processing fee</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex-1">
                <div>
                  <div className="font-medium">Credit Card</div>
                  <div className="text-sm text-muted-foreground">Direct credit card payment</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="mt-6">
            {paymentMethod === "stripe" && (
              <StripeCheckout amount={finalTotal} onSuccess={handleStripeSuccess} onError={handleStripeError} />
            )}

            {paymentMethod === "card" && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                    onBlur={() => handleBlur("cardNumber")}
                    className={cn(validationErrors.cardNumber && "border-destructive")}
                    required
                  />
                  {validationErrors.cardNumber && (
                    <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                      onBlur={() => handleBlur("expiryDate")}
                      className={cn(validationErrors.expiryDate && "border-destructive")}
                      required
                    />
                    {validationErrors.expiryDate && (
                      <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.expiryDate}</p>
                    )}
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
                        onBlur={() => handleBlur("cvv")}
                        className={cn("pl-10", validationErrors.cvv && "border-destructive")}
                        required
                      />
                    </div>
                    {validationErrors.cvv && (
                      <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.cvv}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="cardName">Name on Card *</Label>
                  <Input
                    id="cardName"
                    value={formData.cardName}
                    onChange={(e) => handleInputChange("cardName", e.target.value)}
                    onBlur={() => handleBlur("cardName")}
                    className={cn(validationErrors.cardName && "border-destructive")}
                    required
                  />
                  {validationErrors.cardName && (
                    <p className="text-destructive text-xs mt-1 text-red-500">{validationErrors.cardName}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading || !isFormValid}>
                  {loading ? "Processing..." : `Place Order - $${finalTotal.toFixed(2)}`}
                </Button>
              </div>
            )}

            {!isFormValid && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                Please fill in all required fields and correct any errors to proceed with payment.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Save my information for future orders</Label>
              <RadioGroup
                value={formData.saveInfo ? "yes" : "no"}
                onValueChange={(value) => handleInputChange("saveInfo", value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="saveInfoYes" />
                  <Label htmlFor="saveInfoYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="saveInfoNo" />
                  <Label htmlFor="saveInfoNo">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Subscribe to our newsletter for updates and offers</Label>
              <RadioGroup
                value={formData.subscribe ? "yes" : "no"}
                onValueChange={(value) => handleInputChange("subscribe", value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="subscribeYes" />
                  <Label htmlFor="subscribeYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="subscribeNo" />
                  <Label htmlFor="subscribeNo">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export default OrderForm
  