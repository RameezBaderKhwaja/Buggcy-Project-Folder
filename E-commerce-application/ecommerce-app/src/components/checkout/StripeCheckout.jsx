"use client"

import { useState, useCallback } from "react"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard } from "lucide-react"
import { getStripe, stripeService } from "@/services/stripeService"
import { useToast } from "@/hooks/use-toast"

const CheckoutForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // CardElement styling
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  }

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      if (!stripe || !elements) {
        // Disable form submission until Stripe.js has loaded.
        console.log("Stripe.js not loaded yet.")
        return
      }

      setLoading(true)
      setError("")

      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        setError("Card input not found. Please refresh the page.")
        setLoading(false)
        return
      }

      // Use stripeService to create a payment method (client-side validation)
      const { paymentMethod, error: createPaymentMethodError } = await stripeService.processPaymentMethod(
        stripe,
        elements,
        cardElement,
      )

      if (createPaymentMethodError) {
        setError(createPaymentMethodError.message || "Failed to validate card details.")
        toast({
          title: "Payment Failed",
          description: createPaymentMethodError.message || "Please check your card details.",
          variant: "destructive",
        })
        onError?.(createPaymentMethodError)
        setLoading(false)
        return
      }

      try {
        // Simulate a successful payment intent for the demo
        const mockPaymentIntent = {
          id: paymentMethod.id, // Use the payment method ID as a mock payment intent ID
          status: "succeeded",
          amount: Math.round(amount * 100),
          currency: "usd",
        }

        toast({
          title: "Payment Successful!",
          description: "Your payment has been processed.",
        })
        onSuccess?.(mockPaymentIntent)
      } catch (submitError) {
        console.error("Error during order submission after payment method creation:", submitError)
        setError(submitError.message || "An unexpected error occurred during order finalization.")
        toast({
          title: "Order Finalization Failed",
          description: submitError.message || "Please contact support.",
          variant: "destructive",
        })
        onError?.(submitError)
      } finally {
        setLoading(false)
      }
    },
    [stripe, elements, amount, toast, onSuccess, onError],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <CardElement options={cardElementOptions} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!stripe || !elements || loading || amount <= 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay with Stripe - $${amount.toFixed(2)}`
            )}
          </Button>
          {amount <= 0 && (
            <p className="text-sm text-muted-foreground text-center">Add items to cart to proceed with payment.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const StripeCheckout = ({ amount, onSuccess, onError }) => {
  const validAmount = typeof amount === "number" && amount > 0 ? amount : 0.01 // Stripe requires minimum amount

  return (
    <Elements stripe={getStripe()}>
      <CheckoutForm amount={validAmount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}

export default StripeCheckout
