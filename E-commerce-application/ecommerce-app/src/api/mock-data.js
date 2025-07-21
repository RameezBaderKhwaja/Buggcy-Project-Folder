// I'll simulate the API response
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { amount, currency } = req.body

    // For demo, I'll return a mock client secret
    const clientSecret = `pi_mock_${Date.now()}_secret_mock`

    res.status(200).json({
      clientSecret,
      amount,
      currency,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
