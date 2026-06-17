'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ToastEntry { mensaje: string; id: number }

interface ToastContextType {
  toast: ToastEntry | null
  mostrarToast: (mensaje: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastEntry | null>(null)

  const mostrarToast = useCallback((mensaje: string) => {
    setToast({ mensaje, id: Date.now() })
  }, [])

  return (
    <ToastContext.Provider value={{ toast, mostrarToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
