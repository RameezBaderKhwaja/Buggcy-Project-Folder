import { loadStripe } from "@stripe/stripe-js"

// Initialize Stripe with my publishable key
const stripePromise = loadStripe(
  "pk_test_51RlaqXK8T6PLQTlTkkRGMQRfbTTzcWz5o7WnyPdbPUXRD8NI8d2juQWLXcnt5zyrmVTbicA5IvPzH7czQS1mQmeJ000dUCCTxX",
)

export const getStripe = () => stripePromise

export const stripeService = {
  // Create payment intent
  createPaymentIntent: async (amount, currency = "usd") => {
    try {
      const response = await fetch("/api/mock-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create payment intent")
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating payment intent:", error)
      throw error
    }
  },

  // Process payment
  processPayment: async (stripe, elements, clientSecret) => {
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      })

      if (error) {
        throw error
      }

      return paymentIntent
    } catch (error) {
      console.error("Error processing payment:", error)
      throw error
    }
  },
}
