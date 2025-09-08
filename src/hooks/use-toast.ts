import { useState } from 'react'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastOptions[]>([])

  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    // Simple implementation using alert for now
    // In a real application, this would show a proper toast notification
    if (variant === 'destructive') {
      alert(`Error: ${title}${description ? '\n' + description : ''}`)
    } else {
      alert(`${title}${description ? '\n' + description : ''}`)
    }
    
    // Add to toasts array for future enhancement
    setToasts(prev => [...prev, { title, description, variant }])
  }

  return {
    toast,
    toasts
  }
}