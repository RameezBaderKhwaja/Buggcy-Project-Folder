"use client"

import { create } from "zustand"

export const useModalStore = create((set) => ({
  isOpen: false,
  title: "",
  content: "",
  type: "info", // info, success, error, warning
  onConfirm: null,
  onCancel: null,

  showModal: ({ title, content, type = "info", onConfirm, onCancel }) => {
    set({
      isOpen: true,
      title,
      content,
      type,
      onConfirm,
      onCancel,
    })
  },

  hideModal: () => {
    set({
      isOpen: false,
      title: "",
      content: "",
      type: "info",
      onConfirm: null,
      onCancel: null,
    })
  },
}))

export const useModal = () => {
  const { showModal, hideModal } = useModalStore()
  return { showModal, hideModal }
}
