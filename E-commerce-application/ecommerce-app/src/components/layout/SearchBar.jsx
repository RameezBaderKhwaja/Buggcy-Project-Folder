"use client"

import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProducts } from "@/hooks/useProducts" 

const SearchBar = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch all products to use for suggestions
  const { products } = useProducts()

  // Memoize filtered suggestions based on search query
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || !products) return []
    const filtered = products.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    // Limit to top 5 suggestions
    return filtered.slice(0, 5)
  }, [searchQuery, products])

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    // Show suggestions if there's a query and products are available
    setShowSuggestions(value.length > 0 && products.length > 0)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // If a search term is entered, navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (product) => {
    // Navigate to the specific product detail page
    navigate(`/product/${product.id}`)
    setSearchQuery("")
    setShowSuggestions(false)
  }

  return (
    <section className="w-full bg-muted/30 border-b">
      <div className="container py-4 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <Input
            type="text"
            placeholder="Search for products, brands, and more..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery && searchSuggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pr-12 h-12 text-base"
          />
          <Button type="submit" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-4 hover:bg-muted">
            <Search className="h-5 w-5" />
          </Button>

          {/* Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg mt-1 z-50">
              {searchSuggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm border-b last:border-b-0 flex items-center"
                >
                  <Search className="h-4 w-4 inline mr-3 text-muted-foreground" />
                  <span className="truncate">{product.title}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </section>
  )
}

export default SearchBar
