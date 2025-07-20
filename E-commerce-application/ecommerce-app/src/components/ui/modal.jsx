"use client"

import { useModalStore } from "@/hooks/useModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

const Modal = () => {
  const { isOpen, title, content, type, onConfirm, onCancel, hideModal } = useModalStore()

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />
      default:
        return <Info className="h-6 w-6 text-blue-500" />
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    hideModal()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    hideModal()
  }

  return (
    <Dialog open={isOpen} onOpenChange={hideModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {typeof content === "string" ? <p className="text-muted-foreground">{content}</p> : content}
        </div>
        <DialogFooter>
          {onConfirm ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>Confirm</Button>
            </>
          ) : (
            <Button onClick={hideModal}>OK</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default Modal
