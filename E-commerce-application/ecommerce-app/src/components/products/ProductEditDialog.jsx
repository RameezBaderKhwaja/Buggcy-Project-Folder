"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCategories } from "@/hooks/useProducts"
import { useToast } from "@/hooks/use-toast"

const ProductEditDialog = ({ product, open, onOpenChange, onSave }) => {
  const { categories } = useCategories()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    image: "",
  })

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        price: product.price?.toString() || "",
        description: product.description || "",
        category: product.category || "",
        image: product.image || "",
      })
    }
  }, [product])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.price || !formData.description?.trim() || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const priceValue = Number.parseFloat(formData.price)
    if (isNaN(priceValue) || priceValue < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedData = {
        title: formData.title.trim(),
        price: priceValue,
        description: formData.description.trim(),
        category: formData.category,
        image: formData.image.trim() || product.image,
      }

      await onSave(product, updatedData)
      onOpenChange(false)

      toast({
        title: "Product updated",
        description: "Product has been updated successfully.",
      })
    } catch (error) {
      console.error("Edit dialog error:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    if (product) {
      setFormData({
        title: product.title || "",
        price: product.price?.toString() || "",
        description: product.description || "",
        category: product.category || "",
        image: product.image || "",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product information below. The rating will be preserved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto scrollbar-hide max-h-96">
          <div>
            <Label htmlFor="edit-title">Product Title *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter product title"
            />
          </div>
          <div>
            <Label htmlFor="edit-price">Price *</Label>
            <Input
              id="edit-price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="edit-category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-image">Image URL</Label>
            <Input
              id="edit-image"
              value={formData.image}
              onChange={(e) => handleInputChange("image", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
              className="scrollbar-hide"
            />
          </div>

          {product?.rating && (
            <div className="bg-muted/50 p-3 rounded-lg border-l-4 border-l-primary">
              <Label className="text-sm font-medium text-muted-foreground">Current Rating</Label>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-semibold">{product.rating.rate}/5</span>
                <span className="text-xs text-muted-foreground">({product.rating.count} reviews)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Rating preserved</p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 bg-transparent border border-border hover:bg-accent"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductEditDialog
