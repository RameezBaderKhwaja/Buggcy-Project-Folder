"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, TrendingUp, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useProducts, useCategories } from "@/hooks/useProducts"
import { useSearchDialog } from "@/hooks/useSearchDialog"
import { cn } from "@/lib/utils"

const SearchPage = () => {
  const navigate = useNavigate()
  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, resetSearchState } = useSearchDialog()

  const { products } = useProducts()
  const { categories } = useCategories()

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory)

  useEffect(() => {
    setLocalSearchQuery(searchQuery)
    setLocalSelectedCategory(selectedCategory)
    return () => resetSearchState()
  }, [])

  const searchSuggestions = useMemo(() => {
    if (!localSearchQuery || !products) return []
    return products
      .filter((item) =>
        [item.title, item.description, item.category].some((field) =>
          field.toLowerCase().includes(localSearchQuery.toLowerCase()),
        ),
      )
      .slice(0, 5)
  }, [localSearchQuery, products])

  const trendingSearches = ["Electronics", "Fashion", "Jewelry", "Men's Clothing", "Women's Clothing", "Home Decor"]

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value
      setLocalSearchQuery(value)
      setSearchQuery(value) // Update global state
    },
    [setSearchQuery],
  )

  const handleCategoryChange = useCallback(
    (value) => {
      setLocalSelectedCategory(value)
      setSelectedCategory(value)
    },
    [setSelectedCategory],
  )

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const params = new URLSearchParams()
      if (localSearchQuery.trim()) params.set("search", localSearchQuery.trim())
      if (localSelectedCategory !== "all") params.set("category", localSelectedCategory)
      navigate(`/products?${params.toString()}`)
    },
    [localSearchQuery, localSelectedCategory, navigate],
  )

  const handleSuggestionClick = useCallback((product) => navigate(`/product/${product.id}`), [navigate])

  const handleTrendingClick = useCallback((term) => navigate(`/products?search=${term}`), [navigate])

  const isSearchActive = localSearchQuery.length > 0

  return (
    <div className="min-h-screen bg-background px-4 py-6 flex flex-col">
      {/* Top Bar: Back Button, Category Select, Search Input */}
      <div className="w-full max-w-4xl mx-auto flex items-center gap-4 mb-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-2 h-auto text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Back</span>
        </Button>

        {/* Category Dropdown */}
        <Select value={localSelectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl border-gray-300 focus:ring-blue-100 focus:border-blue-400 shadow-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <Input
            value={localSearchQuery}
            onChange={handleSearchChange}
            placeholder="Search products, brands, categories..."
            className="w-full pl-12 h-12 rounded-xl border-gray-300 focus:ring-blue-100 focus:border-blue-400 shadow-sm"
            autoFocus
          />
        </form>
      </div>

      {/* Suggestions and Trending */}
      <div className="max-w-4xl mx-auto flex-1 w-full space-y-10">
        {/* Suggestions */}
        {isSearchActive && searchSuggestions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-4">
              <Search className="w-4 h-4" />
              Product Suggestions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {searchSuggestions.map((product) => (
                <Card
                  key={product.id}
                  onClick={() => handleSuggestionClick(product)}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="flex gap-3 items-center p-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img
                        src={product.image || "/placeholder.svg?height=64&width=64&text=No Image"}
                        alt={product.title}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{product.title}</div>
                      <div className="text-xs text-gray-500 capitalize">{product.category}</div>
                      <div className="text-base font-semibold text-primary mt-1">${product.price.toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Trending */}
        <div className={cn("space-y-4", isSearchActive && "pt-6 border-t border-gray-200")}>
          <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending Searches
          </h2>
          <div className="flex flex-wrap gap-3">
            {trendingSearches.map((term) => (
              <Button
                key={term}
                type="button"
                onClick={() => handleTrendingClick(term)}
                variant="outline"
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 shadow-sm border-none"
              >
                {term}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchPage
