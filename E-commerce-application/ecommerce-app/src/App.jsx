"use client"

import { useState, useEffect, useCallback } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/layout/Header"
import SearchBar from "@/components/layout/SearchBar"
import Footer from "@/components/layout/Footer"
import HomePage from "@/pages/HomePage"
import ProductsPage from "@/pages/ProductsPage"
import ProductDetailPage from "@/pages/ProductDetailPage"
import CartPage from "@/pages/CartPage"
import CheckoutPage from "@/pages/CheckoutPage"
import AboutPage from "@/pages/AboutPage"
import BlogPage from "@/pages/BlogPage"
import FeedbackPage from "@/pages/FeedbackPage"
import ProfilePage from "@/pages/ProfilePage"
import NotFoundPage from "@/pages/NotFoundPage"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"
import "./App.css"

function App() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  useEffect(() => {
   
    if (typeof window !== "undefined") {
      const handleScroll = () => {
        setShowScrollTop(window.scrollY > 400)
      }

      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <Router>
      {" "}
      {/* Wrap the entire app with BrowserRouter */}
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <SearchBar />
        <main className="flex-1">
          <Routes>
            {" "}
            {/* Define routes here */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} /> {/* Catch-all for 404 */}
          </Routes>
        </main>
        <Footer />
        <Toaster />

        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            variant="default"
            className="fixed bottom-9 right-6 z-40 rounded-full w-9 h-9 p-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            size="sm"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </Router>
  )
}

export default App
