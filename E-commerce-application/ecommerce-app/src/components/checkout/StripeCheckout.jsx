"use client"

import { useState, useEffect } from "react"
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
  const [clientSecret, setClientSecret] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Creates payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const { clientSecret } = await stripeService.createPaymentIntent(amount)
        setClientSecret(clientSecret)
      } catch (err) {
        setError("Failed to initialize payment")
        onError?.(err)
      }
    }

    if (amount > 0) {
      createPaymentIntent()
    }
  }, [amount, onError])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const cardElement = elements.getElement(CardElement)

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        setError(error.message)
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        })
      } else if (paymentIntent.status === "succeeded") {
        toast({
          title: "Payment successful!",
          description: "Your order has been processed.",
        })
        onSuccess?.(paymentIntent)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-md">
            <CardElement options={cardElementOptions} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={!stripe || loading || !clientSecret} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

const StripeCheckout = ({ amount, onSuccess, onError }) => {
  return (
    <Elements stripe={getStripe()}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}

export default StripeCheckout
