"use client"

import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Star, ShoppingBag, Shield, Truck, Send } from "lucide-react" // Added Send icon
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import ProductList from "@/components/products/ProductList"
import { useProducts } from "@/hooks/useProducts"
import { useModal } from "@/hooks/useModal" // Import useModal

const HomePage = () => {
  const { products: allProducts, isLoading, error, createProduct } = useProducts()
  const { showModal } = useModal() // Use the useModal hook
  const [currentSlide, setCurrentSlide] = useState(0)
  const [newsletterEmail, setNewsletterEmail] = useState("") // State for newsletter email

  // Fixed: Add proper null/undefined checks and default to empty array
  const displayedProducts = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) {
      return []
    }
    return allProducts.slice(0, 8)
  }, [allProducts])

  const heroSlides = useMemo(
    () => [
      {
        id: 1,
        title: "Discover Amazing Products",
        subtitle: "Shop the latest trends and find exactly what you're looking for",
        buttonText: "Shop Now",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "all",
        heroImage: "/placeholder.svg?height=500&width=500",
      },
      {
        id: 2,
        title: "Men's Collection",
        subtitle: "Discover premium men's clothing and accessories",
        buttonText: "Shop Men's",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "men's clothing",
        heroImage: "/placeholder.svg?height=500&width=500",
      },
      {
        id: 3,
        title: "Women's Fashion",
        subtitle: "Elegant and stylish women's clothing collection",
        buttonText: "Shop Women's",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "women's clothing",
        heroImage: "/placeholder.svg?height=500&width=500",
      },
      {
        id: 4,
        title: "Jewelry Collection",
        subtitle: "Beautiful jewelry pieces for every occasion",
        buttonText: "Shop Jewelry",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "jewelery",
        heroImage: "/placeholder.svg?height=500&width=500",
      },
      {
        id: 5,
        title: "Electronics Hub",
        subtitle: "Latest gadgets and electronic devices",
        buttonText: "Shop Electronics",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "electronics",
        heroImage: "/placeholder.svg?height=500&width=500",
      },
    ],
    [],
  )

  const currentSlideData = useMemo(() => {
    const slide = heroSlides[currentSlide]
    let imageUrl = slide.heroImage

    // Fixed: Add proper null/undefined checks
    if (allProducts && Array.isArray(allProducts) && allProducts.length > 0) {
      let productToUse = null

      if (slide.category === "all") {
        productToUse = allProducts.find((p) => p.image && !p.image.includes("placeholder")) || allProducts[0]
      } else {
        const matchingCategoryProducts = allProducts.filter(
          (p) => p.category === slide.category && p.image && !p.image.includes("placeholder"),
        )

        if (slide.category.toLowerCase() === "men's clothing") {
          productToUse = matchingCategoryProducts[1] || matchingCategoryProducts[0]
        } else {
          productToUse = matchingCategoryProducts[0]
        }
      }

      if (productToUse?.image && !productToUse.image.includes("placeholder")) {
        imageUrl = productToUse.image
      }
    }

    return { ...slide, image: imageUrl }
  }, [currentSlide, heroSlides, allProducts])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [heroSlides.length])

  // Handle newsletter submission
  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      showModal({
        title: "Subscribed! 🎉",
        content: "Thank you for subscribing to our newsletter. You'll receive exclusive offers and updates!",
        type: "success",
      })
      setNewsletterEmail("")
    } else {
      showModal({
        title: "Subscription Failed",
        content: "Please enter a valid email address to subscribe.",
        type: "error",
      })
    }
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">Failed to load products. Please try again later.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Hero Section with Light Colors */}
      <section className="relative overflow-hidden">
        <div className={`relative h-[300px] sm:h-[400px] lg:h-[500px] bg-blue-50`}>
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 will-change-transform will-change-opacity"
            style={{
              backgroundImage: `url(${currentSlideData.image})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right center",
            }}
            aria-label={currentSlideData.title}
          ></div>
          {/* Content */}
          <div className="relative z-10 h-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center sm:justify-start">
              <div className="text-left max-w-xl mr-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gray-800 leading-tight">
                  {currentSlideData.title}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                  {currentSlideData.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-start items-start">
                  <Link to={currentSlideData.buttonLink}>
                    <Button
                      size="lg"
                      className="group w-full sm:w-auto bg-primary text-black hover:bg-primary/90 shadow-lg px-8 py-3 font-semibold text-lg"
                    >
                      {currentSlideData.buttonText}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to={currentSlideData.learnMoreLink}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 font-semibold text-lg bg-transparent"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">Featured Products</h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                Discover our hand-picked selection of trending products that our customers love.
              </p>
            </div>
          </div>

          {/* Fixed: Pass displayedProducts directly, not as a prop */}
          <ProductList category={null} searchTerm="" sortBy="default" showCrudButtons={true} viewMode="grid" />

          <div className="text-center mt-8 sm:mt-12">
            <Link to="/products">
              <Button
                variant="outline"
                size="lg"
                className="group bg-transparent hover:bg-accent px-8 py-3 font-semibold border border-border"
              >
                View All Products
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 lg:p-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg lg:text-xl mb-2">Free Shipping</h3>
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                  Free shipping on orders over $50. Fast and reliable delivery to your door.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 lg:p-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg lg:text-xl mb-2">Secure Payment</h3>
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                  Your payment information is encrypted and secure with our trusted payment partners.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6 lg:p-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg lg:text-xl mb-2">Quality Guaranteed</h3>
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                  All products are carefully selected and quality tested before shipping.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-12 w-12 lg:h-16 lg:w-16 text-primary mx-auto mb-4 lg:mb-6" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4">Stay Updated</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 lg:mb-8 leading-relaxed">
              Subscribe to our newsletter and be the first to know about new products and exclusive offers.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 lg:gap-4 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 text-base bg-background w-full"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <Button
                type="submit" // Changed to type="submit"
                variant="outline"
                className="h-12 w-full sm:w-auto px-6 lg:px-8 text-base font-semibold bg-background border border-border hover:bg-accent whitespace-nowrap"
              >
                <Send className="h-4 w-4 mr-2" /> {/* Added Send icon */}
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
