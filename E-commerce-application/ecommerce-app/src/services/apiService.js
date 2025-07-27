import axios from "axios"

const API_BASE_URL = "https://fakestoreapi.com"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => {
    if (response.config.method === "put" && response.data && !response.data.rating) {
      console.warn("FakeStoreAPI dropped rating field in response - this is expected behavior")
    }
    return response
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export const apiService = {
  getProducts: async () => {
    const response = await apiClient.get("/products")
    return response.data
  },

  getProduct: async (id) => {
    const response = await apiClient.get(`/products/${id}`)
    return response.data
  },

  getProductsByCategory: async (category) => {
    const response = await apiClient.get(`/products/category/${category}`)
    return response.data
  },

  getCategories: async () => {
    const response = await apiClient.get("/products/categories")
    return response.data
  },

  createProduct: async (productData) => {
    const response = await apiClient.post("/products", productData)
    return {
      ...productData,
      id: response.data.id || Date.now(),
      rating: productData.rating || { rate: 0, count: 0 },
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const sanitizedData = {
        ...productData,
        price: typeof productData.price === "string" ? Number.parseFloat(productData.price) : productData.price,
        id: Number.parseInt(id),
      }

      const response = await apiClient.put(`/products/${id}`, sanitizedData)
      return response.data
    } catch (error) {
      console.error("API: Update failed:", error)
      throw error
    }
  },

  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`)
    return response.data
  },

  /**
   * Simulates submitting an order to a backend.
   * @param {object} orderData - The order data to submit.
   * @returns {Promise<{success: boolean, data: object, orderId: string}>} - A promise resolving with the order submission result.
   */
  submitOrder: async (orderData) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    return {
      success: true,
      data: { ...orderData, orderId: mockOrderId, status: "Processing" },
      orderId: mockOrderId,
    }
  },
}
