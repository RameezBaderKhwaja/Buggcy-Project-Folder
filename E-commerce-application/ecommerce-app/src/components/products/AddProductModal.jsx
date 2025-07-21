"use client"

import { useState, useCallback } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCategories } from "@/hooks/useProducts"
import { useModal } from "@/hooks/useModal"

const AddProductModal = ({ open, onOpenChange, onSave }) => {
  const { categories } = useCategories()
  const { showModal } = useModal()
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    image: "",
  })
  const [dragActive, setDragActive] = useState(false)

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (event) => {
            handleInputChange("image", event.target.result)
          }
          reader.readAsDataURL(file)
        }
      }
    },
    [handleInputChange],
  )

  const handleFileInput = useCallback(
    (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (event) => {
            handleInputChange("image", event.target.result)
          }
          reader.readAsDataURL(file)
        }
      }
    },
    [handleInputChange],
  )

  const handleSave = useCallback(async () => {
    if (!formData.title || !formData.price || !formData.description || !formData.category) {
      showModal({
        title: "Error",
        content: "Please fill in all required fields.",
        type: "error",
      })
      return
    }

    try {
      const productData = {
        title: formData.title,
        price: Number.parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        image: formData.image || "/placeholder.svg?height=400&width=400",
        rating: { rate: 0, count: 0 },
      }

      await onSave(productData)

      setFormData({ title: "", price: "", description: "", category: "", image: "" })
      onOpenChange(false)

      showModal({
        title: "Success",
        content: "New product has been added successfully.",
        type: "success",
      })
    } catch (error) {
      showModal({
        title: "Error",
        content: "Failed to add product. Please try again.",
        type: "error",
      })
    }
  }, [formData, onSave, onOpenChange, showModal])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setFormData({ title: "", price: "", description: "", category: "", image: "" })
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new product. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto scrollbar-hide max-h-96">
          <div>
            <Label htmlFor="add-title">Product Title *</Label>
            <Input
              id="add-title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter product title"
            />
          </div>

          <div>
            <Label htmlFor="add-price">Price ($) *</Label>
            <Input
              id="add-price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="add-category">Category *</Label>
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
            <Label>Product Image</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {formData.image ? (
                <div className="relative">
                  <img
                    src={formData.image || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-transparent"
                    onClick={() => handleInputChange("image", "")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop an image here, or click to select</p>
                  <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="file-upload" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("file-upload").click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="add-description">Description *</Label>
            <Textarea
              id="add-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
              className="scrollbar-hide"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <Label className="text-sm font-medium text-muted-foreground">Initial Rating</Label>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm font-semibold">0/5</span>
              <span className="text-xs text-muted-foreground">(0 reviews)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">New products start with no ratings</p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Add Product
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

export default AddProductModal
