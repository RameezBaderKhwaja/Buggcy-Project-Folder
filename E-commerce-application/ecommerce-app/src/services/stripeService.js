import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe("pk_test_51RlaqXK8T6PLQTlTkkRGMQRfbTTzcWz5o7WnyPdbPUXRD8NI8d2juQWLXcnt5zyrmVTbicA5IvPzH7czQS1mQmeJ000dUCCTxX")

export const getStripe = () => stripePromise

export const stripeService = {
  /**
   * Simulates creating a Stripe Payment Intent on a backend.
   * In a real app, this would be an actual API call to your server.
   * For this demo, it just generates a mock client secret.
   * @param {number} amount - The amount to charge in cents.
   * @param {string} currency - The currency (e.g., "usd").
   * @returns {Promise<{clientSecret: string, amount: number, currency: string}>}
   */
  createPaymentIntent: async (amount, currency = "usd") => {
    // Simulate network delay for a server call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // In a real scenario, your server would call Stripe API to get a real client secret.
    // For this client-side demo, we generate a mock one.
    const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
    console.log(`MOCK STRIPE SERVICE: Created mock payment intent for $${(amount / 100).toFixed(2)}`)

    return {
      clientSecret: mockClientSecret,
      amount: Math.round(amount * 100), // Amount in cents
      currency,
    }
  },

  /**
   * Simulates processing a payment on the client-side using Stripe.js.
   * This function will use `stripe.createPaymentMethod` for client-side validation.
   * In a real app, after `createPaymentMethod` succeeds, you'd send the payment method ID
   * to your server to confirm the Payment Intent.
   * @param {object} stripe - The Stripe object from `useStripe()`.
   * @param {object} elements - The Elements object from `useElements()`.
   * @param {object} cardElement - The CardElement instance.
   * @returns {Promise<{paymentMethod: object, error: object}>} - Resolves with paymentMethod or error.
   */
  processPaymentMethod: async (stripe, elements, cardElement) => {
    console.log("STRIPE SERVICE: Attempting to create payment method...")
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    })

    if (error) {
      console.error("STRIPE SERVICE: Error creating payment method:", error)
      return { error }
    }

    console.log("STRIPE SERVICE: Payment method created successfully:", paymentMethod)
    // In a real app, you would now send paymentMethod.id to your backend to confirm the PaymentIntent.
    // For this demo, we'll just return success.
    return { paymentMethod }
  },
}
