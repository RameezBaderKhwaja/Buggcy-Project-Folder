"use client"

import { create } from "zustand"

export const useSearchDialogStore = create((set) => ({
  searchQuery: "",
  selectedCategory: "all",

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  resetSearchState: () => set({ searchQuery: "", selectedCategory: "all" }),
}))

export const useSearchDialog = () => {
  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, resetSearchState } =
    useSearchDialogStore()
  return { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, resetSearchState }
}
