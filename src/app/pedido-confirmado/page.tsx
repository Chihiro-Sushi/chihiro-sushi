'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Phone } from 'lucide-react'
import { useCarrito } from '@/context/CarritoContext'

function PedidoConfirmadoContent() {
  const searchParams = useSearchParams()
  const pedidoId = searchParams.get('pedidoId')
  const { limpiar } = useCarrito()

  useEffect(() => {
    if (pedidoId) limpiar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="text-center max-w-sm">
        <CheckCircle size={64} className="mx-auto mb-6" style={{ color: '#22C55E' }} />
        <h1 className="text-2xl font-black mb-3" style={{ color: '#F5F5F5' }}>
          ¡{pedidoId ? 'Pago exitoso' : 'Pedido confirmado'}!
        </h1>
        <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>
          {pedidoId
            ? 'Tu pago fue procesado correctamente. El encargado preparará tu pedido en breve.'
            : 'Recibimos tu pedido. El encargado lo procesará en breve.'}
        </p>
        <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>
          Si tienes dudas, contáctanos por WhatsApp:
        </p>
        <a
          href="https://wa.me/9843139064"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium mb-6 transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#25D366', color: '#fff' }}
        >
          <Phone size={16} /> (984) 313 9064
        </a>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
          >
            Hacer otro pedido
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PedidoConfirmadoPage() {
  return (
    <Suspense>
      <PedidoConfirmadoContent />
    </Suspense>
  )
}
