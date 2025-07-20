"use client"

import { create } from "zustand"

export const useSearchDialogStore = create((set) => ({
  searchQuery: "",
  selectedCategory: "all", // To persist category selection within the dialog

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  resetSearchState: () => set({ searchQuery: "", selectedCategory: "all" }), // Reset on page exit or initial load
}))

export const useSearchDialog = () => {
  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, resetSearchState } =
    useSearchDialogStore()
  return { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, resetSearchState }
}
