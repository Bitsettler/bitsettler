'use client'

// Simple wrapper for existing sonner integration
// Uses the existing Toaster component from the app
import { toast } from 'sonner'

// Re-export toast functions for convenience
export { toast }

// No additional component needed since Toaster is already in layout.tsx
// This file just provides a clean import point for toast functions
export const ToasterClient = {
  success: toast.success,
  error: toast.error,
  info: toast.info,
  warning: toast.warning,
  promise: toast.promise,
}
