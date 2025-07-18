"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Star, ShoppingBag, Shield, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import ProductList from "@/components/products/ProductList"
import { useProducts } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useProducts"
import { useToast } from "@/hooks/use-toast"

const HomePage = () => {
  const { products: allProducts, isLoading, createProduct } = useProducts()
  const { categories } = useCategories()
  const { toast } = useToast()

  
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    image: "",
  })

  // Memoized featured products (first 8)
  const displayedProducts = useMemo(() => {
    return allProducts?.slice(0, 8) || []
  }, [allProducts])

  // Hero slides with category-specific images and colors
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
        background: "bg-purple-700", 
      },
      {
        id: 2,
        title: "Men's Collection",
        subtitle: "Discover premium men's clothing and accessories",
        buttonText: "Shop Men's",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "men's clothing",
        background: "bg-slate-800", 
      },
      {
        id: 3,
        title: "Women's Fashion",
        subtitle: "Elegant and stylish women's clothing collection",
        buttonText: "Shop Women's",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "women's clothing",
        background: "bg-pink-700", 
      },
      {
        id: 4,
        title: "Jewelry Collection",
        subtitle: "Beautiful jewelry pieces for every occasion",
        buttonText: "Shop Jewelry",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "jewelery",
        background: "bg-yellow-700", 
      },
      {
        id: 5,
        title: "Electronics Hub",
        subtitle: "Latest gadgets and electronic devices",
        buttonText: "Shop Electronics",
        buttonLink: "/products",
        learnMoreLink: "/about",
        category: "electronics",
        background: "bg-green-700", 
      },
    ],
    [],
  )

  // Dynamically get image for current slide based on category
  const currentSlideData = useMemo(() => {
    const slide = heroSlides[currentSlide]
    let imageUrl = "/placeholder.svg?height=400&width=400" // Default placeholder

    if (slide.category === "all") {
      // For "Discover Amazing Products", pick a general product image if available
      if (allProducts && allProducts.length > 0) {
        imageUrl = allProducts[0].image || imageUrl
      }
    } else {
      // Find an image from products matching the category
      const productWithImage = allProducts?.find(
        (p) => p.category === slide.category && p.image && p.image !== "/placeholder.svg",
      )
      if (productWithImage) {
        imageUrl = productWithImage.image
      }
    }

    return { ...slide, image: imageUrl }
  }, [currentSlide, heroSlides, allProducts])

  // Memoized product handlers
  const handleAddProduct = useCallback(async () => {
    if (!newProduct.title || !newProduct.price || !newProduct.description || !newProduct.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const productData = {
        title: newProduct.title,
        price: Number.parseFloat(newProduct.price),
        description: newProduct.description,
        category: newProduct.category,
        image: newProduct.image || "/placeholder.svg?height=400&width=400",
      }

      await createProduct(productData)

      setNewProduct({ title: "", price: "", description: "", category: "", image: "" })
      setShowAddDialog(false)

      toast({
        title: "Product added",
        description: "New product has been added successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    }
  }, [newProduct, createProduct, toast])

  const handleDialogClose = useCallback(() => {
    setShowAddDialog(false)
    setNewProduct({ title: "", price: "", description: "", category: "", image: "" })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [heroSlides.length])

  return (
    <div className="min-h-screen relative">
      {/* Hero Section with Dynamic Images and Colors */}
      <section className="relative overflow-hidden">
        <div className={`relative h-[300px] sm:h-[400px] lg:h-[500px] ${currentSlideData.background}`}>
          {/* Background Image - Dynamic */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${currentSlideData.image})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right center",
            }}
          >
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-start">
              <div className="text-left max-w-xl mr-auto">
                <h1
                  className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white leading-tight drop-shadow-lg`}
                >
                  {currentSlideData.title}
                </h1>
                <p
                  className={`text-lg sm:text-xl md:text-2xl text-white mb-6 sm:mb-8 opacity-90 leading-relaxed drop-shadow-md`}
                >
                  {currentSlideData.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-start items-center">
                  <Link to={currentSlideData.buttonLink}>
                    <Button
                      size="lg"
                      className="group w-full sm:w-auto bg-white text-black hover:bg-gray-100 shadow-lg px-8 py-3 font-semibold text-lg"
                    >
                      {currentSlideData.buttonText}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to={currentSlideData.learnMoreLink}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 font-semibold text-lg bg-transparent"
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

          <ProductList products={displayedProducts} showCrudButtons={true} />

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
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 max-w-md mx-auto">
              <Input type="email" placeholder="Enter your email" className="flex-1 h-12 text-base bg-background" />
              <Button
                variant="outline"
                className="h-12 px-6 lg:px-8 text-base font-semibold bg-background border border-border hover:bg-accent whitespace-nowrap"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
