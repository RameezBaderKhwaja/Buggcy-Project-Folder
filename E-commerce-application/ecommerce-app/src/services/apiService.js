import axios from "axios"

const API_BASE_URL = "https://fakestoreapi.com"

// Created axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export const apiService = {
  // Get all products
  getProducts: async () => {
    const response = await apiClient.get("/products")
    return response.data
  },

  // Get a single product
  getProduct: async (id) => {
    const response = await apiClient.get(`/products/${id}`)
    return response.data
  },

  // Get products by category
  getProductsByCategory: async (category) => {
    const response = await apiClient.get(`/products/category/${category}`)
    return response.data
  },

  // Get all categories
  getCategories: async () => {
    const response = await apiClient.get("/products/categories")
    return response.data
  },

  // Create a new product (simulated)
  createProduct: async (productData) => {
    const response = await apiClient.post("/products", productData)
    return response.data
  },

  // Update a product (simulated)
  updateProduct: async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData)
    return response.data
  },

  // Delete a product (simulated)
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`)
    return response.data
  },

  // Simulate order submission
  submitOrder: async (orderData) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate successful order
    return {
      success: true,
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      data: orderData,
    }
  },
}
