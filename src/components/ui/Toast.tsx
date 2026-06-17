'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

export default function Toast() {
  const { toast } = useToast()
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<{ mensaje: string; id: number } | null>(null)

  useEffect(() => {
    if (!toast) return
    setCurrent(toast)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2800)
    return () => clearTimeout(t)
  }, [toast?.id])

  if (!current) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl transition-all duration-300 whitespace-nowrap ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
      style={{
        background: 'linear-gradient(135deg, #1a1a1a, #141414)',
        border: '1px solid rgba(22,163,74,0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(22,163,74,0.1)',
      }}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#16a34a' }}>
        <Check size={13} strokeWidth={2.5} color="#fff" />
      </div>
      <span className="text-sm font-medium" style={{ color: '#F5F5F5' }}>{current.mensaje}</span>
    </div>
  )
}
