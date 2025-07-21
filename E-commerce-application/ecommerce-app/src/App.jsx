"use client"

import { useState, useEffect, useCallback } from "react"
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Modal from "@/components/ui/modal"
import ErrorBoundary from "@/components/ErrorBoundary"
import HomePage from "@/pages/HomePage"
import ProductsPage from "@/pages/ProductsPage"
import ProductDetailPage from "@/pages/ProductDetailPage"
import CartPage from "@/pages/CartPage"
import CheckoutPage from "@/pages/CheckoutPage"
import AboutPage from "@/pages/AboutPage"
import BlogPage from "@/pages/BlogPage"
import FeedbackPage from "@/pages/FeedbackPage"
import ProfilePage from "@/pages/ProfilePage"
import SearchPage from "@/pages/SearchPage"
import NotFoundPage from "@/pages/NotFoundPage"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"
import "./App.css"

function AppContent() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const location = useLocation()

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

  const hideHeaderFooter = location.pathname === "/search"

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        {!hideHeaderFooter && <Header />}
        <main className="flex-1">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
        {!hideHeaderFooter && <Footer />}
        <Modal />
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
    </ErrorBoundary>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
